import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import CommentsPage from './components/CommentsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/comments/:videoId" element={<CommentsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
