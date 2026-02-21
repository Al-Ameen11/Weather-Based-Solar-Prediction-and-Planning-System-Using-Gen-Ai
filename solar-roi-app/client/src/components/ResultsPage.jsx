import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Sun, TrendingUp, DollarSign, Clock, Leaf, Zap, 
  Award, ArrowLeft, ArrowRight, MapPin, ThermometerSun 
} from 'lucide-react';
import './ResultsPage.css';

function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.data;

  if (!data) {
    navigate('/');
    return null;
  }

  const { solarROI, subsidy, recommendation, weatherData } = data;

  const stats = [
    {
      icon: <Sun size={28} />,
      label: 'System Size',
      value: `${solarROI.systemSizeKW} kW`,
      color: '#FF6B35'
    },
    {
      icon: <DollarSign size={28} />,
      label: 'Net Investment',
      value: `₹${parseFloat(solarROI.netCost).toLocaleString('en-IN')}`,
      color: '#F7931E'
    },
    {
      icon: <Clock size={28} />,
      label: 'Payback Period',
      value: `${solarROI.paybackPeriod} years`,
      color: '#FFD23F'
    },
    {
      icon: <TrendingUp size={28} />,
      label: '20-Year Savings',
      value: `₹${parseFloat(solarROI.twentyYearSavings).toLocaleString('en-IN')}`,
      color: '#00D9A3'
    }
  ];

  const details = [
    { label: 'Total System Cost', value: `₹${parseFloat(solarROI.totalCost).toLocaleString('en-IN')}` },
    { label: 'Government Subsidy', value: `₹${parseFloat(solarROI.subsidyAmount).toLocaleString('en-IN')} (${subsidy.subsidy}%)` },
    { label: 'Annual Savings', value: `₹${parseFloat(solarROI.annualSavings).toLocaleString('en-IN')}` },
    { label: 'Annual Generation', value: `${parseFloat(solarROI.annualGeneration).toLocaleString('en-IN')} kWh` },
    { label: 'CO₂ Offset per Year', value: `${solarROI.co2Offset} tons` }
  ];

  return (
    <div className="results-page">
      <div className="results-container">
        <button className="back-button" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          Back to Calculator
        </button>

        <div className="results-header fade-in">
          <div className="location-badge">
            <MapPin size={18} />
            {data.location}
            <span className="temp-badge">
              <ThermometerSun size={16} />
              {weatherData.temp}°C
            </span>
          </div>
          <h1 className="results-title">
            Your Solar ROI Analysis
          </h1>
          <div className={`recommendation-badge ${recommendation.recommended ? 'recommended' : 'consider'}`}>
            {recommendation.recommended ? (
              <>
                <Award size={20} />
                Highly Recommended
              </>
            ) : (
              <>
                <Leaf size={20} />
                Worth Considering
              </>
            )}
          </div>
        </div>

        <div className="stats-grid fade-in-delay-1">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card" style={{ '--accent-color': stat.color }}>
              <div className="stat-icon" style={{ color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-content">
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="details-section fade-in-delay-2">
          <h2 className="section-title">
            <Zap size={24} />
            Detailed Breakdown
          </h2>
          <div className="details-grid">
            {details.map((detail, index) => (
              <div key={index} className="detail-item">
                <span className="detail-label">{detail.label}</span>
                <span className="detail-value">{detail.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="subsidy-section fade-in-delay-3">
          <div className="subsidy-card">
            <div className="subsidy-header">
              <Award size={32} className="subsidy-icon" />
              <div>
                <h3>Government Subsidy Available</h3>
                <p>{subsidy.description}</p>
              </div>
            </div>
            <div className="subsidy-amount">
              Save up to <span className="gradient-text">₹{parseFloat(solarROI.subsidyAmount).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div className="action-buttons fade-in-delay-3">
          <button 
            className="btn btn-primary btn-large"
            onClick={() => navigate('/recommendations', { state: { data } })}
          >
            View Weather Forecast
            <ArrowRight size={20} />
          </button>
        </div>

        <div className="message-box fade-in-delay-3">
          <Leaf size={24} />
          <div>
            <h4>Environmental Impact</h4>
            <p>
              By installing solar panels, you'll offset approximately {solarROI.co2Offset} tons of CO₂ 
              emissions annually. That's equivalent to planting {Math.round(solarROI.co2Offset * 45)} trees per year!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;