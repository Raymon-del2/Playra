-- PLAYRA LIVE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor

-- LIVE STREAMS TABLE
CREATE TABLE IF NOT EXISTS live_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    thumbnail_url TEXT,
    
    -- Stream State
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'live', 'ended', 'saved')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- WebRTC Signaling
    room_id TEXT UNIQUE NOT NULL,
    
    -- Stats
    peak_viewers INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    
    -- Recording
    recording_url TEXT,
    is_recorded BOOLEAN DEFAULT false,
    
    -- Settings
    allow_chat BOOLEAN DEFAULT true,
    allow_donations BOOLEAN DEFAULT true,
    save_after_stream BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- LIVE CHAT TABLE
CREATE TABLE IF NOT EXISTS live_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'gift')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Realtime for live_chat
ALTER PUBLICATION supabase_realtime ADD TABLE live_chat;

-- DONATIONS/GIFTS TABLE
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    creator_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    gift_type TEXT NOT NULL CHECK (gift_type IN ('leaf', 'flower', 'fruit', 'tree')),
    coin_value INTEGER NOT NULL,
    ksh_value DECIMAL(10,2) NOT NULL,
    
    is_withdrawn BOOLEAN DEFAULT false,
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- CREATOR BALANCE TABLE
CREATE TABLE IF NOT EXISTS creator_balances (
    creator_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    total_coins INTEGER DEFAULT 0,
    total_ksh DECIMAL(10,2) DEFAULT 0,
    withdrawn_ksh DECIMAL(10,2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    amount_ksh DECIMAL(10,2) NOT NULL,
    platform_fee_ksh DECIMAL(10,2) NOT NULL DEFAULT 100,
    net_amount_ksh DECIMAL(10,2) NOT NULL,
    
    method TEXT NOT NULL CHECK (method IN ('mpesa', 'bank')),
    mpesa_number TEXT,
    bank_account TEXT,
    bank_name TEXT,
    
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    processed_by TEXT REFERENCES profiles(id)
);

-- STREAM VIEWERS (Presence)
CREATE TABLE IF NOT EXISTS stream_viewers (
    stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
    viewer_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    PRIMARY KEY (stream_id, viewer_id)
);

-- Enable Realtime for viewer count
ALTER PUBLICATION supabase_realtime ADD TABLE stream_viewers;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_creator ON live_streams(creator_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_scheduled ON live_streams(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_live_chat_stream ON live_chat(stream_id, created_at);
CREATE INDEX IF NOT EXISTS idx_donations_creator ON donations(creator_id, is_withdrawn);
CREATE INDEX IF NOT EXISTS idx_donations_stream ON donations(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_viewers_stream ON stream_viewers(stream_id);

-- ROW LEVEL SECURITY POLICIES

-- Live streams: anyone can view live/scheduled, only creator can modify
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view live streams" ON live_streams
    FOR SELECT USING (status IN ('live', 'scheduled', 'saved') OR creator_id = auth.uid());

CREATE POLICY "Creators can manage their streams" ON live_streams
    FOR ALL USING (creator_id = auth.uid());

-- Live chat: anyone in stream can read, authenticated can send
ALTER TABLE live_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view chat" ON live_chat
    FOR SELECT USING (true);

CREATE POLICY "Authenticated can send chat" ON live_chat
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Donations: viewable by sender or creator
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their donations" ON donations
    FOR SELECT USING (sender_id = auth.uid() OR creator_id = auth.uid());

CREATE POLICY "Authenticated can send donations" ON donations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Creator balances: only owner
ALTER TABLE creator_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view their balance" ON creator_balances
    FOR ALL USING (creator_id = auth.uid());

-- Withdrawals: only owner
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view their withdrawals" ON withdrawals
    FOR ALL USING (creator_id = auth.uid());

-- Stream viewers: anyone can see count, authenticated can join
ALTER TABLE stream_viewers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view viewer counts" ON stream_viewers
    FOR SELECT USING (true);

CREATE POLICY "Authenticated can join streams" ON stream_viewers
    FOR ALL USING (viewer_id = auth.uid());
