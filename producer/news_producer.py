# producer/news_producer.py

import json
import time
import uuid
import random
from datetime import datetime, timezone
from kafka import KafkaProducer
from faker import Faker
from config import KAFKA_BOOTSTRAP_SERVERS, KAFKA_TOPIC_RAW, LOCATIONS, EVENT_KEYWORDS

fake = Faker()

producer = KafkaProducer(
    bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# News headlines templates — more formal language than tweets
HEADLINE_TEMPLATES = [
    "{keyword} causes disruption in {city}, authorities respond",
    "Breaking: {keyword} reported in {city} area",
    "Live updates: {keyword} situation developing in {city}",
    "Traffic alert: {keyword} on major roads in {city}",
    "{city} witnesses {keyword}, crowd swells to thousands",
    "Emergency services deployed as {keyword} hits {city}",
    "Local administration issues warning after {keyword} in {city}",
]

def generate_news_article():
    location            = random.choice(LOCATIONS)
    event_type, keyword = random.choice(
        [(k, random.choice(v)) for k, v in EVENT_KEYWORDS.items()]
    )
    lat = round(location["lat"] + random.uniform(-0.03, 0.03), 6)
    lon = round(location["lon"] + random.uniform(-0.03, 0.03), 6)

    headline = random.choice(HEADLINE_TEMPLATES).format(
        keyword=keyword,
        city=location["city"]
    )

    # News articles have higher credibility weight — useful later in Spark fusion
    article = {
        "id":           str(uuid.uuid4()),
        "source":       "news",
        "text":         headline + ". " + fake.paragraph(nb_sentences=2),
        "headline":     headline,
        "location":     location["city"],
        "latitude":     lat,
        "longitude":    lon,
        "event_type":   event_type,
        "keywords":     [keyword],
        "intensity":    random.choice(["medium", "high", "high"]),  # news = more serious
        "credibility":  round(random.uniform(0.7, 1.0), 2),         # trust score
        "timestamp":    datetime.now(timezone.utc).isoformat(),
    }
    return article

def run():
    print("📰 News producer started. Sending to Kafka topic:", KAFKA_TOPIC_RAW)
    print("Press Ctrl+C to stop.\n")

    while True:
        article = generate_news_article()

        producer.send(
            KAFKA_TOPIC_RAW,
            key=article["location"].encode('utf-8'),
            value=article
        )

        print(f"[{article['timestamp']}] {article['source']} | {article['location']} | {article['event_type']} | credibility: {article['credibility']}")

        # News comes less frequently than tweets
        time.sleep(random.uniform(5.0, 10.0))

if __name__ == "__main__":
    run()