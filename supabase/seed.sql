-- Create RLS policies for anon read access
CREATE POLICY "anon_select_categories" ON categories FOR SELECT USING (true);
CREATE POLICY "anon_select_technologies" ON technologies FOR SELECT USING (true);

-- Seed categories
INSERT INTO categories (name) VALUES
  ('Frontend'),
  ('Backend'),
  ('Database'),
  ('DevOps'),
  ('Mobile'),
  ('AI / ML'),
  ('Testing'),
  ('Security');

-- Seed technologies
INSERT INTO technologies (category_id, name, description, difficulty) VALUES
  (1, 'React', 'A JavaScript library for building user interfaces', 'Intermediate'),
  (1, 'Next.js', 'The React framework for production', 'Intermediate'),
  (1, 'TypeScript', 'Typed superset of JavaScript', 'Intermediate'),
  (1, 'Tailwind CSS', 'A utility-first CSS framework', 'Beginner'),
  (2, 'Node.js', 'JavaScript runtime built on Chrome V8 engine', 'Intermediate'),
  (2, 'Python', 'A versatile programming language', 'Beginner'),
  (2, 'Go', 'A statically typed compiled programming language', 'Advanced'),
  (2, 'Rust', 'A language empowering everyone to build reliable software', 'Advanced'),
  (3, 'PostgreSQL', 'The worlds most advanced open source database', 'Intermediate'),
  (3, 'MongoDB', 'The most popular document database', 'Intermediate'),
  (3, 'Redis', 'In-memory data structure store', 'Intermediate'),
  (3, 'Supabase', 'An open source Firebase alternative', 'Beginner'),
  (4, 'Docker', 'Container platform', 'Intermediate'),
  (4, 'AWS', 'Amazon Web Services cloud platform', 'Advanced'),
  (5, 'React Native', 'Build native mobile apps using React', 'Intermediate'),
  (5, 'Flutter', 'Googles UI toolkit for building native apps', 'Intermediate');
