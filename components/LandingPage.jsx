import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';

function LandingPage() {
  const [url, setUrl] = useState('');
  const navigate = useNavigate();

  // Function to extract video ID from URL
  const extractVideoId = (url) => {
    // This regex covers common YouTube URL formats.
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const videoId = extractVideoId(url);
    if (videoId) {
      navigate(`/comments/${videoId}`);
    } else {
      alert("Please enter a valid YouTube URL.");
    }
  };

  return (
    <div className="landing-page container">
      <h1 className="text-center mt-5">YouTube Comments Sentiment Analysis</h1>
      <p className="text-center">Paste a YouTube video URL below to analyze comments sentiment.</p>
      <form onSubmit={handleSubmit} className="d-flex justify-content-center mt-4">
        <input
          type="text"
          className="form-control w-50"
          placeholder="Enter YouTube video URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit" className="btn btn-primary ms-3">Analyze</button>
      </form>
    </div>
  );
}

export default LandingPage;
