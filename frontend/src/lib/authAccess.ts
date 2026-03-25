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
    accessMode: 'Self-serve signup',
    landingDescription:
      'Students can create accounts directly and land in the upskilling, resume, and job-matching flow.',
    loginDescription:
      'Students sign in here with the same form as every other role. Your existing account decides the dashboard you land in.',
    registerDescription:
      'Public signup creates a student workspace. Use this if you want resume analysis, roadmap planning, and job recommendations.',
  },
  employer: {
    role: 'employer',
    label: 'Employer',
    accessMode: 'Provisioned access',
    landingDescription:
      'Employers sign in with an existing recruiter account to post jobs, review matches, and manage applicants.',
    loginDescription:
      'Employers use the same sign-in form. If your recruiter account already exists, the app will route you into the recruiter dashboard automatically.',
    registerDescription:
      'Employer accounts are not created from the public signup page. They must be provisioned before sign-in.',
  },
  admin: {
    role: 'admin',
    label: 'Admin',
    accessMode: 'Provisioned access',
    landingDescription:
      'Admins sign in with organization-provisioned credentials to manage users, moderation, and platform monitoring.',
    loginDescription:
      'Admins use the same sign-in form. Existing admin accounts are routed into the control and monitoring views automatically.',
    registerDescription:
      'Admin accounts are not created from the public signup page. They must be provisioned before sign-in.',
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
