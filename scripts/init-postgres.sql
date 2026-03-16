-- PostgreSQL Initialization Script for Ostora Platform
-- This script runs automatically when the container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance (will be created by Prisma migrations)
-- This is just a placeholder for any custom initialization

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE ostora_db TO ostora;

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'Ostora PostgreSQL database initialized successfully';
END $$;
