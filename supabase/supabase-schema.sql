-- Esencelab Supabase Schema (SQL Editor)
-- Safe to run multiple times.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('student', 'employer', 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_type') THEN
    CREATE TYPE job_type AS ENUM ('full_time', 'part_time', 'internship', 'contract');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE job_status AS ENUM ('active', 'closed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
    CREATE TYPE application_status AS ENUM ('pending', 'shortlisted', 'rejected', 'interview');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'candidate_status') THEN
    CREATE TYPE candidate_status AS ENUM ('new', 'screening', 'interview', 'hired', 'rejected');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_level') THEN
    CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  parsed_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  skills TEXT[] NOT NULL DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  education JSONB NOT NULL DEFAULT '[]'::jsonb,
  experience JSONB NOT NULL DEFAULT '[]'::jsonb,
  parsed_data JSONB,
  match_score INTEGER NOT NULL DEFAULT 0,
  status candidate_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[] NOT NULL DEFAULT '{}'::text[],
  skills TEXT[] NOT NULL DEFAULT '{}'::text[],
  location TEXT NOT NULL,
  salary_min INTEGER,
  salary_max INTEGER,
  job_type job_type NOT NULL DEFAULT 'full_time',
  status job_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'pending',
  match_score INTEGER NOT NULL DEFAULT 0,
  matched_skills TEXT[] NOT NULL DEFAULT '{}'::text[],
  missing_skills TEXT[] NOT NULL DEFAULT '{}'::text[],
  explanation TEXT,
  notes TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, candidate_id)
);

ALTER TABLE applications ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  provider TEXT NOT NULL,
  url TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}'::text[],
  duration TEXT,
  level course_level,
  rating NUMERIC(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL DEFAULT 0,
  matched_skills TEXT[] NOT NULL DEFAULT '{}'::text[],
  missing_skills TEXT[] NOT NULL DEFAULT '{}'::text[],
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resume_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL DEFAULT 'backend_developer',
  score INTEGER NOT NULL DEFAULT 0,
  section_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  suggestions TEXT[] NOT NULL DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skill_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL DEFAULT 'backend_developer',
  skill_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'missing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role_id, skill_name)
);

CREATE TABLE IF NOT EXISTS learning_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL DEFAULT 'backend_developer',
  duration_days INTEGER NOT NULL DEFAULT 30,
  plan_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mock_interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL DEFAULT 'backend_developer',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  rating INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, job_id)
);

CREATE TABLE IF NOT EXISTS career_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL DEFAULT 'backend_developer',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_skills ON jobs USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_courses_skills ON courses USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_scores_user_id ON resume_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_progress_user_id ON skill_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_plans_user_id ON learning_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_sessions_user_id ON mock_interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'users_set_updated_at') THEN
    CREATE TRIGGER users_set_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'resumes_set_updated_at') THEN
    CREATE TRIGGER resumes_set_updated_at
      BEFORE UPDATE ON resumes
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'candidates_set_updated_at') THEN
    CREATE TRIGGER candidates_set_updated_at
      BEFORE UPDATE ON candidates
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'jobs_set_updated_at') THEN
    CREATE TRIGGER jobs_set_updated_at
      BEFORE UPDATE ON jobs
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'applications_set_updated_at') THEN
    CREATE TRIGGER applications_set_updated_at
      BEFORE UPDATE ON applications
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'courses_set_updated_at') THEN
    CREATE TRIGGER courses_set_updated_at
      BEFORE UPDATE ON courses
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'skill_progress_set_updated_at') THEN
    CREATE TRIGGER skill_progress_set_updated_at
      BEFORE UPDATE ON skill_progress
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'learning_plans_set_updated_at') THEN
    CREATE TRIGGER learning_plans_set_updated_at
      BEFORE UPDATE ON learning_plans
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'career_preferences_set_updated_at') THEN
    CREATE TRIGGER career_preferences_set_updated_at
      BEFORE UPDATE ON career_preferences
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_all_access ON users;
DROP POLICY IF EXISTS resumes_all_access ON resumes;
DROP POLICY IF EXISTS candidates_all_access ON candidates;
DROP POLICY IF EXISTS jobs_all_access ON jobs;
DROP POLICY IF EXISTS applications_all_access ON applications;
DROP POLICY IF EXISTS courses_all_access ON courses;
DROP POLICY IF EXISTS recommendations_all_access ON recommendations;
DROP POLICY IF EXISTS resume_scores_all_access ON resume_scores;
DROP POLICY IF EXISTS skill_progress_all_access ON skill_progress;
DROP POLICY IF EXISTS learning_plans_all_access ON learning_plans;
DROP POLICY IF EXISTS mock_interview_sessions_all_access ON mock_interview_sessions;
DROP POLICY IF EXISTS saved_jobs_all_access ON saved_jobs;
DROP POLICY IF EXISTS career_preferences_all_access ON career_preferences;
DROP POLICY IF EXISTS admin_logs_all_access ON admin_logs;

CREATE POLICY users_all_access ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY resumes_all_access ON resumes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY candidates_all_access ON candidates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY jobs_all_access ON jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY applications_all_access ON applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY courses_all_access ON courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY recommendations_all_access ON recommendations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY resume_scores_all_access ON resume_scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY skill_progress_all_access ON skill_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY learning_plans_all_access ON learning_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY mock_interview_sessions_all_access ON mock_interview_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY saved_jobs_all_access ON saved_jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY career_preferences_all_access ON career_preferences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY admin_logs_all_access ON admin_logs FOR ALL USING (true) WITH CHECK (true);
