-- Add admin reply fields to comments table
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS admin_reply TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS admin_reply_by VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS admin_reply_at TIMESTAMP NULL DEFAULT NULL;

-- Add index for admin replies
CREATE INDEX IF NOT EXISTS idx_admin_reply ON comments(admin_reply_at);

