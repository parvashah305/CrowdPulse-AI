# producer/config.py

KAFKA_BOOTSTRAP_SERVERS = 'localhost:9092'
KAFKA_TOPIC_RAW = 'raw-events'

# Indian cities with coordinates (our focus area)
LOCATIONS = [
    {"city": "Chennai",   "lat": 13.0827, "lon": 80.2707},
    {"city": "Mumbai",    "lat": 19.0760, "lon": 72.8777},
    {"city": "Delhi",     "lat": 28.6139, "lon": 77.2090},
    {"city": "Bangalore", "lat": 12.9716, "lon": 77.5946},
    {"city": "Kolkata",   "lat": 22.5726, "lon": 88.3639},
    {"city": "Hyderabad", "lat": 17.3850, "lon": 78.4867},
    {"city": "Pune",      "lat": 18.5204, "lon": 73.8567},
    {"city": "Ahmedabad", "lat": 23.0225, "lon": 72.5714},
]

# Keywords that indicate different event types
EVENT_KEYWORDS = {
    "traffic":  ["traffic jam", "accident", "road block", "congestion", "pile up"],
    "crowd":    ["crowd", "gathering", "protest", "rally", "packed", "stampede"],
    "concert":  ["concert", "show", "festival", "event", "performance", "gig"],
    "weather":  ["flood", "rain", "storm", "cyclone", "waterlogging"],
    "crime":    ["robbery", "fight", "police", "arrest", "incident"],
}
