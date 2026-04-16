const router = require('express').Router();
const Alert  = require('../models/Alert');

router.get('/', async (req, res) => {
  try {
    const { severity, city, limit = 50 } = req.query;
    const filter = {};
    if (severity) filter.severity = severity;
    if (city)     filter.city     = city;

    const alerts = await Alert.find(filter)
      .sort({ created_at: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;