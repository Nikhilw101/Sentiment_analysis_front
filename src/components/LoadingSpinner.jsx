import React from 'react';
import { Container } from 'react-bootstrap';
import './LoadingSpinner.css';

const LoadingSpinner = ({ message = "Analyzing video..." }) => {
  return (
    <Container fluid className="loading-container">
      <div className="loading-content">
        <img 
          src="https://brunhilde.stackocean.com/wait.gif" 
          alt="Loading..." 
          className="loading-gif"
        />
        <div className="loading-message">
          <h3>{message}</h3>
          <p className="text-muted">This shouldn't take long 💪</p>
        </div>
      </div>
    </Container>
  );
};

export default LoadingSpinner; 