import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function SignUpPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/api/auth/signup', { name, email, password });
      localStorage.setItem('authToken', res.data.token);
      localStorage.setItem('authUser', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Sign up failed');
    }
  };

  return (
    <div className="home-page" style={{ paddingTop: '2rem' }}>
      <div className="calculator-card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <h2>Create Account</h2>
        <form onSubmit={handleSubmit} className="calculator-form">
          <input className="input-field" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input-field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input-field" type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <div className="error-message">⚠️ {error}</div>}
          <button className="btn btn-primary btn-large" type="submit">Sign Up</button>
        </form>
        <p style={{ marginTop: '1rem' }}>Already have account? <Link to="/signin">Sign in</Link></p>
      </div>
    </div>
  );
}

export default SignUpPage;
