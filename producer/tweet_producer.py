# producer/tweet_producer.py

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

def pick_event():
    """Randomly pick an event type and a matching keyword phrase."""
    event_type = random.choice(list(EVENT_KEYWORDS.keys()))
    keyword    = random.choice(EVENT_KEYWORDS[event_type])
    return event_type, keyword

def add_location_noise(lat, lon):
    """Add small random offset so events don't all land on exact city center."""
    return round(lat + random.uniform(-0.05, 0.05), 6), \
           round(lon + random.uniform(-0.05, 0.05), 6)

def generate_tweet():
    """Build one simulated tweet as a dict."""
    location             = random.choice(LOCATIONS)
    event_type, keyword  = pick_event()
    lat, lon             = add_location_noise(location["lat"], location["lon"])

    intensity = random.choices(
        ["low", "medium", "high", "spike"],
        weights=[40, 35, 20, 5]   # 5% chance of spike — keeps alerts meaningful
    )[0]

    tweet = {
        "id":         str(uuid.uuid4()),
        "source":     "twitter",
        "text":       f"{keyword.capitalize()} reported near {location['city']} area. {fake.sentence()}",
        "location":   location["city"],
        "latitude":   lat,
        "longitude":  lon,
        "event_type": event_type,
        "keywords":   [keyword],
        "intensity":  intensity,
        "timestamp":  datetime.now(timezone.utc).isoformat(),
    }
    return tweet

def run():
    print("🚀 Tweet producer started. Sending to Kafka topic:", KAFKA_TOPIC_RAW)
    print("Press Ctrl+C to stop.\n")

    while True:
        tweet = generate_tweet()

        # Send to Kafka
        # key=city name ensures all events from same city go to same partition
        producer.send(
            KAFKA_TOPIC_RAW,
            key=tweet["location"].encode('utf-8'),
            value=tweet
        )

        print(f"[{tweet['timestamp']}] {tweet['source']} | {tweet['location']} | {tweet['event_type']} | {tweet['intensity']}")

        # Random delay between 0.5 and 2 seconds — mimics real stream variability
        time.sleep(random.uniform(0.5, 2.0))

if __name__ == "__main__":
    run()