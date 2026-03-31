export type AuthAccessRole = 'student' | 'employer' | 'admin';

export interface AuthAccessOption {
  role: AuthAccessRole;
  label: string;
  accessMode: string;
  landingDescription: string;
  loginDescription: string;
  registerDescription: string;
}

export const AUTH_ACCESS_ORDER: AuthAccessRole[] = ['student', 'employer', 'admin'];

export const AUTH_ACCESS_OPTIONS: Record<AuthAccessRole, AuthAccessOption> = {
  student: {
    role: 'student',
    label: 'Student',
    accessMode: 'Sign up',
    landingDescription:
      'Students can create accounts and access the upskilling, resume, and job-matching flow.',
    loginDescription:
      'Students sign in with their registered account.',
    registerDescription:
      'Create a student account for resume analysis, roadmap planning, and job recommendations.',
  },
  employer: {
    role: 'employer',
    label: 'Employer',
    accessMode: 'Login',
    landingDescription:
      'Employers sign in to post jobs, review matches, and manage applicants.',
    loginDescription:
      'Employers sign in to access the recruiter dashboard.',
    registerDescription:
      'Please use the login page to sign in.',
  },
  admin: {
    role: 'admin',
    label: 'Admin',
    accessMode: 'Login',
    landingDescription:
      'Admins sign in to manage users, moderation, and platform monitoring.',
    loginDescription:
      'Admins sign in to access the control and monitoring views.',
    registerDescription:
      'Please use the login page to sign in.',
  },
};

export const normalizeAuthAccessRole = (value: string | null | undefined): AuthAccessRole => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  if (normalized === 'admin') return 'admin';
  if (normalized === 'employer' || normalized === 'recruiter') return 'employer';
  return 'student';
};

export const isProvisionedAccessRole = (role: AuthAccessRole) => role !== 'student';

export const getAuthAccessHref = (pathname: '/login' | '/register', role: AuthAccessRole) =>
  `${pathname}?role=${role}`;
