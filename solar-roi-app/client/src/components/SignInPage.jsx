import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/api/auth/signin', { email, password });
      localStorage.setItem('authToken', res.data.token);
      localStorage.setItem('authUser', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Sign in failed');
    }
  };

  return (
    <div className="home-page" style={{ paddingTop: '2rem' }}>
      <div className="calculator-card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <h2>Sign In</h2>
        <form onSubmit={handleSubmit} className="calculator-form">
          <input className="input-field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input-field" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <div className="error-message">⚠️ {error}</div>}
          <button className="btn btn-primary btn-large" type="submit">Sign In</button>
        </form>
        <p style={{ marginTop: '1rem' }}>No account? <Link to="/signup">Sign up</Link></p>
      </div>
    </div>
  );
}

export default SignInPage;
