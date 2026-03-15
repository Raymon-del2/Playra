-- Contact messages table for user inquiries
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied'))
);

-- Index for querying messages by status and date
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);
