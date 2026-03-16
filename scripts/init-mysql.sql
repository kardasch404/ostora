-- MySQL Initialization Script for Ostora Analytics
-- This script runs automatically when the container starts for the first time

USE ostora_analytics;

-- Create tables for analytics (basic structure)
CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36),
    event_type VARCHAR(50) NOT NULL,
    event_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Grant permissions
GRANT ALL PRIVILEGES ON ostora_analytics.* TO 'ostora'@'%';
FLUSH PRIVILEGES;

-- Log initialization
SELECT 'Ostora MySQL analytics database initialized successfully' AS message;
