const router = require('express').Router();
const Event  = require('../models/Event');

router.get('/', async (req, res) => {
  try {
    const { city, source, event_type, limit = 100 } = req.query;
    const filter = {};
    if (city)       filter.location   = city;
    if (source)     filter.source     = source;
    if (event_type) filter.event_type = event_type;

    const events = await Event.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, count: events.length, data: events });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


module.exports = router;