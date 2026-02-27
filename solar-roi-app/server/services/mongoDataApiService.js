const axios = require('axios');
const {
  MONGODB_DATA_API_URL,
  MONGODB_DATA_API_KEY,
  MONGODB_DATA_SOURCE,
  MONGODB_DATABASE,
  MONGODB_COLLECTION
} = require('../config/constants');

function hasMongoDataApiConfig() {
  return Boolean(MONGODB_DATA_API_URL && MONGODB_DATA_API_KEY);
}

async function callMongoDataApi(action, payload, collection = MONGODB_COLLECTION) {
  const endpoint = `${MONGODB_DATA_API_URL.replace(/\/$/, '')}/action/${action}`;

  const response = await axios.post(
    endpoint,
    {
      dataSource: MONGODB_DATA_SOURCE,
      database: MONGODB_DATABASE,
      collection,
      ...payload
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'api-key': MONGODB_DATA_API_KEY
      },
      timeout: 8000
    }
  );

  return response.data;
}

module.exports = { hasMongoDataApiConfig, callMongoDataApi };
