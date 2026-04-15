# producer/gps_producer.py

import json
import time
import uuid
import random
import math
from datetime import datetime, timezone
from kafka import KafkaProducer
from config import KAFKA_BOOTSTRAP_SERVERS, KAFKA_TOPIC_RAW, LOCATIONS

producer = KafkaProducer(
    bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# Each city has hotspot zones — areas within the city that attract crowds
# These are offsets from city center (lat, lon shift)
CITY_HOTSPOTS = {
    "Chennai":   [(0.02, 0.01), (-0.01, 0.03), (0.04, -0.02)],
    "Mumbai":    [(0.01, 0.02), (-0.02, 0.01), (0.03, 0.03)],
    "Delhi":     [(-0.01, 0.02), (0.02, -0.01), (0.03, 0.02)],
    "Bangalore": [(0.01, -0.01), (-0.02, 0.02), (0.02, 0.01)],
    "Kolkata":   [(0.01, 0.01), (-0.01, -0.02), (0.02, 0.02)],
    "Hyderabad": [(0.02, 0.01), (-0.01, 0.02), (0.01, -0.01)],
    "Pune":      [(0.01, 0.02), (-0.02, 0.01), (0.02, -0.02)],
    "Ahmedabad": [(0.01, -0.01), (-0.01, 0.01), (0.02, 0.02)],
}

# Simulate a "crowd wave" — density builds up then fades
# This is what makes spike detection interesting
class CrowdWave:
    def __init__(self):
        self.active   = False
        self.city     = None
        self.peak     = 0
        self.duration = 0
        self.tick     = 0

    def maybe_trigger(self):
        """5% chance each cycle to start a crowd wave in a random city."""
        if not self.active and random.random() < 0.05:
            self.active   = True
            self.city     = random.choice(list(CITY_HOTSPOTS.keys()))
            self.peak     = random.randint(60, 95)   # density score at peak
            self.duration = random.randint(10, 30)   # how many ticks it lasts
            self.tick     = 0
            print(f"\n🌊 CROWD WAVE starting in {self.city} | peak: {self.peak} | duration: {self.duration} ticks\n")

    def get_density(self, city):
        """Return density score — elevated if this city has an active wave."""
        if self.active and city == self.city:
            # Bell curve shape: rises then falls
            progress = self.tick / self.duration
            wave_density = self.peak * math.sin(math.pi * progress)
            self.tick += 1
            if self.tick >= self.duration:
                self.active = False
                print(f"\n✅ Crowd wave in {self.city} ended.\n")
            return min(100, int(wave_density))
        return random.randint(5, 40)  # normal background density

wave = CrowdWave()

def generate_gps_ping():
    wave.maybe_trigger()
    location = random.choice(LOCATIONS)
    city     = location["city"]

    # Pick a hotspot or random offset
    offsets  = CITY_HOTSPOTS.get(city, [(0, 0)])
    offset   = random.choice(offsets)
    lat      = round(location["lat"] + offset[0] + random.uniform(-0.005, 0.005), 6)
    lon      = round(location["lon"] + offset[1] + random.uniform(-0.005, 0.005), 6)

    density  = wave.get_density(city)

    ping = {
        "id":               str(uuid.uuid4()),
        "source":           "gps",
        "text":             "",           # GPS has no text
        "location":         city,
        "latitude":         lat,
        "longitude":        lon,
        "event_type":       "crowd" if density > 50 else "normal",
        "keywords":         [],
        "intensity":        "spike" if density > 70 else "high" if density > 50 else "low",
        "crowd_density":    density,      # 0–100 score
        "device_count":     random.randint(density * 10, density * 20),
        "timestamp":        datetime.now(timezone.utc).isoformat(),
    }
    return ping

def run():
    print("📡 GPS producer started. Sending to Kafka topic:", KAFKA_TOPIC_RAW)
    print("Press Ctrl+C to stop.\n")

    while True:
        ping = generate_gps_ping()

        producer.send(
            KAFKA_TOPIC_RAW,
            key=ping["location"].encode('utf-8'),
            value=ping
        )

        print(f"[{ping['timestamp']}] {ping['source']} | {ping['location']} | density: {ping['crowd_density']} | {ping['intensity']}")

        # GPS pings are fastest — mimics real device frequency
        time.sleep(random.uniform(0.3, 1.0))

if __name__ == "__main__":
    run()