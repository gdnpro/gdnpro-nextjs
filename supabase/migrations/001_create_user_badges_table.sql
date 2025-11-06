-- Create user_badges table for tracking unlocked badges
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- Enable Row Level Security
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view their own badges
CREATE POLICY "Users can view their own badges"
  ON user_badges
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own badges
CREATE POLICY "Users can insert their own badges"
  ON user_badges
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: System can manage badges (for edge functions)
CREATE POLICY "System can manage badges"
  ON user_badges
  FOR ALL
  USING (true)
  WITH CHECK (true);

