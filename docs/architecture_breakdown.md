# CrowdPulse AI: Project Architecture & Data Flow

CrowdPulse AI is a real-time crowd intelligence platform that ingests streaming data from multiple sources, processes it using distributed analytics, and visualizes hotspots and spikes in real-time.

## 🏗️ The 4-Tier Architecture

### Step 1: Data Ingestion (The Producers)
The journey begins in the `producer/` directory.
- **Multiple Sources**: Three independent Python scripts generate synthetic real-time data:
  - `tweet_producer.py`: Simulates social media activity.
  - `news_producer.py`: Simulates breaking news reports.
  - `gps_producer.py`: Simulates mobile device density.
- **Kafka Broker**: All producers send their JSON-encoded events to a local **Apache Kafka** broker on the `raw-events` topic. This acts as a high-throughput buffer.

### Step 2: Distributed Processing (Apache Spark)
The heart of the system is the `spark/` directory.
- **Stream Ingestion**: `stream_processor.py` uses **PySpark Structured Streaming** to subscribe to the Kafka topic.
- **Real-Time Analytics**:
  - **Windowing**: Spark groups events into sliding time windows (e.g., the last 2 minutes of data, updated every minute).
  - **Spike Detection**: The `spike_detector.py` module compares current event counts against historical baselines to identify sudden surges.
  - **Classification**: `event_classifier.py` canonicalizes raw keywords into types like `traffic`, `crime`, or `concert`.
- **Persistence**: Spark writes raw enriched events into `raw_events` and calculated insights into `processed_insights` in **MongoDB Atlas**.

### Step 3: Real-Time API (The Backend)
The bridge between data and the user is in the `backend/` directory.
- **REST Endpoints**: A **Node.js/Express** server provides historical data for trends and global statistics.
- **The "Magic" Link**: `sockets/alertSocket.js` uses **MongoDB Change Streams**. As soon as Spark writes a new alert to the database, MongoDB notifies the Node.js backend, which immediately broadcasts it to the frontend via **Socket.io**.

### Step 4: Live Dashboard (The Frontend)
The final visualization layer is in the `frontend/` directory.
- **Interface**: A modern **React** application built with Vite and Framer Motion.
- **Visuals**:
  - **Heatmap**: Uses `react-leaflet` to show a live density map of India.
  - **Charts**: Uses `recharts` to show activity trends for selected cities.
  - **Alerts**: A notification panel that pops up new spike detections in real-time without refreshing the page.

---

## 🚀 Execution Flow (Step-by-Step)
1. **Producer** generates a "Protest" event in Mumbai → sends to Kafka.
2. **Spark** reads from Kafka → detects it's a "Spike" (count 20 vs baseline 5).
3. **Spark** saves the Alert and the Insight to MongoDB Atlas.
4. **MongoDB** triggers a Change Event.
5. **Backend** receives the change event → emits `new_alert` over WebSockets.
6. **Frontend** receives `new_alert` → pulses the red light and adds Mumbai to the top of the Alert Panel instantly.
