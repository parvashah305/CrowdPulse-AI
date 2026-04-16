const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  id:            String,
  source:        String,
  text:          String,
  location:      String,
  latitude:      Number,
  longitude:     Number,
  event_type:    String,
  keywords:      [String],
  intensity:     String,
  crowd_density: Number,
  credibility:   Number,
  timestamp:     String,
  processed_at:  String,
}, { collection: 'raw_events' });

module.exports = mongoose.model('Event', EventSchema);