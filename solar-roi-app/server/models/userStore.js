const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { callMongoDataApi, hasMongoDataApiConfig } = require('../services/mongoDataApiService');

const dataDir = path.join(__dirname, '..', 'data');
const usersFile = path.join(dataDir, 'users.json');

function ensureUserStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]', 'utf-8');
}

function loadUsersFromFile() {
  ensureUserStore();
  try {
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function saveUsersToFile(users) {
  ensureUserStore();
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf-8');
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, original] = String(stored || '').split(':');
  if (!salt || !original) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(original));
}

async function findUserByEmail(email) {
  const normalized = email.toLowerCase();
  if (hasMongoDataApiConfig()) {
    try {
      const response = await callMongoDataApi('findOne', { filter: { email: normalized } }, 'users');
      return response.document || null;
    } catch (e) {
      console.error('Mongo find user failed, fallback file:', e.message);
    }
  }

  return loadUsersFromFile().find((u) => u.email === normalized) || null;
}

async function createUser({ name, email, password }) {
  const normalized = email.toLowerCase();
  const user = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    name,
    email: normalized,
    passwordHash: hashPassword(password)
  };

  if (hasMongoDataApiConfig()) {
    try {
      await callMongoDataApi('insertOne', { document: user }, 'users');
      return user;
    } catch (e) {
      console.error('Mongo create user failed, fallback file:', e.message);
    }
  }

  const users = loadUsersFromFile();
  users.unshift(user);
  saveUsersToFile(users);
  return user;
}

module.exports = { findUserByEmail, createUser, verifyPassword, ensureUserStore };
