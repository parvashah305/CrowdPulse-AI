const Alert = require('../models/Alert');

function initAlertSocket(io, mongoose) {
  io.on('connection', (socket) => {
    console.log('🔌 Frontend connected:', socket.id);

    // Send last 10 alerts immediately so dashboard isn't empty on load
    Alert.find()
      .sort({ created_at: -1 })
      .limit(10)
      .then(alerts => socket.emit('recent_alerts', alerts))
      .catch(err => console.error('Socket init error:', err));

    socket.on('disconnect', () => {
      console.log('🔌 Frontend disconnected:', socket.id);
    });
  });

  // MongoDB Change Stream — fires the INSTANT Spark writes a new alert
  // This is what makes the frontend update in real time with zero polling
  const alertCollection = mongoose.connection.collection('alerts');
  const changeStream = alertCollection.watch(
    [{ $match: { operationType: 'insert' } }]
  );

  changeStream.on('change', (change) => {
    const newAlert = change.fullDocument;
    console.log(`📡 New alert → broadcasting: ${newAlert.city} | ${newAlert.severity}`);
    io.emit('new_alert', newAlert);
  });

  changeStream.on('error', (err) => {
    console.error('Change stream error:', err.message);
  });
}

module.exports = initAlertSocket;