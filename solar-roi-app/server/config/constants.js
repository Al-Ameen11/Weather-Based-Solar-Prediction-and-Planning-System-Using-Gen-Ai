module.exports = {
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || 'YOUR_OPENWEATHER_API_KEY',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://127.0.0.1:5000/predict',
  MONGODB_DATA_API_URL: process.env.MONGODB_DATA_API_URL || '',
  MONGODB_DATA_API_KEY: process.env.MONGODB_DATA_API_KEY || '',
  MONGODB_DATA_SOURCE: process.env.MONGODB_DATA_SOURCE || 'Cluster0',
  MONGODB_DATABASE: process.env.MONGODB_DATABASE || 'solar_roi',
  MONGODB_COLLECTION: process.env.MONGODB_COLLECTION || 'predictions',
  JWT_SECRET: process.env.JWT_SECRET || 'change-me-secret',
  AUTH_TOKEN_TTL_HOURS: process.env.AUTH_TOKEN_TTL_HOURS || '72'
};
