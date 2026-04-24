# Understanding the CrowdPulse Scoring Logic

The project uses two layers of logic to determine which cities are the highest priority: **Spike Detection** (identifying sudden surges) and **Hotspot Ranking** (ranking based on intensity over time).

---

## 1. How a "Spike" is Detected
Located in: `spark/spike_detector.py` → `is_spike()`

Before we even calculate a score, we check if the current data window (the last 2 minutes) is actually a "spike." Two strict conditions must be met:
1. **Absolute Threshold**: The event count must be greater than `SPIKE_THRESHOLD` (set to 15 in `config.py`). Small clusters of 2-3 events are ignored.
2. **Relative Surge**: The current count must be **at least 2x the baseline**. 
   - *Baseline* = The average count for that city over the previous 10 windows.
   - *Example*: If Bangalore normally has 20 events per minute, a count of 30 is NOT a spike. But 40+ is.

---

## 2. Calculating the "Spike Score" (0–100)
Located in: `spark/spike_detector.py` → `calculate_spike_score()`

Once a spike is confirmed, we assign a score to rank its severity. The formula is:
`Score = (SurgeRatio * 40) + (CrowdDensity * 0.6)`

- **Surge Ratio (40% weight)**: Measures the "shock" factor. `Current Count / Baseline`.
- **Crowd Density (60% weight)**: Measures "danger." A density of 85 (packed stadium) is much more critical than a density of 20 (thin crowd).
- **Result**: A Score > 75 is marked as **CRITICAL**, > 50 as **HIGH**, and rest as **MEDIUM**.

---

## 3. Calculating "Hotspot Rankings"
Located in: `backend/routes/hotspots.js`

The rankings you see on the dashboard are a 30-minute summary of the spike scores:
1. **Windowing**: The API looks at every "Insight" Spark has saved in the last 30 minutes.
2. **Grouping**: It groups these insights by city.
3. **Aggregating**: It calculates the **Average Spike Score** across all 30 minutes for each city.
4. **Ranking**: The city with the highest average score is ranked #1.

### Why this approach?
- A city with one "freak" spike but general calm will have a lower ranking than a city in a sustained 30-minute riot.
- This prevents the "Hotspot Rankings" from flickering or changing too wildly second-by-second.
