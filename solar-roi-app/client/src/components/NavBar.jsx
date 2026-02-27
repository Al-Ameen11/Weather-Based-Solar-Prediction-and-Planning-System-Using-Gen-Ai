import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun } from 'lucide-react';
import './NavBar.css';

function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthed = Boolean(localStorage.getItem('authToken'));

  const links = [
    { to: '/', label: 'Calculator' },
    { to: '/results', label: 'Results' },
    { to: '/recommendations', label: 'Forecast' },
    ...(isAuthed ? [{ to: '/dashboard', label: 'Dashboard' }] : []),
    ...(isAuthed ? [] : [{ to: '/signin', label: 'Sign In' }, { to: '/signup', label: 'Sign Up' }])
  ];

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('solarUserProfile');
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="navbar-brand"><Sun size={22} /><span>Solar ROI Planner</span></div>
      <nav className="navbar-links">
        {links.map((item) => (
          <Link key={item.to} to={item.to} className={`navbar-link ${location.pathname === item.to ? 'active' : ''}`}>{item.label}</Link>
        ))}
        {isAuthed && <button className="navbar-link" onClick={logout} style={{ background:'transparent', border:'none' }}>Logout</button>}
      </nav>
    </header>
  );
}

export default NavBar;
