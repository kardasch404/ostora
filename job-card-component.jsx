import React, { useState } from 'react';

const JobCard = ({ job }) => {
  const [showModal, setShowModal] = useState(false);

  const extractText = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const getShortDescription = (content) => {
    const text = extractText(content);
    return text.substring(0, 150) + (text.length > 150 ? '...' : '');
  };

  return (
    <>
      <div className="job-card">
        <div className="job-card__header">
          <h3 className="job-card__title">{job.job_title || 'No Title'}</h3>
          <span className="job-card__company">{job.company_name || 'Company'}</span>
        </div>

        <div className="job-card__info">
          <div className="job-card__location">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>{job.location || 'Location'}</span>
          </div>
          <div className="job-card__category">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            <span>{job.category_name || 'Category'}</span>
          </div>
        </div>

        <p className="job-card__description">
          {getShortDescription(job.content || 'No description available')}
        </p>

        <div className="job-card__actions">
          <button 
            className="btn btn--primary"
            onClick={() => window.open(job.stelle_url, '_blank')}
          >
            Apply Now
          </button>
          <button 
            className="btn btn--secondary"
            onClick={() => setShowModal(true)}
          >
            View Details
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            <div className="modal-header">
              <h2>{job.job_title}</h2>
              <div className="modal-meta">
                <span className="modal-company">{job.company_name}</span>
                <span className="modal-location">{job.location}, {job.country}</span>
              </div>
            </div>

            <div className="modal-body">
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <strong>Category:</strong>
                  <span>{job.category_name}</span>
                </div>
                <div className="modal-info-item">
                  <strong>Posted:</strong>
                  <span>{new Date(job.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="modal-description">
                <h3>Job Description</h3>
                <div dangerouslySetInnerHTML={{ __html: job.content }} />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn--primary btn--large"
                onClick={() => window.open(job.stelle_url, '_blank')}
              >
                Apply for this Position
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .job-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .job-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .job-card__header {
          margin-bottom: 16px;
        }

        .job-card__title {
          font-size: 20px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 8px 0;
          line-height: 1.3;
        }

        .job-card__company {
          color: #666;
          font-size: 14px;
          font-weight: 500;
        }

        .job-card__info {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .job-card__location,
        .job-card__category {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #666;
          font-size: 14px;
        }

        .job-card__location svg,
        .job-card__category svg {
          color: #999;
        }

        .job-card__description {
          color: #444;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .job-card__actions {
          display: flex;
          gap: 12px;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          flex: 1;
        }

        .btn--primary {
          background: #2563eb;
          color: white;
        }

        .btn--primary:hover {
          background: #1d4ed8;
        }

        .btn--secondary {
          background: white;
          color: #2563eb;
          border: 2px solid #2563eb;
        }

        .btn--secondary:hover {
          background: #eff6ff;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: flex-start;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          width: 50%;
          max-width: 700px;
          height: calc(100vh - 40px);
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: white;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          z-index: 10;
        }

        .modal-close:hover {
          background: #f3f4f6;
        }

        .modal-header {
          padding: 32px 32px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h2 {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 12px 0;
        }

        .modal-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .modal-company {
          font-size: 16px;
          font-weight: 600;
          color: #2563eb;
        }

        .modal-location {
          font-size: 14px;
          color: #666;
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px 32px;
        }

        .modal-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .modal-info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .modal-info-item strong {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .modal-info-item span {
          font-size: 14px;
          color: #1a1a1a;
          font-weight: 500;
        }

        .modal-description h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 16px 0;
          color: #1a1a1a;
        }

        .modal-description {
          color: #444;
          font-size: 14px;
          line-height: 1.7;
        }

        .modal-footer {
          padding: 20px 32px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .btn--large {
          width: 100%;
          padding: 14px 24px;
          font-size: 16px;
        }

        @media (max-width: 768px) {
          .modal-content {
            width: 100%;
            max-width: 100%;
          }

          .job-card__actions {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
};

export default JobCard;
