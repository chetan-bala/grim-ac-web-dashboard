-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  server_name TEXT,
  grim_server_url TEXT,
  grim_api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recordings table
CREATE TABLE recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  player_uuid TEXT NOT NULL,
  player_name TEXT NOT NULL,
  check_name TEXT NOT NULL,
  verbose TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL,
  recording_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invites table
CREATE TABLE invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Policies (allow users to access their own data)
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Recordings are accessible by owner" ON recordings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Invites are accessible by inviter" ON invites FOR SELECT USING (auth.uid() = inviter_id);
