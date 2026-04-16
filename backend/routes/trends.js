const router  = require('express').Router();
const Insight = require('../models/Insight');

router.get('/', async (req, res) => {
  try {
    const { city, limit = 20 } = req.query;
    const filter = {};
    if (city) filter.city = city;

    const trends = await Insight.find(filter)
      .sort({ processed_at: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, data: trends.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;