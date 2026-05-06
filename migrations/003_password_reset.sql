-- Migration for adding password reset functionality
-- Add reset_token and reset_token_expiry columns to admin_user table

ALTER TABLE admin_user
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_admin_user_reset_token ON admin_user(reset_token);
