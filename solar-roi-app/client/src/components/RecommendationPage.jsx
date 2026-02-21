import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Cloud, CloudRain, Sun, Wind, Droplets, ArrowLeft, 
  TrendingUp, AlertCircle, Calendar 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import './RecommendationPage.css';

function RecommendationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.data;
  
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!data) {
      navigate('/');
      return;
    }

    fetchWeatherForecast();
  }, [data]);

  const fetchWeatherForecast = async () => {
    try {
      const { lat, lon } = data.weatherData.coordinates;
      const response = await axios.get(`/api/weather-forecast?lat=${lat}&lon=${lon}`);
      setForecast(response.data.forecast);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch weather forecast');
      setLoading(false);
    }
  };

  if (!data) return null;

  const getWeatherIcon = (description) => {
    if (description.includes('rain')) return <CloudRain size={32} />;
    if (description.includes('cloud')) return <Cloud size={32} />;
    return <Sun size={32} />;
  };

  const getSolarPotential = (clouds) => {
    if (clouds < 30) return { level: 'Excellent', color: '#00D9A3', percentage: 95 };
    if (clouds < 60) return { level: 'Good', color: '#FFD23F', percentage: 75 };
    return { level: 'Moderate', color: '#FF6B35', percentage: 50 };
  };

  const chartData = forecast.map(day => ({
    date: day.date,
    temp: day.temp,
    clouds: day.clouds,
    potential: getSolarPotential(day.clouds).percentage
  }));

  return (
    <div className="recommendation-page">
      <div className="recommendation-container">
        <button className="back-button" onClick={() => navigate('/results', { state: { data } })}>
          <ArrowLeft size={20} />
          Back to Results
        </button>

        <div className="page-header fade-in">
          <h1 className="page-title">
            <Calendar size={36} />
            5-Day Weather Forecast
          </h1>
          <p className="page-subtitle">
            Solar generation potential for {data.location}
          </p>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading"></div>
            <p>Fetching weather data...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <AlertCircle size={48} />
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="forecast-grid fade-in-delay-1">
              {forecast.map((day, index) => {
                const potential = getSolarPotential(day.clouds);
                return (
                  <div key={index} className="forecast-card">
                    <div className="forecast-date">{day.date}</div>
                    <div className="weather-icon">
                      {getWeatherIcon(day.description)}
                    </div>
                    <div className="forecast-temp">{Math.round(day.temp)}°C</div>
                    <div className="forecast-description">{day.description}</div>
                    
                    <div className="forecast-details">
                      <div className="detail-row">
                        <Droplets size={18} />
                        <span>{day.humidity}%</span>
                      </div>
                      <div className="detail-row">
                        <Wind size={18} />
                        <span>{day.windSpeed} m/s</span>
                      </div>
                      <div className="detail-row">
                        <Cloud size={18} />
                        <span>{day.clouds}%</span>
                      </div>
                    </div>

                    <div className="solar-potential">
                      <div className="potential-label">Solar Potential</div>
                      <div className="potential-bar">
                        <div 
                          className="potential-fill" 
                          style={{ width: `${potential.percentage}%`, background: potential.color }}
                        ></div>
                      </div>
                      <div className="potential-level" style={{ color: potential.color }}>
                        {potential.level}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="chart-section fade-in-delay-2">
              <h2 className="chart-title">
                <TrendingUp size={24} />
                Temperature & Solar Potential Trends
              </h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" />
                    <YAxis stroke="rgba(255,255,255,0.6)" />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(26, 26, 46, 0.95)', 
                        border: '1px solid rgba(255, 107, 53, 0.3)',
                        borderRadius: '12px',
                        color: '#fff'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="temp" 
                      stroke="#FF6B35" 
                      strokeWidth={3}
                      name="Temperature (°C)"
                      dot={{ fill: '#FF6B35', r: 5 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="potential" 
                      stroke="#00D9A3" 
                      strokeWidth={3}
                      name="Solar Potential (%)"
                      dot={{ fill: '#00D9A3', r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="info-box fade-in-delay-3">
              <Sun size={28} />
              <div>
                <h3>Understanding Solar Potential</h3>
                <p>
                  Solar potential is calculated based on cloud coverage and weather conditions. 
                  Lower cloud coverage (below 30%) indicates excellent conditions for solar energy generation, 
                  while higher cloud coverage may reduce efficiency. Your {data.solarROI.systemSizeKW}kW system 
                  is designed to handle varying weather conditions efficiently.
                </p>
              </div>
            </div>

            <div className="recommendation-box fade-in-delay-3">
              <div className="recommendation-header">
                <TrendingUp size={24} />
                <h3>Our Recommendation</h3>
              </div>
              <p>
                Based on the weather forecast and your location in {data.location}, solar panels are a 
                {forecast.filter(d => d.clouds < 50).length >= 3 ? ' highly viable' : ' good'} option. 
                With an average of {Math.round(forecast.reduce((sum, d) => sum + getSolarPotential(d.clouds).percentage, 0) / forecast.length)}% 
                solar potential over the next 5 days, you can expect consistent energy generation.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RecommendationPage;