import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaYoutube, FaSearch, FaExclamationCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';
import './LandingPage.css';

const LandingPage = ({ onAnalyze }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const extractVideoId = (url) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const videoId = extractVideoId(url);
    
    if (videoId) {
      setLoading(true);
      try {
        navigate(`/comments/${videoId}`);
      } catch (err) {
        setError('Failed to analyze video. Please try again.');
        setLoading(false);
      }
    } else {
      setError("Please enter a valid YouTube URL.");
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container fluid className="landing-container py-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="landing-card shadow-lg mx-auto" style={{ maxWidth: '700px' }}>
          <Card.Body className="p-5">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center mb-5"
            >
              <FaYoutube className="youtube-icon mb-4" size={60} color="#FF0000" />
              <h1 className="display-5 fw-bold text-gradient">YouTube Comment Analysis</h1>
              <p className="lead text-muted">
                Analyze sentiment of YouTube video comments with advanced visualization
              </p>
            </motion.div>
            
            <Form onSubmit={handleSubmit} className="analysis-form">
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">
                  <FaYoutube className="me-2" />
                  YouTube Video URL
                </Form.Label>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Form.Control
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError('');
                    }}
                    required
                    className="form-control-lg"
                  />
                </motion.div>
              </Form.Group>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert variant="danger" className="mb-4">
                      <FaExclamationCircle className="me-2" />
                      {error}
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="d-grid"
              >
                <Button 
                  variant="primary" 
                  type="submit" 
                  size="lg"
                  className="submit-button"
                >
                  <FaSearch className="me-2" />
                  Analyze Comments
                </Button>
              </motion.div>
            </Form>
          </Card.Body>
        </Card>
      </motion.div>
    </Container>
  );
};

export default LandingPage;
