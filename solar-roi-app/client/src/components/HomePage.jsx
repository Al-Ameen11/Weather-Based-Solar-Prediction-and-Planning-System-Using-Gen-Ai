import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Zap, TrendingUp, MapPin, IndianRupee } from 'lucide-react';
import axios from 'axios';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [monthlyBill, setMonthlyBill] = useState('');
  const [systemSizeKW, setSystemSizeKW] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCalculate = async (e) => {
    e.preventDefault();
    setError('');

    if (!location || !monthlyBill) {
      setError('Please fill in all fields');
      return;
    }

    if (systemSizeKW && Number(systemSizeKW) <= 0) {
      setError('System size should be greater than 0 kW');
      return;
    }

    if (monthlyBill < 500) {
      setError('Monthly bill should be at least ₹500 for solar to be viable');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/calculate-roi', {
        location,
        monthlyBill: parseFloat(monthlyBill),
        systemSizeKW: systemSizeKW ? parseFloat(systemSizeKW) : undefined
      });

      navigate('/results', { state: { data: response.data } });
    } catch (err) {
      setError('Failed to calculate ROI. Please check your location and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCalculate(e);
    }
  };


  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="floating-icons">
          <div className="icon-float" style={{ top: '10%', left: '10%' }}>
            <Sun size={40} />
          </div>
          <div className="icon-float" style={{ top: '20%', right: '15%', animationDelay: '1s' }}>
            <Zap size={35} />
          </div>
          <div className="icon-float" style={{ bottom: '15%', left: '15%', animationDelay: '2s' }}>
            <TrendingUp size={38} />
          </div>
        </div>

        <div className="hero-content">
          <div className="hero-text fade-in">
            <h1 className="hero-title">
              Power Your Future with
              <span className="gradient-text"> Solar Energy</span>
            </h1>
            <p className="hero-subtitle">
              Calculate your solar ROI instantly. Discover how much you can save with government subsidies and clean energy.
            </p>
          </div>

          <div className="calculator-card fade-in-delay-1">
            <div className="card-header">
              <Sun className="card-icon" size={32} />
              <h2>Calculate Your Solar ROI</h2>
            </div>

            <form onSubmit={handleCalculate} className="calculator-form">
              <div className="form-group">
                <label htmlFor="location">
                  <MapPin size={20} />
                  Your Location
                </label>
                <input
                  id="location"
                  type="text"
                  className="input-field"
                  placeholder="e.g., Chennai, Tamil Nadu"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bill">
                  <IndianRupee size={20} />
                  Monthly Electricity Bill
                </label>
                <input
                  id="bill"
                  type="number"
                  className="input-field"
                  placeholder="e.g., 3000"
                  value={monthlyBill}
                  onChange={(e) => setMonthlyBill(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  min="0"
                  step="100"
                />
              </div>

              <div className="form-group">
                <label htmlFor="system-size">
                  <Sun size={20} />
                  Solar Panel Size (kW)
                </label>
                <input
                  id="system-size"
                  type="number"
                  className="input-field"
                  placeholder="Optional (e.g., 3.5)"
                  value={systemSizeKW}
                  onChange={(e) => setSystemSizeKW(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  min="0"
                  step="0.1"
                />
                <small className="form-hint">
                  Leave empty to auto-calculate based on your monthly bill.
                </small>
              </div>

              {error && (
                <div className="error-message">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Calculating...
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    Calculate Solar ROI
                  </>
                )}
              </button>
            </form>
          </div>

          
        </div>
      </div>
    </div>
  );
}

export default HomePage;
