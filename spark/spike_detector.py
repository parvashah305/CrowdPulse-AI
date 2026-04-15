# spark/spike_detector.py

from config import SPIKE_THRESHOLD

def is_spike(event_count, baseline_count):
    """
    A spike is when current window count is:
    - Above absolute threshold (SPIKE_THRESHOLD), AND
    - At least 2x the baseline (rolling average of previous windows)
    
    This prevents false alerts in normally busy cities.
    """
    if event_count < SPIKE_THRESHOLD:
        return False
    if baseline_count == 0:
        return event_count >= SPIKE_THRESHOLD
    return event_count >= 2 * baseline_count

def calculate_spike_score(event_count, baseline_count, avg_density):
    """
    Returns a 0-100 score representing how severe the spike is.
    Used for alert priority ranking.
    """
    if baseline_count == 0:
        ratio = 1.0
    else:
        ratio = event_count / max(baseline_count, 1)

    # Weighted combination of count ratio and density
    score = min(100, int((ratio * 40) + (avg_density * 0.6)))
    return score

def build_alert(city, event_count, baseline_count, avg_density,
                dominant_event_type, spike_score, window_start, window_end):
    """
    Builds an alert dict to be saved to MongoDB and pushed to Kafka alerts topic.
    """
    return {
        "city":               city,
        "alert_type":         "crowd_spike",
        "event_count":        event_count,
        "baseline_count":     baseline_count,
        "spike_score":        spike_score,
        "avg_crowd_density":  avg_density,
        "dominant_event":     dominant_event_type,
        "severity":           "critical" if spike_score > 75 else "high" if spike_score > 50 else "medium",
        "window_start":       str(window_start),
        "window_end":         str(window_end),
        "message":            f"Crowd spike detected in {city}: {event_count} events in window (baseline: {baseline_count})",
    }