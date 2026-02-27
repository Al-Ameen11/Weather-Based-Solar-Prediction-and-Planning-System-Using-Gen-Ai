import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage.jsx';
import ResultsPage from './components/ResultsPage.jsx';
import RecommendationPage from './components/RecommendationPage.jsx';
import ExistingUserDashboard from './components/ExistingUserDashboard.jsx';
import SignInPage from './components/SignInPage.jsx';
import SignUpPage from './components/SignUpPage.jsx';
import ChatBot from './components/ChatBot.jsx';
import NavBar from './components/NavBar.jsx';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <NavBar />
        <main className="app-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/recommendations" element={<RecommendationPage />} />
            <Route path="/dashboard" element={<ExistingUserDashboard />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
          </Routes>
        </main>
        <ChatBot />
      </div>
    </Router>
  );
}

export default App;
