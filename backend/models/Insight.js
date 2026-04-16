const mongoose = require('mongoose');

const InsightSchema = new mongoose.Schema({
  city:         String,
  event_count:  Number,
  avg_density:  Number,
  max_density:  Number,
  baseline:     Number,
  is_spike:     Boolean,
  spike_score:  Number,
  is_hotspot:   Boolean,
  window_start: String,
  window_end:   String,
  processed_at: String,
}, { collection: 'processed_insights' });

module.exports = mongoose.model('Insight', InsightSchema);