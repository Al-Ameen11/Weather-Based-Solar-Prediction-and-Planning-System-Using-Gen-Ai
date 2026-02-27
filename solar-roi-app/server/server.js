const express = require('express');
const cors = require('cors');
require('dotenv').config();

const roiRoutes = require('./routes/roiRoutes');
const forecastRoutes = require('./routes/forecastRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');
const { GEMINI_MODEL } = require('./config/constants');
const { hasMongoDataApiConfig } = require('./services/mongoDataApiService');
const { ensureDataStore } = require('./models/predictionStore');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api', roiRoutes);
app.use('/api', forecastRoutes);
app.use('/api', predictionRoutes);
app.use('/api', chatRoutes);
app.use('/api', userRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'Server is running',
    storage: hasMongoDataApiConfig() ? 'mongodb-data-api' : 'local-json-fallback',
    geminiModel: GEMINI_MODEL
  });
});

app.listen(PORT, () => {
  ensureDataStore();
  console.log(`Server running on port ${PORT}`);
  if (hasMongoDataApiConfig()) {
    console.log('MongoDB integration enabled via Data API.');
  } else {
    console.warn('MongoDB Data API env vars are missing; using local JSON fallback storage.');
  }
});
