import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Alert, Button, Card, Col, Container, Dropdown, 
  ProgressBar, Row, Spinner, ListGroup, Badge
} from 'react-bootstrap';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { 
  FaChartPie, FaComments, FaExclamationCircle, FaFilter, 
  FaInfoCircle, FaPlus, FaRegFrown, FaRegMeh, FaRegSmile, FaSync 
} from 'react-icons/fa';

ChartJS.register(ArcElement, Tooltip, Legend);

const API_BASE_URL = 'http://localhost:5000';
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

const commentCache = new Map();

const CommentsPage = () => {
  const { videoId } = useParams();
  const [state, setState] = useState({
    comments: [],
    loading: true,
    error: null,
    visibleComments: 50,
    filter: 'all',
    sentimentDistribution: {},
    networkStatus: navigator.onLine ? 'online' : 'offline',
    retryCount: 0
  });

  const sentimentColors = {
    positive: '#28a745',
    negative: '#dc3545',
    neutral: '#ffc107',
    mixed: '#17a2b8'
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

      const { data } = await apiClient.get('/api/comments', {
        params: { videoId, maxResults: 500 },
        signal: controller?.signal
      });
      
      processComments(data.comments);
    } catch (err) {
      if (axios.isCancel(err)) return;

      const isNetworkError = !err.response;
      const errorMessage = isNetworkError 
        ? 'Failed to connect to the server' 
        : err.response?.data?.error || err.message;

      if (attempt < 3 && isNetworkError) {
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
  }, [videoId, processComments, state.networkStatus]);

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

  const getProgressBar = (count, variant) => (
    <div className="mb-3">
      <div className="d-flex justify-content-between mb-1">
        <small>{variant.charAt(0).toUpperCase() + variant.slice(1)}</small>
        <small>{Math.round((count / state.comments.length) * 100)}%</small>
      </div>
      <ProgressBar 
        variant={variant}
        now={(count / state.comments.length) * 100}
        style={{ height: '8px' }}
      />
    </div>
  );

  if (typeof state.loading === 'string') {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">{state.loading}</p>
      </div>
    );
  }

  if (state.loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Analyzing comments...</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <Alert variant="danger" className="mt-5 mx-3">
        <FaExclamationCircle className="me-2" />
        {state.error}
        {state.retryCount > 0 && (
          <div className="mt-2">
            <Button 
              variant="outline-danger" 
              size="sm"
              onClick={() => fetchComments(new AbortController())}
            >
              <FaSync className="me-2" />
              Retry Now
            </Button>
          </div>
        )}
      </Alert>
    );
  }

  return (
    <Container fluid className="comments-container px-lg-5">
      <Row className="mb-4">
        <Col>
          <h2 className="display-5 text-center mb-3">
            <FaComments className="me-2 text-primary" />
            Sentiment Analysis for Video: {videoId}
          </h2>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col xl={3} lg={4}>
          <Card className="h-100 shadow">
            <Card.Header className="bg-primary text-white d-flex align-items-center">
              <FaInfoCircle className="me-2" />
              Sentiment Summary
            </Card.Header>
            <Card.Body>
              {getProgressBar(state.sentimentDistribution.positive || 0, 'success')}
              {getProgressBar(state.sentimentDistribution.negative || 0, 'danger')}
              {getProgressBar(state.sentimentDistribution.neutral || 0, 'warning')}
              {getProgressBar(state.sentimentDistribution.mixed || 0, 'info')}
            </Card.Body>
          </Card>
        </Col>

        <Col xl={9} lg={8}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white d-flex align-items-center">
              <FaChartPie className="me-2" />
              Sentiment Distribution
            </Card.Header>
            <Card.Body>
              <div style={{ height: '400px', position: 'relative' }}>
                <Pie
                  data={{
                    labels: Object.keys(state.sentimentDistribution),
                    datasets: [{
                      data: Object.values(state.sentimentDistribution),
                      backgroundColor: Object.keys(state.sentimentDistribution)
                        .map(label => sentimentColors[label]),
                      borderWidth: 1,
                      hoverOffset: 20
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const value = context.raw || 0;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card className="shadow">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <FaFilter className="me-2" />
                <Dropdown onSelect={(filter) => setState(prev => ({ ...prev, filter }))}>
                  <Dropdown.Toggle variant="outline-primary">
                    {state.filter.charAt(0).toUpperCase() + state.filter.slice(1)} Comments
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item eventKey="all">All</Dropdown.Item>
                    <Dropdown.Item eventKey="positive">Positive</Dropdown.Item>
                    <Dropdown.Item eventKey="negative">Negative</Dropdown.Item>
                    <Dropdown.Item eventKey="neutral">Neutral</Dropdown.Item>
                    <Dropdown.Item eventKey="mixed">Mixed</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
              <div>
                Showing {Math.min(state.visibleComments, state.comments.length)} of{' '}
                {state.comments.length} comments
              </div>
            </Card.Header>
            <Card.Body className="comments-list">
              <ListGroup variant="flush">
                {state.comments
                  .filter(c => state.filter === 'all' || c.sentiment === state.filter)
                  .slice(0, state.visibleComments)
                  .map((comment, i) => (
                    <ListGroup.Item 
                      key={i}
                      className="mb-2 rounded"
                      style={{ 
                        borderLeft: `4px solid ${sentimentColors[comment.sentiment]}`,
                        opacity: state.filter !== 'all' && comment.sentiment !== state.filter ? 0.5 : 1
                      }}
                    >
                      <div className="d-flex justify-content-between">
                        <div>
                          <strong>{comment.author}</strong>
                          <p className="mb-0">{comment.text}</p>
                        </div>
                        <Badge 
                          pill 
                          style={{ 
                            backgroundColor: sentimentColors[comment.sentiment],
                            minWidth: '80px'
                          }}
                        >
                          {comment.sentiment.charAt(0).toUpperCase() + comment.sentiment.slice(1)}
                        </Badge>
                      </div>
                    </ListGroup.Item>
                  ))}
              </ListGroup>

              {state.visibleComments < state.comments.length && (
                <div className="text-center mt-4">
                  <Button 
                    variant="primary"
                    onClick={() => setState(prev => ({
                      ...prev, 
                      visibleComments: prev.visibleComments + 50
                    }))}
                  >
                    <FaPlus className="me-2" />
                    Load More Comments
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CommentsPage;