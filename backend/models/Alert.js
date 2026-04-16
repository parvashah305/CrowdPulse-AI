const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  city:              String,
  alert_type:        String,
  event_count:       Number,
  baseline_count:    Number,
  spike_score:       Number,
  avg_crowd_density: Number,
  dominant_event:    String,
  severity:          String,
  window_start:      String,
  window_end:        String,
  message:           String,
  created_at:        String,
}, { collection: 'alerts' });

module.exports = mongoose.model('Alert', AlertSchema);