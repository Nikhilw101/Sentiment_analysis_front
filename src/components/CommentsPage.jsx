import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Alert, Button, Card, Col, Container, Dropdown, 
  ProgressBar, Row, Spinner, ListGroup, Badge, Form 
} from 'react-bootstrap';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { 
  FaChartPie, FaComments, FaExclamationCircle, FaFilter, 
  FaInfoCircle, FaPlus, FaRegFrown, FaRegMeh, FaRegSmile, 
  FaSync, FaSort, FaEye, FaThumbsUp, FaClock 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './CommentsPage.css';
import LoadingSpinner from './LoadingSpinner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ArcElement,
  Tooltip,
  Legend
);

const API_BASE_URL = 'http://localhost:5000';
const COMMENTS_PER_PAGE = 100;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

const commentCache = new Map();

const CommentsPage = () => {
  const { videoId } = useParams();
  const [state, setState] = useState({
    comments: [],
    videoTitle: '',
    videoPublishedAt: '',
    loading: true,
    error: null,
    currentPage: 1,
    filter: 'all',
    sentimentStats: {
      positive: 0,
      negative: 0,
      neutral: 0
    },
    networkStatus: navigator.onLine ? 'online' : 'offline',
    retryCount: 0,
    sortBy: 'recent'
  });

  const sentimentColors = {
    positive: '#28a745',
    negative: '#dc3545',
    neutral: '#ffc107'
  };

  // Network status detection
  useEffect(() => {
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;
      setState(prev => ({
        ...prev,
        networkStatus: isOnline ? 'online' : 'offline',
        ...(isOnline && prev.error?.includes('internet') ? { error: null } : {})
      }));
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    
    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  const processComments = useCallback((comments) => {
    const distribution = comments.reduce((acc, curr) => {
      acc[curr.sentiment] = (acc[curr.sentiment] || 0) + 1;
      return acc;
    }, {});
    
    setState(prev => ({
      ...prev,
      comments,
      sentimentDistribution: distribution,
      loading: false,
      error: null,
      retryCount: 0
    }));
  }, [videoId]);

  const fetchComments = useCallback(async (controller, attempt = 1) => {
    try {
      if (state.networkStatus === 'offline') {
        throw new Error('No internet connection');
      }

      setState(prev => ({
        ...prev,
        loading: true,
        error: null
      }));

      console.log('Fetching comments for video:', videoId);
      const { data } = await apiClient.get('/api/comments', {
        params: { videoId, maxResults: 1000 },
        params: { videoId, maxResults: 1000 },
        signal: controller?.signal
      });
      
      console.log('Received API response:', data);

      if (!data.comments || !Array.isArray(data.comments)) {
        throw new Error('Invalid response format from server');
      }

      setState(prev => ({
        ...prev,
        comments: data.comments,
        videoTitle: data.videoTitle || 'Unknown Title',
        videoPublishedAt: data.videoPublishedAt || '',
        sentimentStats: data.sentimentStats || {
          positive: 0,
          negative: 0,
          neutral: 0
        },
        loading: false,
        error: null,
        retryCount: 0
      }));
    } catch (err) {
      console.error('API Error:', err);
      if (axios.isCancel(err)) return;

      const isNetworkError = !err.response;
      const errorMessage = isNetworkError 
        ? 'Failed to connect to the server' 
        : err.response?.data?.error || err.message;

      if (attempt < 3 && isNetworkError) {
        console.log(`Retrying... Attempt ${attempt + 1}/3`);
        setTimeout(() => fetchComments(controller, attempt + 1), 2000 * attempt);
        setState(prev => ({ 
          ...prev,
          retryCount: attempt,
          loading: `Reconnecting... (Attempt ${attempt + 1}/3)`
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
        retryCount: 0
      }));
    }
  }, [videoId, state.networkStatus]);

  useEffect(() => {
    if (state.networkStatus === 'offline') {
      setState(prev => ({
        ...prev,
        error: 'No internet connection. Please check your network.',
        loading: false
      }));
      return;
    }

    const controller = new AbortController();
    let timeoutId = setTimeout(() => fetchComments(controller), 300);
    
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [fetchComments, state.networkStatus, videoId]);

  const getFilteredAndSortedComments = () => {
    if (!state.comments) return [];
    
    let filteredComments = [...state.comments];
    
    // Apply sentiment filter
    if (state.filter !== 'all') {
      filteredComments = filteredComments.filter(comment => 
        comment.sentiment === state.filter
      );
    }
    
    // Apply sorting
    filteredComments.sort((a, b) => {
      switch (state.sortBy) {
        case 'likes':
          return b.likeCount - a.likeCount;
        case 'positive':
          return b.scores.positive - a.scores.positive;
        case 'negative':
          return b.scores.negative - a.scores.negative;
        case 'neutral':
          return b.scores.neutral - a.scores.neutral;
        default: // recent
          return new Date(b.publishedAt) - new Date(a.publishedAt);
      }
    });
    
    return filteredComments;
  };

  const getPaginatedComments = () => {
    const filteredComments = getFilteredAndSortedComments();
    const startIndex = (state.currentPage - 1) * COMMENTS_PER_PAGE;
    return filteredComments.slice(startIndex, startIndex + COMMENTS_PER_PAGE);
  };

  const totalPages = Math.ceil(getFilteredAndSortedComments().length / COMMENTS_PER_PAGE);

  const chartData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [
      {
        data: [
          state.sentimentStats.positive,
          state.sentimentStats.negative,
          state.sentimentStats.neutral
        ],
        backgroundColor: Object.values(sentimentColors),
        borderColor: Object.values(sentimentColors).map(color => color + '80'),
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 14
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const total = Object.values(state.sentimentStats).reduce((a, b) => a + b, 0);
            const percentage = ((context.raw / total) * 100).toFixed(1);
            return `${context.label}: ${context.raw} (${percentage}%)`;
          }
        }
      }
    }
  };

  if (typeof state.loading === 'string') {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">{state.loading}</p>
        </div>
      </div>
    );
  }

  if (state.loading) {
    return <LoadingSpinner message="Analyzing comments..." />;
  }

  if (state.error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="error-container"
      >
        <Alert variant="danger" className="error-alert">
          <FaExclamationCircle className="me-2" />
          {state.error}
          {state.retryCount > 0 && (
            <motion.div 
              className="mt-3"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <Button 
                variant="outline-danger" 
                size="sm"
                onClick={() => fetchComments(new AbortController())}
              >
                <FaSync className="me-2" />
                Retry Now
              </Button>
            </motion.div>
          )}
        </Alert>
      </motion.div>
    );
  }

  const filteredComments = getFilteredAndSortedComments();
  const paginatedComments = getPaginatedComments();

  return (
    <Container fluid className="comments-container px-lg-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Row className="mb-4">
          <Col>
            <div className="page-header">
              <h1 className="display-5">
                <FaComments className="me-3 text-primary" />
                Sentiment Analysis Results
              </h1>
              <p className="lead text-muted">
                Analyzing {filteredComments.length} comments from "{state.videoTitle}"
              </p>
            </div>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col>
            <Card className="filter-card">
              <Card.Body className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="d-flex align-items-center">
                  <FaFilter className="me-2 text-primary" />
                  <Form.Select
                    value={state.filter}
                    onChange={(e) => setState(prev => ({ 
                      ...prev, 
                      filter: e.target.value,
                      currentPage: 1
                    }))}
                    className="me-3"
                  >
                    <option value="all">All Comments</option>
                    <option value="positive">Positive Only</option>
                    <option value="negative">Negative Only</option>
                    <option value="neutral">Neutral Only</option>
                  </Form.Select>
                </div>

                <div className="d-flex align-items-center">
                  <FaSort className="me-2 text-primary" />
                  <Form.Select
                    value={state.sortBy}
                    onChange={(e) => setState(prev => ({ 
                      ...prev, 
                      sortBy: e.target.value,
                      currentPage: 1
                    }))}
                  >
                    <option value="recent">Most Recent</option>
                    <option value="likes">Most Liked</option>
                    <option value="positive">Highest Positive Score</option>
                    <option value="negative">Highest Negative Score</option>
                    <option value="neutral">Highest Neutral Score</option>
                  </Form.Select>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col lg={6} className="mb-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="chart-card h-100">
                <Card.Body>
                  <h2 className="h4 mb-4">
                    <FaChartPie className="me-2 text-primary" />
                    Sentiment Distribution
                  </h2>
                  <div className="chart-container">
                    <Doughnut data={chartData} options={chartOptions} />
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>

          <Col lg={6} className="mb-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="chart-card h-100">
                <Card.Body>
                  <h2 className="h4 mb-4">
                    <FaInfoCircle className="me-2 text-primary" />
                    Sentiment Overview
                  </h2>
                  <div className="sentiment-stats">
                    {Object.entries(state.sentimentStats).map(([sentiment, count]) => (
                      <div key={sentiment} className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="d-flex align-items-center">
                            {sentiment === 'positive' && <FaRegSmile className="me-2 text-success" />}
                            {sentiment === 'negative' && <FaRegFrown className="me-2 text-danger" />}
                            {sentiment === 'neutral' && <FaRegMeh className="me-2 text-warning" />}
                            <span className="text-capitalize">{sentiment}</span>
                          </div>
                          <span className="badge bg-primary">
                            {count} comments
                          </span>
                        </div>
                        <ProgressBar
                          variant={
                            sentiment === 'positive' ? 'success' :
                            sentiment === 'negative' ? 'danger' :
                            'warning'
                          }
                          now={(count / state.comments.length) * 100}
                          style={{ height: '8px' }}
                        />
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="comments-section">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="h4 mb-0">
                  <FaComments className="me-2 text-primary" />
                  Comments
                </h2>
                <Badge bg="primary" className="comments-count">
                  {filteredComments.length} total
                </Badge>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={state.currentPage + state.filter + state.sortBy}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {paginatedComments.map((comment, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="comment-card mb-3">
                        <Card.Body>
                          <div className="d-flex justify-content-between mb-2">
                            <div className="comment-meta">
                              <FaClock className="me-2 text-muted" />
                              <small className="text-muted">
                                {new Date(comment.publishedAt).toLocaleDateString()}
                              </small>
                            </div>
                            <div className="d-flex align-items-center">
                              <FaThumbsUp className="me-2 text-primary" />
                              <small className="text-muted">
                                {comment.likeCount}
                              </small>
                            </div>
                          </div>
                          <p className="comment-text mb-3">{comment.text}</p>
                          <div className="sentiment-badges">
                            <Badge 
                              bg={
                                comment.sentiment === 'positive' ? 'success' :
                                comment.sentiment === 'negative' ? 'danger' :
                                'warning'
                              }
                              className="me-2"
                            >
                              {comment.sentiment}
                            </Badge>
                            {Object.entries(comment.scores).map(([type, score]) => (
                              <Badge 
                                key={type}
                                bg="light"
                                text="dark"
                                className="me-2"
                              >
                                {type}: {score.toFixed(2)}
                              </Badge>
                            ))}
                          </div>
                        </Card.Body>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>

              {totalPages > 1 && (
                <div className="pagination-container mt-4">
                  <Button
                    variant="outline-primary"
                    disabled={state.currentPage === 1}
                    onClick={() => setState(prev => ({ 
                      ...prev, 
                      currentPage: prev.currentPage - 1 
                    }))}
                  >
                    Previous
                  </Button>
                  <span className="mx-3">
                    Page {state.currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline-primary"
                    disabled={state.currentPage === totalPages}
                    onClick={() => setState(prev => ({ 
                      ...prev, 
                      currentPage: prev.currentPage + 1 
                    }))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </motion.div>
      </motion.div>
    </Container>
  );
};

export default CommentsPage;
