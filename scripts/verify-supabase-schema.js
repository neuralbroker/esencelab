const fs = require("node:fs");
const path = require("node:path");

const schemaPath = path.join(__dirname, "..", "supabase", "supabase-schema.sql");
const schema = fs.readFileSync(schemaPath, "utf8").toLowerCase();

const requiredFragments = [
  "create table if not exists users",
  "create table if not exists resumes",
  "create table if not exists candidates",
  "create table if not exists jobs",
  "create table if not exists applications",
  "create table if not exists recruiter_access_requests",
  "status text not null default 'pending' check (status in ('pending', 'approved', 'rejected'))",
  "reviewed_by uuid references users(id) on delete set null",
  "user_id uuid references users(id) on delete set null",
  "create unique index if not exists idx_recruiter_access_requests_pending_email",
  "alter table recruiter_access_requests enable row level security",
  "create policy recruiter_access_requests_all_access",
  "create trigger recruiter_access_requests_set_updated_at",
  "alter table resumes add column if not exists moderation_status",
  "alter table jobs add column if not exists experience_level",
];

const missing = requiredFragments.filter((fragment) => !schema.includes(fragment));

if (missing.length > 0) {
  console.error("Supabase schema contract check failed. Missing fragments:");
  for (const fragment of missing) {
    console.error(`- ${fragment}`);
  }
  process.exit(1);
}

console.log("Supabase schema contract check passed.");
