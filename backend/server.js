require('dotenv').config({ path: '../.env' });
const express         = require('express');
const cors            = require('cors');
const http            = require('http');
const { Server }      = require('socket.io');
const mongoose        = require('mongoose');

const eventsRouter    = require('./routes/events');
const alertsRouter    = require('./routes/alerts');
const hotspotsRouter  = require('./routes/hotspots');
const trendsRouter    = require('./routes/trends');
const initAlertSocket = require('./sockets/alertSocket');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status:   'ok',
    service:  'CrowdPulse API',
    time:     new Date().toISOString(),
  });
});

// Stats endpoint — quick summary for dashboard header
app.get('/api/stats', async (req, res) => {
  try {
    const Alert   = require('./models/Alert');
    const Event   = require('./models/Event');
    const Insight = require('./models/Insight');

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const [totalEvents, totalAlerts, activeHotspots, criticalAlerts] = await Promise.all([
      Event.countDocuments({ timestamp: { $gte: oneHourAgo } }),
      Alert.countDocuments({ created_at: { $gte: oneHourAgo } }),
      Insight.distinct('city', { is_hotspot: true, processed_at: { $gte: oneHourAgo } }),
      Alert.countDocuments({ severity: 'critical', created_at: { $gte: oneHourAgo } }),
    ]);

    res.json({
      success: true,
      data: {
        events_last_hour:   totalEvents,
        alerts_last_hour:   totalAlerts,
        active_hotspots:    activeHotspots.length,
        critical_alerts:    criticalAlerts,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.use('/api/events',   eventsRouter);
app.use('/api/alerts',   alertsRouter);
app.use('/api/hotspots', hotspotsRouter);
app.use('/api/trends',   trendsRouter);

// Connect MongoDB → then start server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    initAlertSocket(io, mongoose);

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`\n🚀 CrowdPulse API is LIVE`);
      console.log(`   http://localhost:${PORT}/health`);
      console.log(`   http://localhost:${PORT}/api/stats`);
      console.log(`   http://localhost:${PORT}/api/events`);
      console.log(`   http://localhost:${PORT}/api/alerts`);
      console.log(`   http://localhost:${PORT}/api/hotspots`);
      console.log(`   http://localhost:${PORT}/api/trends\n`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });