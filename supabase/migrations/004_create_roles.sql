-- ============================================================
-- STACKRATE - Role Matching Engine
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_roles"
  ON roles FOR SELECT
  USING (true);

CREATE TABLE IF NOT EXISTS role_requirements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  technology_id   INTEGER NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
  required_score  INTEGER NOT NULL CHECK (required_score >= 0 AND required_score <= 100),
  UNIQUE(role_id, technology_id)
);

ALTER TABLE role_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_role_requirements"
  ON role_requirements FOR SELECT
  USING (true);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Technology IDs from seed.sql:
-- Frontend (1): React(1), Next.js(2), TypeScript(3), Tailwind CSS(4)
-- Backend  (2): Node.js(5), Python(6), Go(7), Rust(8)
-- Database (3): PostgreSQL(9), MongoDB(10), Redis(11), Supabase(12)
-- DevOps   (4): Docker(13), AWS(14)
-- Mobile   (5): React Native(15), Flutter(16)

INSERT INTO roles (title, description) VALUES
  ('React Frontend Developer', 'Build modern web applications with React and the React ecosystem'),
  ('React Native Developer', 'Build cross-platform mobile applications with React Native'),
  ('Full Stack Developer', 'Build and maintain both frontend and backend systems'),
  ('Backend Developer', 'Design and build server-side applications and APIs'),
  ('DevOps Engineer', 'Manage infrastructure, deployments, and CI/CD pipelines')
ON CONFLICT (title) DO NOTHING;

-- React Frontend Developer
INSERT INTO role_requirements (role_id, technology_id, required_score)
SELECT r.id, t.id, req.score
FROM (SELECT id, title FROM roles WHERE title = 'React Frontend Developer') r
CROSS JOIN LATERAL (VALUES
  ('React', 80), ('TypeScript', 70), ('Next.js', 60), ('Tailwind CSS', 50), ('Node.js', 40)
) AS req(tname, score)
JOIN technologies t ON t.name = req.tname
WHERE NOT EXISTS (
  SELECT 1 FROM role_requirements rr
  JOIN roles r2 ON r2.id = rr.role_id
  WHERE r2.title = 'React Frontend Developer' AND rr.technology_id = t.id
);

-- React Native Developer
INSERT INTO role_requirements (role_id, technology_id, required_score)
SELECT r.id, t.id, req.score
FROM (SELECT id, title FROM roles WHERE title = 'React Native Developer') r
CROSS JOIN LATERAL (VALUES
  ('React Native', 80), ('React', 70), ('TypeScript', 70), ('Supabase', 40)
) AS req(tname, score)
JOIN technologies t ON t.name = req.tname
WHERE NOT EXISTS (
  SELECT 1 FROM role_requirements rr
  JOIN roles r2 ON r2.id = rr.role_id
  WHERE r2.title = 'React Native Developer' AND rr.technology_id = t.id
);

-- Full Stack Developer
INSERT INTO role_requirements (role_id, technology_id, required_score)
SELECT r.id, t.id, req.score
FROM (SELECT id, title FROM roles WHERE title = 'Full Stack Developer') r
CROSS JOIN LATERAL (VALUES
  ('React', 70), ('Node.js', 70), ('TypeScript', 60), ('PostgreSQL', 60), ('Docker', 50)
) AS req(tname, score)
JOIN technologies t ON t.name = req.tname
WHERE NOT EXISTS (
  SELECT 1 FROM role_requirements rr
  JOIN roles r2 ON r2.id = rr.role_id
  WHERE r2.title = 'Full Stack Developer' AND rr.technology_id = t.id
);

-- Backend Developer
INSERT INTO role_requirements (role_id, technology_id, required_score)
SELECT r.id, t.id, req.score
FROM (SELECT id, title FROM roles WHERE title = 'Backend Developer') r
CROSS JOIN LATERAL (VALUES
  ('Node.js', 80), ('Python', 60), ('PostgreSQL', 70), ('Docker', 60), ('Redis', 40)
) AS req(tname, score)
JOIN technologies t ON t.name = req.tname
WHERE NOT EXISTS (
  SELECT 1 FROM role_requirements rr
  JOIN roles r2 ON r2.id = rr.role_id
  WHERE r2.title = 'Backend Developer' AND rr.technology_id = t.id
);

-- DevOps Engineer
INSERT INTO role_requirements (role_id, technology_id, required_score)
SELECT r.id, t.id, req.score
FROM (SELECT id, title FROM roles WHERE title = 'DevOps Engineer') r
CROSS JOIN LATERAL (VALUES
  ('Docker', 80), ('AWS', 70), ('PostgreSQL', 50), ('Python', 40)
) AS req(tname, score)
JOIN technologies t ON t.name = req.tname
WHERE NOT EXISTS (
  SELECT 1 FROM role_requirements rr
  JOIN roles r2 ON r2.id = rr.role_id
  WHERE r2.title = 'DevOps Engineer' AND rr.technology_id = t.id
);
