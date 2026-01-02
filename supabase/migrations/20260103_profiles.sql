-- Profiles table for user profile information and password authentication
CREATE TABLE IF NOT EXISTS profiles (
  email TEXT PRIMARY KEY,
  name TEXT,
  username TEXT UNIQUE,
  password_hash TEXT,
  has_completed_profile BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- RLS policies: permissive for anonymous access (matching chat pattern)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read profiles (for username uniqueness checks, etc.)
CREATE POLICY "Public profiles are viewable by anyone"
  ON profiles FOR SELECT
  USING (true);

-- Allow anyone to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update profiles (could be restricted by email in production)
CREATE POLICY "Users can update profiles"
  ON profiles FOR UPDATE
  USING (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

