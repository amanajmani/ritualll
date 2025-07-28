-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  google_id TEXT NOT NULL UNIQUE,
  access_token TEXT,
  refresh_token TEXT,
  timezone TEXT NOT NULL,
  last_briefing_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Subscriptions table
CREATE TABLE subscriptions (
  id TEXT NOT NULL, -- YouTube channel ID
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT DEFAULT 'Other',
  channel_category TEXT DEFAULT 'Other', -- Normalized category for grouping
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
);

-- Videos table
CREATE TABLE videos (
  id TEXT NOT NULL, -- YouTube video ID
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  thumbnail_url TEXT,
  summary TEXT,
  transcript TEXT,
  transcript_unavailable BOOLEAN DEFAULT false,
  summary_status TEXT DEFAULT 'processing', -- 'success', 'transcript_missing', 'llm_failed', 'processing'
  views INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id, user_id),
  FOREIGN KEY (channel_id, user_id) REFERENCES subscriptions(id, user_id)
);

-- Daily usage analytics table
CREATE TABLE daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_videos INTEGER DEFAULT 0,
  total_summaries INTEGER DEFAULT 0,
  summary_model TEXT DEFAULT 'groq',
  duration_seconds INTEGER DEFAULT 0,
  highlights JSONB, -- Store daily highlights as JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Summary errors tracking table
CREATE TABLE summary_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  error_type TEXT NOT NULL, -- 'transcript_missing', 'llm_timeout', 'llm_failed', 'api_quota'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_published_at ON videos(published_at);
CREATE INDEX idx_videos_channel_id ON videos(channel_id);

-- RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR ALL USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own videos" ON videos
  FOR ALL USING (auth.uid()::text = user_id::text);