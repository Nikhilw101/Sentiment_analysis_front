import React, { useState } from 'react';
import '../styles/CommentItem.css';

function CommentItem({ comment }) {
  const [expanded, setExpanded] = useState(false);
  const maxLength = 150;
  const isLong = comment.text.length > maxLength;
  const displayedText = expanded ? comment.text : comment.text.substring(0, maxLength);

  return (
    <div className="comment-item card mb-3">
      <div className="card-body">
        <p className="card-text">{displayedText}{!expanded && isLong ? "..." : ""}</p>
        {isLong && (
          <button className="btn btn-link p-0" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
        <div className="d-flex justify-content-between mt-2">
          <span><strong>Likes:</strong> {comment.likeCount}</span>
          <span className={`badge ${comment.sentiment === 'positive' ? 'bg-success' : comment.sentiment === 'negative' ? 'bg-danger' : 'bg-secondary'}`}>
            {comment.sentiment}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CommentItem;
