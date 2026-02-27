const { createUser, findUserByEmail, verifyPassword } = require('../models/userStore');
const { sign } = require('../utils/authToken');

async function signup(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password are required' });
    if (String(password).length < 6) return res.status(400).json({ error: 'password must be at least 6 characters' });

    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'email already registered' });

    const user = await createUser({ name, email, password });
    const token = sign({ sub: user.id, email: user.email, name: user.name });

    return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('signup failed:', error.message);
    return res.status(500).json({ error: 'signup failed' });
  }
}

async function signin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const user = await findUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const token = sign({ sub: user.id, email: user.email, name: user.name });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('signin failed:', error.message);
    return res.status(500).json({ error: 'signin failed' });
  }
}

module.exports = { signup, signin };
