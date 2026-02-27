const fs = require('fs');
const path = require('path');
const { callMongoDataApi, hasMongoDataApiConfig } = require('../services/mongoDataApiService');

const dataDir = path.join(__dirname, '..', 'data');
const predictionsFile = path.join(dataDir, 'predictions.json');

function ensureDataStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(predictionsFile)) {
    fs.writeFileSync(predictionsFile, '[]', 'utf-8');
  }
}

function loadPredictionsFromFile() {
  ensureDataStore();

  try {
    const content = fs.readFileSync(predictionsFile, 'utf-8');
    const records = JSON.parse(content);
    return Array.isArray(records) ? records : [];
  } catch (error) {
    console.error('Failed to read predictions store:', error.message);
    return [];
  }
}

function savePredictionToFile(record) {
  const records = loadPredictionsFromFile();
  records.unshift(record);
  fs.writeFileSync(predictionsFile, JSON.stringify(records.slice(0, 100), null, 2), 'utf-8');
}

async function loadPredictions() {
  if (!hasMongoDataApiConfig()) return loadPredictionsFromFile();

  try {
    const response = await callMongoDataApi('find', {
      filter: {},
      sort: { createdAt: -1 },
      limit: 100
    });

    return Array.isArray(response.documents) ? response.documents : [];
  } catch (error) {
    console.error('MongoDB read failed, falling back to local JSON:', error.response?.data || error.message);
    return loadPredictionsFromFile();
  }
}

async function savePrediction(record) {
  if (!hasMongoDataApiConfig()) return savePredictionToFile(record);

  try {
    await callMongoDataApi('insertOne', { document: record });
  } catch (error) {
    console.error('MongoDB write failed, falling back to local JSON:', error.response?.data || error.message);
    savePredictionToFile(record);
  }
}

module.exports = { ensureDataStore, loadPredictions, savePrediction };
