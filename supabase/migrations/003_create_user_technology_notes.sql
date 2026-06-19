-- ============================================================
-- STACKRATE - User Technology Notes (Learning Journal)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS user_technology_notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  technology_id INTEGER NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
  notes         TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_tech_notes_user_tech
  ON user_technology_notes(user_id, technology_id);

ALTER TABLE user_technology_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_tech_notes"
  ON user_technology_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_tech_notes"
  ON user_technology_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_tech_notes"
  ON user_technology_notes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_user_technology_notes_updated_at
  BEFORE UPDATE ON user_technology_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
