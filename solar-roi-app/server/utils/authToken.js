const crypto = require('crypto');
const { JWT_SECRET = 'change-me-secret', AUTH_TOKEN_TTL_HOURS = '72' } = process.env;

function base64Url(input) {
  return Buffer.from(input).toString('base64url');
}

function sign(payload) {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const fullPayload = {
    ...payload,
    exp: Date.now() + Number(AUTH_TOKEN_TTL_HOURS) * 60 * 60 * 1000
  };
  const body = base64Url(JSON.stringify(fullPayload));
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verify(token) {
  if (!token) return null;
  const [header, body, signature] = token.split('.');
  if (!header || !body || !signature) return null;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (expected !== signature) return null;
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
  if (!payload.exp || Date.now() > payload.exp) return null;
  return payload;
}

module.exports = { sign, verify };
