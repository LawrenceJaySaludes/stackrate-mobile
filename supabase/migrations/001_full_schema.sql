-- ============================================================
-- STACKRATE - Full Schema Migration
-- ============================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  goal_role TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_categories"
  ON categories FOR SELECT
  USING (true);

-- 3. TECHNOLOGIES TABLE
CREATE TABLE IF NOT EXISTS technologies (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT 'Beginner'
);

ALTER TABLE technologies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_technologies"
  ON technologies FOR SELECT
  USING (true);

-- 4. SEED DATA
INSERT INTO categories (name) VALUES
  ('Frontend'),
  ('Backend'),
  ('Database'),
  ('DevOps')
ON CONFLICT (name) DO NOTHING;

INSERT INTO technologies (category_id, name, description, difficulty) VALUES
  -- Frontend (1)
  (1, 'React', 'A JavaScript library for building user interfaces', 'Intermediate'),
  (1, 'Next.js', 'The React framework for production', 'Intermediate'),
  (1, 'Vue', 'The progressive JavaScript framework', 'Intermediate'),
  -- Backend (2)
  (2, 'Laravel', 'A web application framework with expressive syntax', 'Intermediate'),
  (2, 'Node.js', 'JavaScript runtime built on Chrome V8 engine', 'Intermediate'),
  (2, 'Express', 'Fast, unopinionated web framework for Node.js', 'Intermediate'),
  -- Database (3)
  (3, 'MySQL', 'The most popular open source database', 'Intermediate'),
  (3, 'PostgreSQL', 'The worlds most advanced open source database', 'Intermediate'),
  (3, 'MongoDB', 'The most popular document database', 'Intermediate'),
  -- DevOps (4)
  (4, 'Git', 'A distributed version control system', 'Beginner'),
  (4, 'Docker', 'Container platform for applications', 'Intermediate'),
  (4, 'Kubernetes', 'Container orchestration platform', 'Advanced');

-- 5. AUTO-UPDATE TRIGGER FOR PROFILES
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. USER RATINGS TABLE
CREATE TABLE IF NOT EXISTS user_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  technology_id INTEGER NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 100),
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_ratings_user_tech
  ON user_ratings(user_id, technology_id);

ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_ratings"
  ON user_ratings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_ratings"
  ON user_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_ratings"
  ON user_ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_user_ratings_updated_at
  BEFORE UPDATE ON user_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
