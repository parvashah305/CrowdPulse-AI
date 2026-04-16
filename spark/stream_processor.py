# spark/stream_processor.py

import json
import os
from datetime import datetime, timezone
from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    from_json, col, window, count, avg, max as spark_max,
    to_timestamp, lit, udf
)
from pyspark.sql.types import (
    StructType, StructField, StringType,
    FloatType, IntegerType, ArrayType, TimestampType
)
from pymongo import MongoClient
import certifi
from config import (
    KAFKA_BOOTSTRAP_SERVERS, MONGODB_URI, MONGODB_DB,
    TOPIC_RAW, TOPIC_PROCESSED, TOPIC_ALERTS,
    WINDOW_DURATION, SLIDE_DURATION,
    SPIKE_THRESHOLD, HOTSPOT_THRESHOLD, JARS_PATH
)
from spike_detector import is_spike, calculate_spike_score, build_alert
from event_classifier import classify_event

# ── 1. Start Spark Session ──────────────────────────────────────────────────
spark = SparkSession.builder \
    .appName("CrowdPulseAI") \
    .config("spark.jars", JARS_PATH) \
    .config("spark.sql.shuffle.partitions", "4") \
    .getOrCreate()

spark.sparkContext.setLogLevel("WARN")  # suppress verbose INFO logs
print("✅ Spark session started")

# ── 2. Define Schema ────────────────────────────────────────────────────────
# Spark needs to know the shape of incoming JSON messages
schema = StructType([
    StructField("id",            StringType(),          True),
    StructField("source",        StringType(),          True),
    StructField("text",          StringType(),          True),
    StructField("location",      StringType(),          True),
    StructField("latitude",      FloatType(),           True),
    StructField("longitude",     FloatType(),           True),
    StructField("event_type",    StringType(),          True),
    StructField("keywords",      ArrayType(StringType()), True),
    StructField("intensity",     StringType(),          True),
    StructField("crowd_density", IntegerType(),         True),
    StructField("device_count",  IntegerType(),         True),
    StructField("credibility",   FloatType(),           True),
    StructField("timestamp",     StringType(),          True),
])

# ── 3. Read from Kafka ──────────────────────────────────────────────────────
raw_stream = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", KAFKA_BOOTSTRAP_SERVERS) \
    .option("subscribe", TOPIC_RAW) \
    .option("startingOffsets", "latest") \
    .load()

print("✅ Connected to Kafka topic:", TOPIC_RAW)

# Kafka delivers messages as binary — decode value bytes to string, then parse JSON
parsed_stream = raw_stream.select(
    from_json(col("value").cast("string"), schema).alias("data"),
    col("timestamp").alias("kafka_timestamp")
).select("data.*", "kafka_timestamp") \
 .withColumn("event_time", to_timestamp(col("timestamp"))) \
 .filter(col("location").isNotNull())

# ── 4. Windowed Aggregation ─────────────────────────────────────────────────
# Group events by city in sliding time windows
# This tells us: "how many events happened in each city in the last 2 minutes?"
windowed = parsed_stream \
    .withWatermark("event_time", "1 minute") \
    .groupBy(
        window(col("event_time"), WINDOW_DURATION, SLIDE_DURATION),
        col("location")
    ).agg(
        count("*").alias("event_count"),
        avg("crowd_density").alias("avg_density"),
        spark_max("crowd_density").alias("max_density"),
    )

# ── 5. Write Raw Events to MongoDB ──────────────────────────────────────────
def write_raw_to_mongo(batch_df, batch_id):
    """Called for each micro-batch of raw events."""
    rows = batch_df.collect()
    if not rows:
        return

    client = MongoClient(MONGODB_URI, tlsCAFile=certifi.where())
    db     = client[MONGODB_DB]

    docs = []
    for row in rows:
        doc = row.asDict()
        # Convert keywords from list to plain list
        if doc.get("keywords"):
            doc["keywords"] = list(doc["keywords"])
        doc["processed_at"] = datetime.now(timezone.utc).isoformat()
        docs.append(doc)

    if docs:
        db.raw_events.insert_many(docs)
        print(f"[Batch {batch_id}] Wrote {len(docs)} raw events to MongoDB")

    client.close()

# ── 6. Process Windowed Results + Detect Spikes ─────────────────────────────
def process_window(batch_df, batch_id):
    """
    For each windowed aggregation batch:
    - Check if any city has a spike
    - Build alerts if so
    - Write insights + alerts to MongoDB
    """
    rows = batch_df.collect()
    if not rows:
        return

    client = MongoClient(MONGODB_URI, tlsCAFile=certifi.where())
    db     = client[MONGODB_DB]

    insights = []
    alerts   = []

    for row in rows:
        city        = row["location"]
        event_count = row["event_count"]
        avg_density = row["avg_density"] or 0
        max_density = row["max_density"] or 0
        win_start   = row["window"]["start"]
        win_end     = row["window"]["end"]

        # Fetch baseline — average event count for this city from last 10 windows
        history = list(db.processed_insights.find(
            {"city": city},
            {"event_count": 1}
        ).sort("processed_at", -1).limit(10))

        baseline = sum(h["event_count"] for h in history) / len(history) if history else 0
        spike    = is_spike(event_count, baseline)
        score    = calculate_spike_score(event_count, baseline, avg_density)

        insight = {
            "city":          city,
            "event_count":   event_count,
            "avg_density":   round(float(avg_density), 2),
            "max_density":   int(max_density),
            "baseline":      round(baseline, 2),
            "is_spike":      spike,
            "spike_score":   score,
            "is_hotspot":    avg_density > HOTSPOT_THRESHOLD,
            "window_start":  str(win_start),
            "window_end":    str(win_end),
            "processed_at":  datetime.now(timezone.utc).isoformat(),
        }
        insights.append(insight)

        if spike:
            alert = build_alert(
                city, event_count, int(baseline),
                round(float(avg_density), 2),
                "crowd", score, win_start, win_end
            )
            alert["created_at"] = datetime.now(timezone.utc).isoformat()
            alerts.append(alert)
            print(f"🚨 SPIKE in {city} | count: {event_count} | baseline: {baseline:.1f} | score: {score}")

    if insights:
        db.processed_insights.insert_many(insights)
        print(f"[Batch {batch_id}] Wrote {len(insights)} insights to MongoDB")

    if alerts:
        db.alerts.insert_many(alerts)
        print(f"[Batch {batch_id}] 🚨 Wrote {len(alerts)} alerts to MongoDB")

    client.close()

# ── 7. Start Streaming Queries ───────────────────────────────────────────────
# Raw events → MongoDB
raw_query = parsed_stream.writeStream \
    .foreachBatch(write_raw_to_mongo) \
    .option("checkpointLocation", "/tmp/crowdpulse/raw") \
    .start()

# Windowed insights + spike detection → MongoDB
window_query = windowed.writeStream \
    .foreachBatch(process_window) \
    .option("checkpointLocation", "/tmp/crowdpulse/windowed") \
    .outputMode("update") \
    .start()

print("\n🚀 CrowdPulse Spark Streaming is LIVE")
print("Listening on topic:", TOPIC_RAW)
print("Writing insights to MongoDB database:", MONGODB_DB)
print("Press Ctrl+C to stop.\n")

# Keep alive until manually stopped
spark.streams.awaitAnyTermination()