import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Leaf, TrendingUp, Clock, Zap, CloudSun, ArrowLeft } from 'lucide-react';

function ExistingUserDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const raw = localStorage.getItem('solarUserProfile');
    if (!token) {
      navigate('/signin');
      return;
    }
    if (!raw) {
      navigate('/');
      return;
    }

    const profile = JSON.parse(raw);
    axios.get('/api/existing-user-dashboard', {
      params: {
        location: profile.location,
        monthlyBill: profile.monthlyBill,
        systemSizeKW: profile.systemSizeKW
      },
      headers: { Authorization: `Bearer ${token}` }
    }).then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 401) navigate('/signin');
        else setError('Could not load existing user dashboard.');
      });
  }, []);

  if (error) return <div style={{ padding: '2rem' }}>{error}</div>;
  if (!data) return <div style={{ padding: '2rem' }}>Loading your solar dashboard...</div>;

  return (
    <div className="results-page">
      <div className="results-container">
        <button className="back-button" onClick={() => navigate('/')}><ArrowLeft size={20} />Back</button>
        <h1 className="results-title">Welcome back! Your Solar Performance Dashboard</h1>

        <div className="stats-grid">
          <div className="stat-card"><TrendingUp size={24} /><div><div className="stat-label">ROI (20Y)</div><div className="stat-value">{data.roiStatus.roiPercent}%</div></div></div>
          <div className="stat-card"><Clock size={24} /><div><div className="stat-label">Payback</div><div className="stat-value">{data.roiStatus.paybackPeriod} years</div></div></div>
          <div className="stat-card"><Zap size={24} /><div><div className="stat-label">Annual Savings</div><div className="stat-value">₹{Number(data.roiStatus.annualSavings).toLocaleString('en-IN')}</div></div></div>
          <div className="stat-card"><Leaf size={24} /><div><div className="stat-label">CO₂ Offset</div><div className="stat-value">{data.roiStatus.co2Offset} tons</div></div></div>
        </div>

        <div className="details-section" style={{ marginTop: '1rem' }}>
          <h2 className="section-title"><CloudSun size={22}/> Tomorrow Forecasted Solar Output</h2>
          <div className="details-grid">
            <div className="detail-item"><span className="detail-label">Date</span><span className="detail-value">{data.tomorrowForecast.date}</span></div>
            <div className="detail-item"><span className="detail-label">Temperature</span><span className="detail-value">{Math.round(data.tomorrowForecast.temperature)}°C</span></div>
            <div className="detail-item"><span className="detail-label">Cloud Cover</span><span className="detail-value">{data.tomorrowForecast.cloudPercent}%</span></div>
            <div className="detail-item"><span className="detail-label">Estimated Generation</span><span className="detail-value">{data.tomorrowForecast.estimatedGenerationKwh} kWh</span></div>
          </div>
          <p style={{ marginTop: '.75rem' }}>{data.tomorrowForecast.efficiencyGuidance}</p>
        </div>

        <div className="subsidy-section" style={{ marginTop: '1rem' }}>
          <div className="subsidy-card">
            <h3>Smart Usage Alerts</h3>
            {data.usageAlerts.map((alert, idx) => (
              <div key={idx} style={{ marginBottom: '.8rem' }}>
                <p>{alert.message}</p>
                {alert.windows && (
                  <ul>
                    {alert.windows.map((w, i) => <li key={i}>{w.time} · Clouds {w.cloudPercent}% · {Math.round(w.temp)}°C</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="message-box" style={{ marginTop: '1rem' }}>
          <Leaf size={22}/>
          <div>
            <h4>AI Efficiency Guidance</h4>
            <p>{data.aiAdvisorSummary}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExistingUserDashboard;
