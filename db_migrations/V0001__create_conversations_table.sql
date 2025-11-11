CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    message_id VARCHAR(255) NOT NULL UNIQUE,
    sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ai')),
    text TEXT NOT NULL,
    has_file BOOLEAN DEFAULT FALSE,
    file_name VARCHAR(500),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_id ON conversations(session_id);
CREATE INDEX idx_created_at ON conversations(created_at);
