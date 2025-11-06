# Badge System Setup

## Database Migration Required

The badge system requires a `user_badges` table in your Supabase database. 

### Option 1: Run SQL Migration in Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the following SQL:

```sql
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
-- Note: You may want to restrict this policy based on your security requirements
CREATE POLICY "System can manage badges"
  ON user_badges
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### Option 2: Use Supabase CLI

If you have Supabase CLI set up, you can run:

```bash
supabase db push
```

This will apply the migration file located at `supabase/migrations/001_create_user_badges_table.sql`

## How It Works

The badge system will:
- ✅ Work gracefully even if the table doesn't exist (will show warnings in console)
- ✅ Check and unlock badges automatically when users complete actions
- ✅ Send notifications when badges are unlocked
- ✅ Persist badge unlocks to the database once the table is created

## Badge Types

### Common Badges (All Users)
- 🎉 **Bienvenido**: Join the platform (special)
- 📅 **Primera Semana**: Active for 7 days
- 🗓️ **Veterano Mensual**: Active for 30 days

### Freelancer Badges
- 🚀 **Primer Proyecto**: Complete 1 project
- ⭐ **Maestro de Proyectos**: Complete 5 projects
- 🏆 **Leyenda de Proyectos**: Complete 20 projects
- ⭐ **5 Estrellas**: Average rating of 4.5+
- 💰 **Top Earner**: Earn $5,000+
- 💎 **High Roller**: Earn $20,000+

### Client Badges
- 🤝 **Primera Contratación**: Hire first freelancer
- 💼 **Patrocinador de Proyectos**: Create 5 projects
- 🏢 **Cliente Empresarial**: Create 20+ projects

## Testing

After running the migration:
1. Complete actions that should unlock badges (e.g., complete a project)
2. Check the dashboard achievements tab
3. Verify notifications are received when badges are unlocked
4. Check the `user_badges` table in Supabase to see persisted unlocks

