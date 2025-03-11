import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import CommentsPage from './components/CommentsPage';
import 'bootstrap/dist/css/bootstrap.min.css';

function MainContent() {
  const navigate = useNavigate();

  const handleAnalyze = (videoId) => {
    navigate(`/comments/${videoId}`);
  };

  return <LandingPage onAnalyze={handleAnalyze} />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainContent />} />
        <Route path="/comments/:videoId" element={<CommentsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
