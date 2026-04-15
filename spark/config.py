# spark/config.py
import os
from dotenv import load_dotenv

load_dotenv('../.env')

KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
MONGODB_URI             = os.getenv('MONGODB_URI')
MONGODB_DB              = 'crowdpulse'

# Kafka topics
TOPIC_RAW        = 'raw-events'
TOPIC_PROCESSED  = 'processed-insights'
TOPIC_ALERTS     = 'alerts'

# Sliding window settings
# Every 1 minute, look at the last 2 minutes of data
WINDOW_DURATION  = '2 minutes'
SLIDE_DURATION   = '1 minute'

# Spike threshold — if event count in a city exceeds this in one window, it's a spike
SPIKE_THRESHOLD  = 15

# Hotspot threshold — crowd density score above this = hotspot
HOTSPOT_THRESHOLD = 60

# JAR path for Kafka connector
import os
JARS_PATH = os.path.join(os.path.dirname(__file__), 'jars', '*')