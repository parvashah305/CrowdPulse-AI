# producer/run_all_producers.py

import threading
import tweet_producer
import news_producer
import gps_producer

def run():
    print("=" * 50)
    print("  CrowdPulse AI — All Producers Starting")
    print("=" * 50)

    # Each producer runs in its own thread so they run simultaneously
    threads = [
        threading.Thread(target=tweet_producer.run, name="TweetProducer"),
        threading.Thread(target=news_producer.run,  name="NewsProducer"),
        threading.Thread(target=gps_producer.run,   name="GPSProducer"),
    ]

    for t in threads:
        t.daemon = True   # threads die when main program exits
        t.start()

    print("\n✅ All 3 producers running. Press Ctrl+C to stop all.\n")

    # Keep main thread alive
    for t in threads:
        t.join()

if __name__ == "__main__":
    run()