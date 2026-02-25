import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun } from 'lucide-react';
import './NavBar.css';

function NavBar() {
  const location = useLocation();

  const links = [
    { to: '/', label: 'Calculator' },
    { to: '/results', label: 'Results' },
    { to: '/recommendations', label: 'Forecast' }
  ];

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <Sun size={22} />
        <span>Solar ROI Planner</span>
      </div>
      <nav className="navbar-links">
        {links.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`navbar-link ${location.pathname === item.to ? 'active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export default NavBar;
