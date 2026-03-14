-- Esencelab Supabase Seed Data (SQL Editor)
--
-- This seed intentionally avoids creating default user credentials.
-- Create your initial admin and recruiter accounts through backend env vars:
--   INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD
--   INITIAL_RECRUITER_EMAIL / INITIAL_RECRUITER_PASSWORD
--
-- The statements below only seed public catalog data.

INSERT INTO courses (id, title, description, provider, url, skills, duration, level, rating)
VALUES
  (
    '66666666-6666-6666-6666-666666666661',
    'Complete Python Bootcamp',
    'Learn Python from beginner to advanced level with practical projects.',
    'Udemy',
    'https://www.udemy.com/course/complete-python-bootcamp/',
    ARRAY['Python', 'Django'],
    '22 hours',
    'beginner',
    4.5
  ),
  (
    '66666666-6666-6666-6666-666666666662',
    'React - The Complete Guide',
    'Master React, hooks, and application architecture.',
    'Udemy',
    'https://www.udemy.com/course/react-the-complete-guide/',
    ARRAY['React', 'TypeScript', 'JavaScript'],
    '40 hours',
    'intermediate',
    4.6
  ),
  (
    '66666666-6666-6666-6666-666666666663',
    'Machine Learning A-Z',
    'Practical machine learning for students entering AI roles.',
    'Udemy',
    'https://www.udemy.com/course/machinelearning/',
    ARRAY['Machine Learning', 'TensorFlow', 'Python'],
    '44 hours',
    'intermediate',
    4.5
  )
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    provider = EXCLUDED.provider,
    url = EXCLUDED.url,
    skills = EXCLUDED.skills,
    duration = EXCLUDED.duration,
    level = EXCLUDED.level,
    rating = EXCLUDED.rating;
