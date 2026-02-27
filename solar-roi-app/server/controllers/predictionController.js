const { loadPredictions } = require('../models/predictionStore');

async function getPredictions(req, res) {
  const records = await loadPredictions();
  return res.json({ count: records.length, records });
}

module.exports = { getPredictions };
