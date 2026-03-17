/**
 * Main backend server.
 *
 * This file sets up the Express app, applies middleware, connects optional
 * persistence, and defines the student, recruiter, admin, and health routes
 * used by the whole platform.
 */
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { SupabaseStore } from './supabaseStore';
import {
  CAREER_ROLES,
  buildRecommendationExplanation,
  buildRoadmap,
  calculateResumeStrength,
  deriveProgressDelta,
  generateLearningPlan,
  generateMockInterview,
  generateWeeklyPlanner,
  getRoleExplorerData,
  SkillStatus,
} from './careerEngine';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = String(process.env.JWT_SECRET || '').trim();
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required.');
}
const SERVER_STARTED_AT = Date.now();
const SLOW_ENDPOINT_THRESHOLD_MS = Number(process.env.SLOW_ENDPOINT_THRESHOLD_MS || 1200);
const MAX_RESUME_FILE_SIZE_MB = Math.max(
  1,
  Math.min(4.4, Number(process.env.MAX_RESUME_FILE_SIZE_MB || 4))
);
const MAX_RESUME_FILE_SIZE_BYTES = Math.floor(MAX_RESUME_FILE_SIZE_MB * 1024 * 1024);
let runtimeReady: Promise<void> = Promise.resolve();
type BootstrapRole = 'student' | 'employer' | 'admin';

const toBooleanEnv = (name: string, defaultValue = false) => {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === '') {
    return defaultValue;
  }
  const normalized = String(rawValue).trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
};

const requireEnv = (name: string) => {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    throw new Error(`${name} environment variable is required.`);
  }
  return value;
};

const ENABLE_DEMO_DATA = toBooleanEnv('ENABLE_DEMO_DATA');
const ALLOW_INSECURE_PASSWORD_RESET_TOKEN_RESPONSE = toBooleanEnv(
  'ALLOW_INSECURE_PASSWORD_RESET_TOKEN_RESPONSE'
);
const SYNC_DEMO_DATA_TO_SUPABASE = toBooleanEnv('SYNC_DEMO_DATA_TO_SUPABASE');
const DATA_PROVIDER = String(process.env.DATA_PROVIDER || 'memory')
  .trim()
  .toLowerCase();
const SHOULD_BOOT_DEMO_DATA =
  ENABLE_DEMO_DATA && (DATA_PROVIDER === 'memory' || SYNC_DEMO_DATA_TO_SUPABASE);

type SeedUserConfig = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: BootstrapRole;
};

const readSeedUserConfig = (prefix: string, role: BootstrapRole, id: string): SeedUserConfig => ({
  id,
  email: requireEnv(`${prefix}_EMAIL`).toLowerCase(),
  password: requireEnv(`${prefix}_PASSWORD`),
  name: requireEnv(`${prefix}_NAME`),
  role,
});

const buildDemoSeedUsers = (): SeedUserConfig[] => {
  if (!SHOULD_BOOT_DEMO_DATA) {
    return [];
  }

  return [
    readSeedUserConfig('DEMO_STUDENT', 'student', '11111111-1111-1111-1111-111111111111'),
    readSeedUserConfig('DEMO_RECRUITER', 'employer', '22222222-2222-2222-2222-222222222222'),
    readSeedUserConfig('DEMO_ADMIN', 'admin', '33333333-3333-3333-3333-333333333333'),
  ];
};

const createEmptyDb = () => ({
  profiles: [] as any[],
  jobs: [] as any[],
  candidates: [] as any[],
  applications: [] as any[],
  courses: [] as any[],
  resumes: [] as any[],
  recommendations: [] as any[],
  resumeScores: [] as any[],
  skillProgress: [] as any[],
  learningPlans: [] as any[],
  mockInterviewSessions: [] as any[],
  savedJobs: [] as any[],
  careerPreferences: [] as any[],
  adminLogs: [] as any[],
  requestMetrics: {
    totalRequests: 0,
    totalErrors: 0,
    authFailures: 0,
    slowRequests: 0,
    endpoints: {} as Record<string, any>,
  },
});

const createInitialDb = () => {
  const db = createEmptyDb();
  if (!SHOULD_BOOT_DEMO_DATA) {
    return db;
  }

  const demoUsers = buildDemoSeedUsers();
  const now = new Date();
  const demoPasswordHashes = new Map(
    demoUsers.map((user) => [user.id, bcrypt.hashSync(user.password, 10)])
  );
  const student = demoUsers.find((user) => user.role === 'student');
  const recruiter = demoUsers.find((user) => user.role === 'employer');

  db.profiles = demoUsers.map((user) => ({
    id: user.id,
    email: user.email,
    passwordHash: demoPasswordHashes.get(user.id),
    name: user.name,
    role: user.role,
    avatarUrl: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }));

  if (recruiter) {
    db.jobs = [
      {
        id: '1',
        employerId: recruiter.id,
        title: 'Software Engineer',
        company: 'Tech Corp',
        location: 'Bangalore, India',
        description: 'We are looking for a skilled software engineer',
        requirements: ['Python', 'JavaScript', 'React', 'Node.js', 'SQL'],
        skills: ['Python', 'JavaScript', 'React', 'Node.js', 'SQL'],
        salaryMin: 80000,
        salaryMax: 120000,
        jobType: 'full_time',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '2',
        employerId: recruiter.id,
        title: 'Data Scientist',
        company: 'Data Inc',
        location: 'Hyderabad, India',
        description: 'Join our data science team',
        requirements: ['Python', 'Machine Learning', 'TensorFlow', 'SQL'],
        skills: ['Python', 'Machine Learning', 'TensorFlow'],
        salaryMin: 100000,
        salaryMax: 150000,
        jobType: 'full_time',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '3',
        employerId: recruiter.id,
        title: 'Frontend Developer',
        company: 'Web Solutions',
        location: 'Remote',
        description: 'Build beautiful web applications',
        requirements: ['React', 'TypeScript', 'CSS', 'HTML'],
        skills: ['React', 'TypeScript', 'CSS'],
        salaryMin: 60000,
        salaryMax: 90000,
        jobType: 'full_time',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '4',
        employerId: recruiter.id,
        title: 'Backend Developer',
        company: 'API Solutions',
        location: 'Chennai, India',
        description: 'Build scalable backend services',
        requirements: ['Node.js', 'Python', 'PostgreSQL'],
        skills: ['Node.js', 'Python', 'PostgreSQL'],
        salaryMin: 70000,
        salaryMax: 110000,
        jobType: 'full_time',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '5',
        employerId: recruiter.id,
        title: 'DevOps Engineer',
        company: 'Cloud Systems',
        location: 'Bangalore, India',
        description: 'Manage cloud infrastructure',
        requirements: ['AWS', 'Docker', 'Kubernetes'],
        skills: ['AWS', 'Docker', 'Kubernetes'],
        salaryMin: 90000,
        salaryMax: 140000,
        jobType: 'full_time',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  if (student) {
    db.candidates = [
      {
        id: '1',
        userId: student.id,
        name: student.name,
        email: student.email,
        role: 'Software Developer',
        skills: JSON.stringify(['Python', 'JavaScript', 'React', 'Node.js', 'SQL']),
        education: JSON.stringify([
          { institution: 'SNGCET', degree: 'B.Tech', field: 'Computer Science', year: '2025' },
        ]),
        experience: JSON.stringify([]),
        matchScore: 85,
        status: 'new',
        createdAt: now,
        updatedAt: now,
      },
    ];
    db.careerPreferences = [{ userId: student.id, roleId: 'backend_developer', updatedAt: now }];
  }

  db.courses = [
    {
      id: '1',
      title: 'Complete Python Bootcamp',
      description: 'Learn Python from scratch',
      provider: 'Udemy',
      url: 'https://udemy.com',
      skills: ['Python', 'Django'],
      duration: '22 hours',
      level: 'beginner',
      rating: 4.5,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '2',
      title: 'React - The Complete Guide',
      description: 'Master React.js',
      provider: 'Udemy',
      url: 'https://udemy.com',
      skills: ['React', 'Redux'],
      duration: '40 hours',
      level: 'intermediate',
      rating: 4.6,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '3',
      title: 'Machine Learning A-Z',
      description: 'Learn ML Algorithms',
      provider: 'Udemy',
      url: 'https://udemy.com',
      skills: ['Python', 'Machine Learning'],
      duration: '44 hours',
      level: 'intermediate',
      rating: 4.5,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '4',
      title: 'Node.js Developer Course',
      description: 'Build real-world apps',
      provider: 'Udemy',
      url: 'https://udemy.com',
      skills: ['Node.js', 'Express'],
      duration: '37 hours',
      level: 'intermediate',
      rating: 4.7,
      createdAt: now,
      updatedAt: now,
    },
  ];

  return db;
};

const FRONTEND_ORIGINS = (() => {
  const rawOrigins = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:3000';
  return rawOrigins
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
})();
const ALLOW_ALL_FRONTEND_ORIGINS = FRONTEND_ORIGINS.includes('*');
const TRUST_PROXY_RAW = String(process.env.TRUST_PROXY || '').trim().toLowerCase();

if (TRUST_PROXY_RAW) {
  if (TRUST_PROXY_RAW === 'true') app.set('trust proxy', 1);
  else if (TRUST_PROXY_RAW === 'false') app.set('trust proxy', false);
  else if (!Number.isNaN(Number(TRUST_PROXY_RAW))) app.set('trust proxy', Number(TRUST_PROXY_RAW));
  else app.set('trust proxy', TRUST_PROXY_RAW);
}

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOW_ALL_FRONTEND_ORIGINS || FRONTEND_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(
  compression({
    threshold: 1024,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.set('etag', 'strong');

app.use(async (_req, res, next) => {
  try {
    await runtimeReady;
    next();
  } catch (error: any) {
    console.error('Runtime bootstrap failed:', error);
    res.status(500).json({ message: 'Server initialization failed.' });
  }
});

app.use((req, res, next) => {
  if (req.method !== 'GET') {
    res.setHeader('Cache-Control', 'no-store');
    return next();
  }

  const routePath = req.path || '';
  if (routePath === '/api/health' || routePath === '/api/career/roles') {
    res.setHeader('Cache-Control', 'public, max-age=60');
  } else if (
    routePath.startsWith('/api/jobs') ||
    routePath.startsWith('/api/recruiter/overview') ||
    routePath.startsWith('/api/admin/monitoring') ||
    routePath.startsWith('/api/jobs/') ||
    routePath.startsWith('/api/dashboard/stats')
  ) {
    res.setHeader('Cache-Control', 'private, max-age=8, stale-while-revalidate=20');
  } else {
    res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
  }
  return next();
});

// Rate limiter for auth routes (max 15 attempts per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later' },
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many admin requests, please retry shortly.' },
});

// Setup multer for file uploads
//
// Use in-memory storage so uploads work both locally and inside serverless
// runtimes such as Vercel Functions, where writing to the app directory is not
// a safe long-term assumption.
const PDF_MIME_TYPES = new Set([
  'application/pdf',
  'application/x-pdf',
  'application/acrobat',
  'applications/vnd.pdf',
  'text/pdf',
]);

const sanitizeUploadFilename = (fileName: string) =>
  path
    .basename(fileName)
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_');

const isLikelyPdfFile = (file: Express.Multer.File) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = String(file.mimetype || '').toLowerCase();
  const acceptableMime = PDF_MIME_TYPES.has(mime) || mime === '' || mime === 'application/octet-stream';
  return ext === '.pdf' && acceptableMime;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESUME_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!isLikelyPdfFile(file)) {
      cb(new Error('Only PDF files are allowed.'));
      return;
    }
    cb(null, true);
  },
});

const resumeUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (error: any) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res
          .status(400)
          .json({ message: `File too large. Maximum size is ${MAX_RESUME_FILE_SIZE_MB}MB.` });
      }
      return res.status(400).json({ message: error.message || 'Invalid upload payload.' });
    }
    return res.status(400).json({ message: error?.message || 'Invalid upload payload.' });
  });
};

// AI Service URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:3002';
const db: any = createInitialDb();

const supabaseStore = new SupabaseStore();

db.jobs = db.jobs.map((job: any) => ({
  ...job,
  updatedAt: job.updatedAt || job.createdAt || new Date(),
}));
db.courses = db.courses.map((course: any) => ({
  ...course,
  createdAt: course.createdAt || new Date(),
  updatedAt: course.updatedAt || new Date(),
}));
db.candidates = db.candidates.map((candidate: any) => ({
  ...candidate,
  updatedAt: candidate.updatedAt || candidate.createdAt || new Date(),
}));
db.resumeScores = (db.resumeScores || []).map((entry: any) => ({
  ...entry,
  createdAt: entry.createdAt || new Date(),
}));
db.skillProgress = (db.skillProgress || []).map((entry: any) => ({
  ...entry,
  createdAt: entry.createdAt || new Date(),
  updatedAt: entry.updatedAt || new Date(),
}));
db.learningPlans = (db.learningPlans || []).map((entry: any) => ({
  ...entry,
  createdAt: entry.createdAt || new Date(),
  updatedAt: entry.updatedAt || new Date(),
}));
db.mockInterviewSessions = (db.mockInterviewSessions || []).map((entry: any) => ({
  ...entry,
  createdAt: entry.createdAt || new Date(),
}));
db.savedJobs = (db.savedJobs || []).map((entry: any) => ({
  ...entry,
  createdAt: entry.createdAt || new Date(),
}));
db.careerPreferences = (db.careerPreferences || []).map((entry: any) => ({
  ...entry,
  updatedAt: entry.updatedAt || new Date(),
}));
db.adminLogs = (db.adminLogs || []).map((entry: any) => ({
  ...entry,
  createdAt: entry.createdAt || new Date(),
}));

const normalizeMetricPath = (value: string) => {
  return value
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, ':id')
    .replace(/\/\d+(?=\/|$)/g, '/:id');
};

app.use((req, res, next) => {
  const start = Date.now();
  db.requestMetrics.totalRequests += 1;

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const pathPart = normalizeMetricPath((req.originalUrl || req.url || '/').split('?')[0] || '/');
    const key = `${req.method.toUpperCase()} ${pathPart}`;
    const current = db.requestMetrics.endpoints[key] || {
      count: 0,
      errors: 0,
      totalDurationMs: 0,
      maxDurationMs: 0,
      slowCount: 0,
      lastStatusCode: 200,
      lastSeenAt: null,
    };

    current.count += 1;
    current.totalDurationMs += durationMs;
    current.maxDurationMs = Math.max(current.maxDurationMs, durationMs);
    current.lastStatusCode = res.statusCode;
    current.lastSeenAt = new Date();
    if (res.statusCode >= 400) {
      current.errors += 1;
      db.requestMetrics.totalErrors += 1;
    }
    if (res.statusCode === 401 || res.statusCode === 403) {
      db.requestMetrics.authFailures += 1;
    }
    if (durationMs >= SLOW_ENDPOINT_THRESHOLD_MS) {
      current.slowCount += 1;
      db.requestMetrics.slowRequests += 1;
    }
    db.requestMetrics.endpoints[key] = current;
  });

  next();
});

type CanonicalRole = 'student' | 'recruiter' | 'admin';
type SupportedRole = CanonicalRole | 'employer';
type RequestWithAuth = Request & { authToken?: string; profile?: any };

const resetTokens = new Map<string, { userId: string; expiresAt: number }>();
const revokedTokens = new Set<string>();

const toStorageRole = (inputRole: unknown): SupportedRole => {
  const normalized = String(inputRole || '')
    .trim()
    .toLowerCase();
  if (normalized === 'recruiter') return 'employer';
  if (normalized === 'employer') return 'employer';
  if (normalized === 'admin') return 'admin';
  return 'student';
};

const toCanonicalRole = (inputRole: unknown): CanonicalRole => {
  const normalized = String(inputRole || '')
    .trim()
    .toLowerCase();
  if (normalized === 'recruiter' || normalized === 'employer') return 'recruiter';
  if (normalized === 'admin') return 'admin';
  return 'student';
};

const roleMatches = (inputRole: unknown, requiredRole: CanonicalRole) => {
  return toCanonicalRole(inputRole) === requiredRole;
};

const readOptionalBootstrapUser = (
  prefix: string,
  role: SupportedRole,
  fallbackName: string
): { email: string; password: string; name: string; role: SupportedRole } | null => {
  const email = String(process.env[`${prefix}_EMAIL`] || '')
    .trim()
    .toLowerCase();
  const password = String(process.env[`${prefix}_PASSWORD`] || '').trim();
  const name = String(process.env[`${prefix}_NAME`] || fallbackName).trim() || fallbackName;

  if (!email && !password) {
    return null;
  }
  if (!email || !password) {
    throw new Error(`${prefix}_EMAIL and ${prefix}_PASSWORD must both be set.`);
  }

  return {
    email,
    password,
    name,
    role,
  };
};

const roleFilterMatches = (inputRole: unknown, filterRole: string) => {
  const normalized = filterRole.trim().toLowerCase();
  if (!normalized) return true;
  if (normalized === 'employer' || normalized === 'recruiter') {
    return roleMatches(inputRole, 'recruiter');
  }
  if (normalized === 'admin') return roleMatches(inputRole, 'admin');
  if (normalized === 'student') return roleMatches(inputRole, 'student');
  return false;
};

const sanitizeUser = (profile: any) => ({
  id: profile.id,
  email: profile.email,
  name: profile.name,
  role: profile.role,
  canonicalRole: toCanonicalRole(profile.role),
  avatarUrl: profile.avatarUrl,
  isActive: profile.isActive,
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt,
});

const createToken = (userId: string) =>
  jwt.sign(
    {
      userId,
      sessionId: crypto.randomUUID(),
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

const parseBearerToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, value] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !value) return null;
  return value;
};

const verifyToken = (token: string) => {
  if (revokedTokens.has(token)) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
};

const getProfileFromAuth = (req: Request) => {
  const token = parseBearerToken(req);
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  const profile = db.profiles.find((p: any) => p.id === decoded.userId);
  if (!profile || profile.isActive === false) return null;

  return profile;
};

const requireAuth = (req: RequestWithAuth, res: Response, next: NextFunction) => {
  const token = parseBearerToken(req);
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ message: 'Invalid or expired token' });

  const profile = db.profiles.find((entry: any) => entry.id === decoded.userId);
  if (!profile || profile.isActive === false) {
    return res.status(401).json({ message: 'User not found or disabled' });
  }

  req.authToken = token;
  req.profile = profile;
  return next();
};

const requireRoles = (...roles: CanonicalRole[]) => {
  return (req: RequestWithAuth, res: Response, next: NextFunction) => {
    const profile = req.profile;
    if (!profile) return res.status(401).json({ message: 'Not authenticated' });

    const authorized = roles.some((role) => roleMatches(profile.role, role));
    if (!authorized) return res.status(403).json({ message: 'Not authorized' });
    return next();
  };
};

const toStorageApplicationStatus = (status: unknown): 'pending' | 'shortlisted' | 'interview' | 'rejected' => {
  const normalized = String(status || '')
    .trim()
    .toLowerCase();
  if (normalized === 'applied' || normalized === 'pending') return 'pending';
  if (normalized === 'offer' || normalized === 'shortlisted') return 'shortlisted';
  if (normalized === 'interviewing' || normalized === 'interview') return 'interview';
  return 'rejected';
};

const toTrackerApplicationStatus = (status: unknown): 'applied' | 'interviewing' | 'offer' | 'rejected' => {
  const normalized = String(status || '')
    .trim()
    .toLowerCase();
  if (normalized === 'pending' || normalized === 'applied') return 'applied';
  if (normalized === 'interview' || normalized === 'interviewing') return 'interviewing';
  if (normalized === 'shortlisted' || normalized === 'offer') return 'offer';
  return 'rejected';
};

const withTrackerStatus = (application: any) => ({
  ...application,
  trackerStatus: toTrackerApplicationStatus(application?.status),
  storageStatus: application?.status || 'pending',
});

const withApplicationDetails = (applications: any[]) => {
  return applications.map((application) => {
    const job = db.jobs.find((entry: any) => entry.id === application.jobId);
    const student = db.profiles.find((entry: any) => entry.id === application.candidateId);
    const resume = db.resumes.find((entry: any) => entry.userId === application.candidateId);
    return {
      ...withTrackerStatus(application),
      job,
      student: student ? sanitizeUser(student) : null,
      resume,
      createdAt: application.appliedAt || application.createdAt,
    };
  });
};

const toPositiveInt = (value: unknown, fallback: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const normalized = Math.floor(parsed);
  if (normalized <= 0) return fallback;
  return Math.min(normalized, max);
};

const getPagination = (
  query: Record<string, any>,
  defaults: { page?: number; limit?: number; maxLimit?: number } = {}
) => {
  const page = toPositiveInt(query?.page, defaults.page || 1, 100000);
  const limit = toPositiveInt(query?.limit, defaults.limit || 20, defaults.maxLimit || 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const paginateData = <T>(items: T[], page: number, limit: number) => {
  const total = items.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const start = (page - 1) * limit;
  return {
    data: items.slice(start, start + limit),
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

const average = (items: number[]) => {
  if (items.length === 0) return 0;
  const sum = items.reduce((acc, value) => acc + Number(value || 0), 0);
  return Math.round((sum / items.length) * 100) / 100;
};

const summarizeUserForAdmin = (profile: any) => {
  const canonicalRole = toCanonicalRole(profile.role);
  const resume = db.resumes.find((entry: any) => entry.userId === profile.id) || null;
  const latestResumeScore = getLatestResumeScore(profile.id);
  const applications = db.applications.filter((entry: any) => entry.candidateId === profile.id);
  const jobsPosted = db.jobs.filter((entry: any) => entry.employerId === profile.id);

  return {
    ...sanitizeUser(profile),
    canonicalRole,
    resumeUploaded: !!resume,
    resumeId: resume?.id || null,
    latestResumeScore: latestResumeScore?.score || 0,
    totalApplications: applications.length,
    totalJobsPosted: jobsPosted.length,
    lastActivityAt:
      resume?.updatedAt ||
      latestResumeScore?.createdAt ||
      applications[applications.length - 1]?.updatedAt ||
      profile.updatedAt ||
      profile.createdAt,
  };
};

const appendAdminLog = async (
  adminProfile: any,
  actionType: string,
  targetType: string,
  targetId: string,
  details: Record<string, any> = {}
) => {
  const record = {
    id: uuidv4(),
    adminId: adminProfile?.id || null,
    adminName: adminProfile?.name || 'Admin',
    actionType,
    targetType,
    targetId,
    details,
    createdAt: new Date(),
  };
  db.adminLogs.unshift(record);
  if (db.adminLogs.length > 5000) db.adminLogs.length = 5000;

  await (supabaseStore as any).insertAdminLog?.(record);
  return record;
};

const toSkillList = (value: any): string[] => {
  if (Array.isArray(value)) return value.map((entry) => String(entry)).filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((entry) => String(entry)).filter(Boolean);
    } catch {
      return value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry || '').trim())
    .filter(Boolean);
};

const normalizeSkillList = (value: unknown): string[] => {
  const raw = Array.isArray(value) ? value : toSkillList(value as any);
  const unique = new Map<string, string>();
  for (const item of raw) {
    const cleaned = String(item || '').trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (!unique.has(key)) unique.set(key, cleaned);
  }
  return Array.from(unique.values());
};

const normalizeResumeParsedData = (value: any, profile: any) => {
  const safe = value && typeof value === 'object' ? value : {};
  const parsedSkills = normalizeSkillList(safe.skills);

  return {
    name: safe.name ? String(safe.name) : profile?.name || '',
    email: safe.email ? String(safe.email) : profile?.email || '',
    phone: safe.phone ? String(safe.phone) : null,
    summary: safe.summary ? String(safe.summary) : null,
    skills: parsedSkills,
    education: Array.isArray(safe.education) ? safe.education : [],
    experience: Array.isArray(safe.experience) ? safe.experience : [],
    projects: Array.isArray(safe.projects) ? safe.projects : [],
    organizations: normalizeStringArray(safe.organizations),
    dates: normalizeStringArray(safe.dates),
  };
};

const buildProcessedFileUrl = (userId: string, fileName: string) => {
  const safeName = sanitizeUploadFilename(fileName || 'resume.pdf');
  return `processed://resumes/${userId}/${Date.now()}-${safeName}`;
};

const safeDeleteTempFile = async (filePath?: string) => {
  if (!filePath) return;
  try {
    await fs.promises.unlink(filePath);
  } catch {
    // Ignore cleanup errors for temp uploads.
  }
};

const getCareerPreference = (userId: string) => {
  const preference = db.careerPreferences.find((entry: any) => entry.userId === userId);
  const roleId = preference?.roleId || CAREER_ROLES[0].id;
  return CAREER_ROLES.some((entry) => entry.id === roleId) ? roleId : CAREER_ROLES[0].id;
};

const setCareerPreference = (userId: string, roleId: string) => {
  const safeRoleId = CAREER_ROLES.some((entry) => entry.id === roleId) ? roleId : CAREER_ROLES[0].id;
  const idx = db.careerPreferences.findIndex((entry: any) => entry.userId === userId);
  const record = {
    userId,
    roleId: safeRoleId,
    updatedAt: new Date(),
  };
  if (idx >= 0) db.careerPreferences[idx] = record;
  else db.careerPreferences.push(record);
  return safeRoleId;
};

const getStudentResumeSkills = (userId: string) => {
  const candidate = db.candidates.find((entry: any) => entry.userId === userId);
  const resume = db.resumes.find((entry: any) => entry.userId === userId);
  return Array.from(
    new Set([
      ...toSkillList(candidate?.skills),
      ...toSkillList(resume?.skills),
      ...toSkillList(resume?.parsedData?.skills),
    ])
  );
};

const getStudentRoadmap = (userId: string, roleId?: string) => {
  const safeRoleId = roleId || getCareerPreference(userId);
  const resumeSkills = getStudentResumeSkills(userId);
  const records = db.skillProgress
    .filter((entry: any) => entry.userId === userId && entry.roleId === safeRoleId)
    .map((entry: any) => ({
      skillName: String(entry.skillName),
      status: entry.status as SkillStatus,
    }));
  return buildRoadmap(safeRoleId, resumeSkills, records);
};

const getLatestResumeScore = (userId: string) => {
  const history = db.resumeScores
    .filter((entry: any) => entry.userId === userId)
    .sort((left: any, right: any) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  return history[0] || null;
};

const ensureResumeScoreHistory = async (userId: string) => {
  const resume = db.resumes.find((entry: any) => entry.userId === userId);
  if (!resume) return null;

  const roleId = getCareerPreference(userId);
  const latest = getLatestResumeScore(userId);
  const resumeUpdatedAt = new Date(resume.updatedAt || resume.createdAt || Date.now());
  const latestCreatedAt = latest ? new Date(latest.createdAt) : null;

  if (latest && latestCreatedAt && latestCreatedAt.getTime() >= resumeUpdatedAt.getTime()) {
    return latest;
  }

  const scorePayload = calculateResumeStrength(resume.parsedData, toSkillList(resume.skills), roleId);
  const record = {
    id: uuidv4(),
    userId,
    roleId,
    score: scorePayload.overallScore,
    sectionScores: scorePayload.sections,
    suggestions: scorePayload.suggestions,
    createdAt: new Date(),
  };
  db.resumeScores.push(record);
  await supabaseStore.upsertResumeScore(record);
  return record;
};

const toHumanReadableImpact = (impact: number) => Math.max(3, Math.min(30, Math.round(impact)));

// Local fallback used when the AI service is unavailable or returns invalid data.
const buildStudentAICoachFallback = (payload: {
  feature: string;
  prompt: string;
  context: Record<string, any>;
}) => {
  const feature = String(payload.feature || 'skill_gap');
  const roleName = String(payload.context?.targetRole || 'your target role');
  const missingSkills = normalizeSkillList(payload.context?.missingSkills || []).slice(0, 3);
  const missingText = missingSkills.length > 0 ? missingSkills.join(', ') : 'core role skills';

  if (feature === 'resume_improvement') {
    return {
      provider: 'fallback',
      model: null,
      feature,
      title: 'Resume Improvement Checklist',
      summary: `Improve your resume for ${roleName} by emphasizing measurable outcomes and relevant skill evidence.`,
      actionItems: [
        'Rewrite top 3 bullets with action + outcome + metric format.',
        'Move role-relevant skills to top section and trim unrelated tools.',
        'Add one project impact metric (performance, users, accuracy, etc.).',
        'Keep layout simple and ATS friendly.',
      ],
      followUpQuestions: [
        'Want ATS keywords for your target role?',
        'Need help rewriting one project bullet?',
      ],
    };
  }

  if (feature === 'interview_prep') {
    return {
      provider: 'fallback',
      model: null,
      feature,
      title: 'Interview Prep Focus',
      summary: `Prepare for ${roleName} interviews with targeted technical practice and concise behavioral stories.`,
      actionItems: [
        'Practice 5 technical questions and keep answers under 2 minutes.',
        'Prepare 3 STAR-format stories (ownership, teamwork, failure).',
        'Review one project deeply: architecture, tradeoffs, and testing.',
        'Run one mock interview this week and capture improvement points.',
      ],
      followUpQuestions: [
        'Need likely interview questions for your role?',
        'Want a mock interview rubric?',
      ],
    };
  }

  if (feature === 'project_ideas') {
    return {
      provider: 'fallback',
      model: null,
      feature,
      title: 'Portfolio Project Plan',
      summary: `Build role-aligned projects that close key gaps in ${missingText}.`,
      actionItems: [
        `Create one mini project centered on ${missingSkills[0] || 'a core skill'} and deploy it.`,
        'Add testing, error handling, and logging to show production quality.',
        'Write concise architecture notes and attach a short demo video.',
        'Highlight measurable outcomes in your resume.',
      ],
      followUpQuestions: [
        'Want weekly milestones for one project?',
        'Need project ideas based on your current skills?',
      ],
    };
  }

  if (feature === 'study_plan') {
    return {
      provider: 'fallback',
      model: null,
      feature,
      title: '4-Week Study Plan',
      summary: `Structured study plan for ${roleName} with focus on ${missingText}.`,
      actionItems: [
        'Week 1: learn one missing core skill and finish foundational lessons.',
        'Week 2: build a small project feature using that skill.',
        'Week 3: improve quality with tests, documentation, and deployment.',
        'Week 4: update portfolio, resume, and do one mock interview.',
      ],
      followUpQuestions: [
        'Need this split into daily tasks?',
        'Want free resources for each week?',
      ],
    };
  }

  return {
    provider: 'fallback',
    model: null,
    feature: 'skill_gap',
    title: 'Skill Gap Guidance',
    summary: `Prioritize missing skills for ${roleName}. Start with ${missingText}.`,
    actionItems: [
      'Pick one missing skill and finish a focused learning track.',
      'Apply it in a small practical project and document outcomes.',
      'Update resume bullets with impact and metrics.',
      'Re-check role match after one week.',
    ],
    followUpQuestions: [
      'Want your missing skills ranked by impact?',
      'Need a beginner-to-advanced resource path?',
    ],
  };
};

// Small backend wrapper so the main route stays focused on business context.
const callStudentAICoach = async (payload: {
  feature: string;
  prompt: string;
  context: Record<string, any>;
}) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const response = await (async () => {
      try {
        return await fetch(`${AI_SERVICE_URL}/ai/student-assistant`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }
    })();
    if (!response.ok) {
      throw new Error(`AI service request failed with status ${response.status}`);
    }
    const data: any = await response.json();
    if (!data || typeof data !== 'object') throw new Error('Invalid AI response');
    return data;
  } catch {
    return buildStudentAICoachFallback(payload);
  }
};

const buildResumeMonitoringRecord = (resume: any) => {
  const student = db.profiles.find((entry: any) => entry.id === resume.userId) || null;
  const latestScore = getLatestResumeScore(resume.userId);
  const parsedData = resume?.parsedData && typeof resume.parsedData === 'object' ? resume.parsedData : {};
  const extractedSkills = normalizeSkillList(parsedData.skills || resume.skills || []);
  const hasStructuredData =
    extractedSkills.length > 0 ||
    (Array.isArray(parsedData.education) && parsedData.education.length > 0) ||
    (Array.isArray(parsedData.experience) && parsedData.experience.length > 0) ||
    (Array.isArray(parsedData.projects) && parsedData.projects.length > 0);
  const parseStatus = hasStructuredData ? 'success' : 'failed';

  const flags: string[] = [];
  if (!resume.fileName || !String(resume.fileName).toLowerCase().endsWith('.pdf')) flags.push('invalid_filename');
  if (extractedSkills.length === 0) flags.push('no_skills_extracted');
  if (!parsedData || Object.keys(parsedData).length === 0) flags.push('empty_parsed_data');
  if (resume.moderationStatus === 'flagged') flags.push('flagged_by_admin');

  return {
    id: resume.id,
    userId: resume.userId,
    student: student ? sanitizeUser(student) : null,
    fileName: resume.fileName,
    fileUrl: resume.fileUrl,
    skills: extractedSkills,
    parseStatus,
    flags,
    resumeScore: latestScore?.score || 0,
    parsedData,
    moderationStatus: resume.moderationStatus || 'clean',
    moderationNotes: resume.moderationNotes || '',
    moderationUpdatedAt: resume.moderationUpdatedAt || null,
    moderationUpdatedBy: resume.moderationUpdatedBy || null,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  };
};

const buildAdminApplicationSummary = (days = 30) => {
  const totalApplications = db.applications.length;
  const byStatus = db.applications.reduce(
    (acc: Record<string, number>, entry: any) => {
      const key = toStorageApplicationStatus(entry.status);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    { pending: 0, shortlisted: 0, interview: 0, rejected: 0 }
  );

  const perJobMap = new Map<string, { jobId: string; title: string; company: string; applications: number }>();
  for (const application of db.applications) {
    const job = db.jobs.find((entry: any) => entry.id === application.jobId);
    if (!job) continue;
    const current = perJobMap.get(job.id) || {
      jobId: job.id,
      title: job.title,
      company: job.company,
      applications: 0,
    };
    current.applications += 1;
    perJobMap.set(job.id, current);
  }

  const perStudentMap = new Map<
    string,
    {
      userId: string;
      name: string;
      email: string;
      applications: number;
    }
  >();
  for (const application of db.applications) {
    const student = db.profiles.find((entry: any) => entry.id === application.candidateId);
    if (!student) continue;
    const current = perStudentMap.get(student.id) || {
      userId: student.id,
      name: student.name,
      email: student.email,
      applications: 0,
    };
    current.applications += 1;
    perStudentMap.set(student.id, current);
  }

  const today = new Date();
  const dailyMap = new Map<string, number>();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, 0);
  }
  for (const application of db.applications) {
    const date = new Date(application.appliedAt || application.createdAt || Date.now());
    const dayKey = date.toISOString().slice(0, 10);
    if (dailyMap.has(dayKey)) {
      dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + 1);
    }
  }

  const matchScores = db.applications
    .map((entry: any) => Number(entry.matchScore || 0))
    .filter((entry: number) => Number.isFinite(entry) && entry > 0);

  return {
    totalApplications,
    averageMatchPercentage: Math.round(average(matchScores)),
    byStatus,
    applicationsPerJob: Array.from(perJobMap.values())
      .sort((left, right) => right.applications - left.applications)
      .slice(0, 10),
    applicationsPerStudent: Array.from(perStudentMap.values())
      .sort((left, right) => right.applications - left.applications)
      .slice(0, 10),
    trendLastDays: Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count })),
  };
};

const PLATFORM_HEALTH_CACHE_TTL_MS = 8000;
let platformHealthCache:
  | {
      expiresAt: number;
      key: string;
      data: any;
    }
  | null = null;

const getPlatformHealthSnapshot = async () => {
  const cacheKey = [
    Number(db.requestMetrics.totalRequests || 0),
    Number(db.requestMetrics.totalErrors || 0),
    Number(db.requestMetrics.authFailures || 0),
    Number(db.requestMetrics.slowRequests || 0),
    Object.keys(db.requestMetrics.endpoints || {}).length,
  ].join(':');
  if (platformHealthCache && platformHealthCache.expiresAt > Date.now() && platformHealthCache.key === cacheKey) {
    return platformHealthCache.data;
  }

  const totalRequests = Number(db.requestMetrics.totalRequests || 0);
  const totalErrors = Number(db.requestMetrics.totalErrors || 0);
  const authFailures = Number(db.requestMetrics.authFailures || 0);
  const endpoints = db.requestMetrics.endpoints || {};

  const endpointStats = Object.entries(endpoints).map(([name, entry]: [string, any]) => {
    const count = Number(entry?.count || 0);
    const totalDurationMs = Number(entry?.totalDurationMs || 0);
    const avgDurationMs = count > 0 ? totalDurationMs / count : 0;
    return {
      endpoint: name,
      count,
      errors: Number(entry?.errors || 0),
      avgDurationMs: Math.round(avgDurationMs),
      maxDurationMs: Number(entry?.maxDurationMs || 0),
      slowCount: Number(entry?.slowCount || 0),
      errorRate: count > 0 ? Math.round((Number(entry?.errors || 0) / count) * 10000) / 100 : 0,
      lastStatusCode: Number(entry?.lastStatusCode || 0),
      lastSeenAt: entry?.lastSeenAt || null,
    };
  });

  const slowEndpoints = [...endpointStats]
    .filter((entry) => entry.avgDurationMs >= SLOW_ENDPOINT_THRESHOLD_MS || entry.slowCount > 0)
    .sort((left, right) => right.avgDurationMs - left.avgDurationMs)
    .slice(0, 6);

  const aiHealth = {
    status: 'unknown',
    statusCode: null as number | null,
    latencyMs: null as number | null,
  };
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const aiResponse = await fetch(`${AI_SERVICE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    aiHealth.status = aiResponse.ok ? 'up' : 'degraded';
    aiHealth.statusCode = aiResponse.status;
    aiHealth.latencyMs = Date.now() - started;
  } catch {
    aiHealth.status = 'down';
    aiHealth.latencyMs = Date.now() - started;
  } finally {
    clearTimeout(timeout);
  }

  const uptimeSeconds = Math.floor((Date.now() - SERVER_STARTED_AT) / 1000);
  const apiErrorRate = totalRequests > 0 ? Math.round((totalErrors / totalRequests) * 10000) / 100 : 0;

  const snapshot = {
    uptimeSeconds,
    totalRequests,
    totalErrors,
    apiErrorRate,
    authFailures,
    slowRequests: Number(db.requestMetrics.slowRequests || 0),
    slowThresholdMs: SLOW_ENDPOINT_THRESHOLD_MS,
    avgResponseMs:
      endpointStats.length > 0
        ? Math.round(average(endpointStats.map((entry) => Number(entry.avgDurationMs || 0))))
        : 0,
    slowEndpoints,
    aiService: aiHealth,
  };
  platformHealthCache = {
    expiresAt: Date.now() + PLATFORM_HEALTH_CACHE_TTL_MS,
    key: cacheKey,
    data: snapshot,
  };
  return snapshot;
};

const jobRequirementText = (job: any) => {
  const requirements = Array.isArray(job.requirements) ? job.requirements.join(', ') : String(job.requirements || '');
  const skills = Array.isArray(job.skills) ? job.skills.join(', ') : String(job.skills || '');
  return `${job.title || ''}. ${job.description || ''}. Requirements: ${requirements}. Skills: ${skills}`.trim();
};

const tokenizeSkillTerms = (skills: string[]) =>
  skills
    .flatMap((skill) => String(skill).toLowerCase().split(/[^a-z0-9+#.]+/g))
    .map((token) => token.trim())
    .filter(Boolean);

const computeTfIdfCosine = (resumeSkills: string[], requiredSkills: string[]) => {
  const docA = tokenizeSkillTerms(resumeSkills);
  const docB = tokenizeSkillTerms(requiredSkills);
  if (docA.length === 0 || docB.length === 0) return 0;

  const documents = [docA, docB];
  const vocab = Array.from(new Set([...docA, ...docB]));
  const idf = new Map<string, number>();
  for (const term of vocab) {
    const docFreq = documents.reduce((count, doc) => count + (doc.includes(term) ? 1 : 0), 0);
    idf.set(term, Math.log((documents.length + 1) / (docFreq + 1)) + 1);
  }

  const vectorize = (doc: string[]) => {
    const termCount = new Map<string, number>();
    for (const term of doc) {
      termCount.set(term, (termCount.get(term) || 0) + 1);
    }
    const docLength = doc.length || 1;
    return vocab.map((term) => {
      const tf = (termCount.get(term) || 0) / docLength;
      return tf * (idf.get(term) || 0);
    });
  };

  const a = vectorize(docA);
  const b = vectorize(docB);
  const dot = a.reduce((sum, entry, idx) => sum + entry * b[idx], 0);
  const magA = Math.sqrt(a.reduce((sum, entry) => sum + entry * entry, 0));
  const magB = Math.sqrt(b.reduce((sum, entry) => sum + entry * entry, 0));
  if (magA === 0 || magB === 0) return 0;
  return Math.max(0, Math.min(1, dot / (magA * magB)));
};

const toDisplaySkill = (skill: string) =>
  skill
    .split(' ')
    .map((segment) =>
      segment.length <= 3
        ? segment.toUpperCase()
        : segment.charAt(0).toUpperCase() + segment.slice(1)
    )
    .join(' ');

const localMatchScore = (resumeSkills: string[], requiredSkills: string[]) => {
  const normalizedResume = Array.from(
    new Set(resumeSkills.map((skill) => String(skill).trim().toLowerCase()).filter(Boolean))
  );
  const requiredDisplayMap = new Map<string, string>();
  for (const rawSkill of requiredSkills) {
    const normalized = String(rawSkill).trim().toLowerCase();
    if (!normalized) continue;
    if (!requiredDisplayMap.has(normalized)) {
      requiredDisplayMap.set(normalized, toDisplaySkill(String(rawSkill).trim()));
    }
  }
  const normalizedRequired = Array.from(requiredDisplayMap.keys());
  const resumeSet = new Set(normalizedResume);
  const matched = normalizedRequired.filter((skill) => resumeSet.has(skill));
  const missing = normalizedRequired.filter((skill) => !resumeSet.has(skill));

  const exactCoverage = normalizedRequired.length > 0 ? matched.length / normalizedRequired.length : 0;
  const semanticSimilarity = computeTfIdfCosine(normalizedResume, normalizedRequired);
  const blendedScore = exactCoverage * 0.65 + semanticSimilarity * 0.35;
  const matchScore = Math.round(Math.max(0, Math.min(1, blendedScore)) * 100);

  const matchQuality =
    matchScore >= 75
      ? 'Strong alignment between profile and required skills.'
      : matchScore >= 50
        ? 'Moderate alignment. Upskilling in missing areas is recommended.'
        : 'Low alignment. Focus on building core required skills.';

  return {
    matchScore,
    matchedSkills: matched.map((skill) => requiredDisplayMap.get(skill) || toDisplaySkill(skill)),
    missingSkills: missing.map((skill) => requiredDisplayMap.get(skill) || toDisplaySkill(skill)),
    explanation: matchQuality,
  };
};

const getMatchInsights = async (resumeSkills: string[], job: any) => {
  const sanitizedSkills = resumeSkills.map((entry) => String(entry).trim()).filter(Boolean);
  const requiredSkills = toSkillList(job.skills?.length ? job.skills : job.requirements);
  const requirementsText = jobRequirementText(job);

  try {
    const aiResponse = await fetch(`${AI_SERVICE_URL}/ai/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeSkills: sanitizedSkills,
        jobRequirements: requirementsText,
        jobRequiredSkills: requiredSkills,
        includeExplanation: true,
      }),
    });

    if (!aiResponse.ok) throw new Error(`AI match failed with status ${aiResponse.status}`);
    const aiData: any = await aiResponse.json();
    const rawScore = Number(aiData.matchScore || 0);
    const normalizedScore = rawScore > 1 ? rawScore / 100 : rawScore;
    return {
      matchScore: Math.round(Math.max(0, Math.min(1, normalizedScore)) * 100),
      matchedSkills: Array.isArray(aiData.matchedSkills) ? aiData.matchedSkills : [],
      missingSkills: Array.isArray(aiData.missingSkills) ? aiData.missingSkills : [],
      explanation: aiData.explanation || null,
    };
  } catch {
    return localMatchScore(sanitizedSkills, requiredSkills);
  }
};

type CandidateMatchSortBy = 'match' | 'resume' | 'experience';
type CandidateMatchSortOrder = 'asc' | 'desc';

interface CandidateMatchOptions {
  sortBy?: CandidateMatchSortBy;
  order?: CandidateMatchSortOrder;
  limit?: number;
  appliedOnly?: boolean;
}

const CANDIDATE_MATCH_CACHE_TTL_MS = 60 * 1000;
const candidateMatchCache = new Map<
  string,
  {
    expiresAt: number;
    data: any[];
    meta: {
      totalCandidates: number;
      candidatesWithResume: number;
      candidatesWithoutResume: number;
      generatedAt: string;
      source: 'computed' | 'cache';
    };
  }
>();

const STUDENT_RECOMMENDATIONS_CACHE_TTL_MS = 20 * 1000;
const studentRecommendationCache = new Map<
  string,
  {
    expiresAt: number;
    data: any;
  }
>();

const RECRUITER_OVERVIEW_CACHE_TTL_MS = 10 * 1000;
const recruiterOverviewCache = new Map<
  string,
  {
    expiresAt: number;
    data: any;
  }
>();

const getCollectionVersion = (collection: any[], updatedField = 'updatedAt', createdField = 'createdAt') =>
  collection.reduce((acc: number, entry: any) => {
    const ts = new Date(entry?.[updatedField] || entry?.[createdField] || 0).getTime();
    return Math.max(acc, Number.isFinite(ts) ? ts : 0);
  }, 0);

const pruneRecruiterOverviewCache = () => {
  const now = Date.now();
  for (const [key, entry] of recruiterOverviewCache.entries()) {
    if (entry.expiresAt <= now) recruiterOverviewCache.delete(key);
  }
};

const buildRecruiterOverviewCacheKey = (profile: any) => {
  const scope = roleMatches(profile.role, 'admin') ? 'admin' : `recruiter:${profile.id}`;
  const jobs = roleMatches(profile.role, 'admin')
    ? db.jobs
    : db.jobs.filter((entry: any) => entry.employerId === profile.id);
  const jobIds = new Set(jobs.map((entry: any) => entry.id));
  const scopedApplications = db.applications.filter((entry: any) => jobIds.has(entry.jobId));

  return [
    scope,
    jobs.length,
    getCollectionVersion(jobs),
    scopedApplications.length,
    getCollectionVersion(scopedApplications, 'updatedAt', 'appliedAt'),
    db.candidates.length,
    getCollectionVersion(db.candidates),
    db.resumes.length,
    getCollectionVersion(db.resumes),
  ].join(':');
};

const parseYearRangeFromText = (text: string) => {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ');
  const explicitYears = [...normalized.matchAll(/(\d{1,2}(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?|yr)\b/g)];
  if (explicitYears.length > 0) {
    const sum = explicitYears.reduce((acc, match) => acc + Number(match[1] || 0), 0);
    return Number.isFinite(sum) ? Math.round(sum * 10) / 10 : 0;
  }

  const explicitMonths = [...normalized.matchAll(/(\d{1,2}(?:\.\d+)?)\s*(?:months?|mos?)\b/g)];
  if (explicitMonths.length > 0) {
    const months = explicitMonths.reduce((acc, match) => acc + Number(match[1] || 0), 0);
    const years = months / 12;
    return Number.isFinite(years) ? Math.round(years * 10) / 10 : 0;
  }

  const years = [...normalized.matchAll(/\b(19|20)\d{2}\b/g)].map((match) => Number(match[0]));
  if (years.length >= 2) {
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    return Math.max(0, Math.min(30, maxYear - minYear));
  }
  return 0;
};

const estimateExperienceYears = (candidate: any, resume: any) => {
  const candidateEntries = (() => {
    try {
      const parsed = JSON.parse(candidate?.experience || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();
  const resumeEntries = Array.isArray(resume?.parsedData?.experience) ? resume.parsedData.experience : [];
  const allEntries = [...candidateEntries, ...resumeEntries];

  if (allEntries.length === 0) return 0;

  let years = 0;
  for (const entry of allEntries) {
    const text = [
      String(entry?.duration || ''),
      String(entry?.description || ''),
      String(entry?.title || ''),
      String(entry?.company || ''),
    ]
      .join(' ')
      .trim();
    years += parseYearRangeFromText(text);
  }

  if (years <= 0) {
    years = Math.min(12, allEntries.length * 0.5);
  }
  return Math.round(Math.min(30, years) * 10) / 10;
};

const buildCandidateMatchCacheKey = (job: any, options: CandidateMatchOptions) => {
  const candidatesVersion = db.candidates.reduce((acc: number, entry: any) => {
    const ts = new Date(entry?.updatedAt || entry?.createdAt || 0).getTime();
    return Math.max(acc, ts || 0);
  }, 0);
  const resumesVersion = db.resumes.reduce((acc: number, entry: any) => {
    const ts = new Date(entry?.updatedAt || entry?.createdAt || 0).getTime();
    return Math.max(acc, ts || 0);
  }, 0);
  const applicationsVersion = db.applications.reduce((acc: number, entry: any) => {
    const ts = new Date(entry?.updatedAt || entry?.appliedAt || 0).getTime();
    return Math.max(acc, ts || 0);
  }, 0);

  return [
    job.id,
    new Date(job.updatedAt || job.createdAt || 0).getTime(),
    db.candidates.length,
    candidatesVersion,
    db.resumes.length,
    resumesVersion,
    db.applications.length,
    applicationsVersion,
    options.sortBy || 'match',
    options.order || 'desc',
    options.limit || 100,
    options.appliedOnly ? 'applied' : 'all',
  ].join(':');
};

const pruneCandidateMatchCache = () => {
  const now = Date.now();
  for (const [key, value] of candidateMatchCache.entries()) {
    if (value.expiresAt <= now) candidateMatchCache.delete(key);
  }
};

const pruneStudentRecommendationCache = () => {
  const now = Date.now();
  for (const [key, value] of studentRecommendationCache.entries()) {
    if (value.expiresAt <= now) studentRecommendationCache.delete(key);
  }
};

const toSortDirection = (value: unknown): CandidateMatchSortOrder => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'asc' ? 'asc' : 'desc';
};

const toSortKey = (value: unknown): CandidateMatchSortBy => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'resume') return 'resume';
  if (normalized === 'experience') return 'experience';
  return 'match';
};

const sortCandidateMatches = (matches: any[], options: CandidateMatchOptions) => {
  const sortBy = options.sortBy || 'match';
  const direction = options.order === 'asc' ? 1 : -1;
  const sorted = [...matches].sort((left, right) => {
    if (sortBy === 'resume') {
      const resumeDiff = (left.resumeScore || 0) - (right.resumeScore || 0);
      if (resumeDiff !== 0) return resumeDiff * direction;
    } else if (sortBy === 'experience') {
      const experienceDiff = (left.experienceYears || 0) - (right.experienceYears || 0);
      if (experienceDiff !== 0) return experienceDiff * direction;
    } else {
      const matchDiff = (left.matchScore || 0) - (right.matchScore || 0);
      if (matchDiff !== 0) return matchDiff * direction;
    }

    const fallbackMatchDiff = (left.matchScore || 0) - (right.matchScore || 0);
    if (fallbackMatchDiff !== 0) return fallbackMatchDiff * direction;
    return String(left.name || '').localeCompare(String(right.name || ''));
  });

  const safeLimit =
    Number.isFinite(options.limit) && Number(options.limit) > 0
      ? Math.min(200, Number(options.limit))
      : 100;
  return sorted.slice(0, safeLimit);
};

const getCandidateMatchesForJob = async (job: any, options: CandidateMatchOptions = {}) => {
  pruneCandidateMatchCache();
  const cacheKey = buildCandidateMatchCacheKey(job, options);
  const cached = candidateMatchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      matches: cached.data,
      meta: {
        ...cached.meta,
        source: 'cache' as const,
      },
    };
  }

  const allMatches = await Promise.all(
    db.candidates.map(async (candidate: any) => {
      const candidateSkills = normalizeSkillList(candidate.skills);
      const insights = await getMatchInsights(candidateSkills, job);
      const student = db.profiles.find((entry: any) => entry.id === candidate.userId);
      const application = db.applications.find(
        (entry: any) => entry.jobId === job.id && entry.candidateId === candidate.userId
      );
      const resume = db.resumes.find((entry: any) => entry.userId === candidate.userId) || null;
      const latestResumeScore = getLatestResumeScore(candidate.userId);
      const resumeScore = latestResumeScore ? Number(latestResumeScore.score || 0) : 0;
      const experienceYears = estimateExperienceYears(candidate, resume);
      const topSkills = insights.matchedSkills.slice(0, 3);

      return {
        candidateId: candidate.id,
        studentId: candidate.userId,
        name: candidate.name,
        email: candidate.email,
        role: candidate.role,
        skills: candidateSkills,
        matchScore: insights.matchScore,
        matchedSkills: insights.matchedSkills,
        missingSkills: insights.missingSkills,
        explanation: insights.explanation,
        hasApplied: !!application,
        applicationStatus: application?.status || null,
        resumeScore: Math.max(0, Math.min(100, Math.round(resumeScore))),
        experienceYears,
        topSkills,
        latestResumeAt: resume?.updatedAt || resume?.createdAt || null,
        student,
      };
    })
  );

  const candidatesWithResume = allMatches.filter((entry) => entry.resumeScore > 0).length;
  const filtered = options.appliedOnly ? allMatches.filter((entry) => entry.hasApplied) : allMatches;
  const sorted = sortCandidateMatches(filtered, options);
  const meta = {
    totalCandidates: db.candidates.length,
    candidatesWithResume,
    candidatesWithoutResume: Math.max(0, db.candidates.length - candidatesWithResume),
    generatedAt: new Date().toISOString(),
    source: 'computed' as const,
  };

  candidateMatchCache.set(cacheKey, {
    expiresAt: Date.now() + CANDIDATE_MATCH_CACHE_TTL_MS,
    data: sorted,
    meta,
  });

  return {
    matches: sorted,
    meta,
  };
};

const getRecruiterJobAnalytics = (job: any, matches: any[]) => {
  const applicants = matches.filter((entry) => entry.hasApplied);
  const avgMatch = matches.length
    ? Math.round(matches.reduce((sum, entry) => sum + Number(entry.matchScore || 0), 0) / matches.length)
    : 0;
  const avgApplicantMatch = applicants.length
    ? Math.round(applicants.reduce((sum, entry) => sum + Number(entry.matchScore || 0), 0) / applicants.length)
    : 0;
  const highest = matches[0] || null;
  const missingSkillCount = new Map<string, number>();
  for (const match of matches) {
    for (const skill of match.missingSkills || []) {
      const key = String(skill).trim();
      if (!key) continue;
      missingSkillCount.set(key, (missingSkillCount.get(key) || 0) + 1);
    }
  }
  const mostMissingSkill = Array.from(missingSkillCount.entries()).sort((a, b) => b[1] - a[1])[0] || null;

  return {
    jobId: job.id,
    title: job.title,
    totalCandidatesRanked: matches.length,
    totalApplicants: applicants.length,
    averageMatch: avgMatch,
    averageApplicantMatch: avgApplicantMatch,
    highestMatchCandidate: highest
      ? {
          candidateId: highest.candidateId,
          name: highest.name,
          matchScore: highest.matchScore,
          resumeScore: highest.resumeScore,
        }
      : null,
    mostMissingSkill: mostMissingSkill
      ? {
          skill: mostMissingSkill[0],
          count: mostMissingSkill[1],
        }
      : null,
  };
};

const pruneExpiredResetTokens = () => {
  const now = Date.now();
  for (const [token, value] of resetTokens.entries()) {
    if (value.expiresAt <= now) resetTokens.delete(token);
  }
};

// Auth Routes
// Authentication routes: registration, login, password reset, logout, and profile state.
app.post('/api/auth/register', authLimiter, async (req, res) => {
  const email = String(req.body?.email || '')
    .trim()
    .toLowerCase();
  const password = String(req.body?.password || '');
  const name = String(req.body?.name || '').trim();
  const requestedRole = String(req.body?.role || '').toLowerCase();
  const safeRole: SupportedRole = (requestedRole === 'employer' || requestedRole === 'admin') 
    ? requestedRole 
    : 'student';

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const existing = db.profiles.find((p: any) => p.email?.toLowerCase() === email);
  if (existing) return res.status(400).json({ message: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 10);

  const profile = {
    id: uuidv4(),
    email,
    passwordHash,
    name,
    role: safeRole,
    avatarUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  db.profiles.push(profile);
  await supabaseStore.upsertUser(profile);

  const token = createToken(profile.id);
  res.status(201).json({ token, user: sanitizeUser(profile) });
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const email = String(req.body?.email || '')
    .trim()
    .toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const profile = db.profiles.find((p: any) => p.email?.toLowerCase() === email);
  if (!profile || profile.isActive === false) return res.status(401).json({ message: 'Invalid credentials' });

  const isValid = profile.passwordHash ? await bcrypt.compare(password, profile.passwordHash) : false;
  if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });

  const token = createToken(profile.id);
  res.json({ token, user: sanitizeUser(profile) });
});

app.get('/api/auth/me', requireAuth, (req: RequestWithAuth, res) => {
  res.json({ user: sanitizeUser(req.profile) });
});

app.post('/api/auth/logout', requireAuth, (req: RequestWithAuth, res) => {
  if (req.authToken) revokedTokens.add(req.authToken);
  res.json({ message: 'Logged out successfully' });
});

app.put('/api/auth/profile', requireAuth, async (req: RequestWithAuth, res) => {
  const profile = req.profile;
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });

  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : undefined;
  const avatarUrl = typeof req.body?.avatarUrl === 'string' ? req.body.avatarUrl.trim() : undefined;

  if (name !== undefined && name.length === 0) {
    return res.status(400).json({ message: 'name cannot be empty' });
  }

  if (name !== undefined) profile.name = name;
  if (avatarUrl !== undefined) profile.avatarUrl = avatarUrl || null;
  profile.updatedAt = new Date();
  await supabaseStore.upsertUser(profile);

  res.json({ user: sanitizeUser(profile) });
});

app.put('/api/auth/password', authLimiter, requireAuth, async (req: RequestWithAuth, res) => {
  const profile = req.profile;
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });

  const currentPassword = String(req.body?.currentPassword || '');
  const newPassword = String(req.body?.newPassword || '');
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'currentPassword and newPassword are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'newPassword must be at least 6 characters' });
  }

  const isValid = profile.passwordHash ? await bcrypt.compare(currentPassword, profile.passwordHash) : false;
  if (!isValid) return res.status(401).json({ message: 'Current password is invalid' });

  profile.passwordHash = await bcrypt.hash(newPassword, 10);
  profile.updatedAt = new Date();
  await supabaseStore.upsertUser(profile);

  res.json({ message: 'Password updated successfully' });
});

app.post('/api/auth/password/forgot', authLimiter, (req, res) => {
  pruneExpiredResetTokens();
  const email = String(req.body?.email || '')
    .trim()
    .toLowerCase();
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const profile = db.profiles.find((entry: any) => entry.email?.toLowerCase() === email);
  if (profile && profile.isActive !== false) {
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000;
    resetTokens.set(token, { userId: profile.id, expiresAt });

    if (ALLOW_INSECURE_PASSWORD_RESET_TOKEN_RESPONSE) {
      return res.json({
        message: 'Password reset token generated for local-only testing.',
        resetToken: token,
        expiresAt: new Date(expiresAt).toISOString(),
      });
    }
  }

  return res.json({ message: 'If the account exists, a password reset link was sent.' });
});

app.post('/api/auth/password/reset', authLimiter, async (req, res) => {
  pruneExpiredResetTokens();
  const resetToken = String(req.body?.token || '');
  const newPassword = String(req.body?.newPassword || '');
  if (!resetToken || !newPassword) {
    return res.status(400).json({ message: 'token and newPassword are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'newPassword must be at least 6 characters' });
  }

  const tokenPayload = resetTokens.get(resetToken);
  if (!tokenPayload || tokenPayload.expiresAt <= Date.now()) {
    resetTokens.delete(resetToken);
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  const profile = db.profiles.find((entry: any) => entry.id === tokenPayload.userId);
  if (!profile || profile.isActive === false) {
    resetTokens.delete(resetToken);
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  profile.passwordHash = await bcrypt.hash(newPassword, 10);
  profile.updatedAt = new Date();
  resetTokens.delete(resetToken);
  await supabaseStore.upsertUser(profile);

  res.json({ message: 'Password has been reset' });
});

// Users Routes (admin only)
app.get('/api/users', requireAuth, requireRoles('admin'), adminLimiter, (req, res) => {
  const { search, role, sortBy, order } = req.query;
  const { page, limit } = getPagination(req.query as any, { page: 1, limit: 20, maxLimit: 100 });
  const direction = String(order || 'desc').toLowerCase() === 'asc' ? 1 : -1;
  const sortKey = String(sortBy || 'createdAt').toLowerCase();

  let users = db.profiles.map((entry: any) => summarizeUserForAdmin(entry));

  if (search) {
    const searchText = String(search).toLowerCase();
    users = users.filter(
      (entry: any) =>
        entry.name?.toLowerCase().includes(searchText) ||
        entry.email?.toLowerCase().includes(searchText)
    );
  }

  if (role) {
    users = users.filter((entry: any) => roleFilterMatches(entry.role, String(role)));
  }

  users.sort((left: any, right: any) => {
    if (sortKey === 'name') return String(left.name || '').localeCompare(String(right.name || '')) * direction;
    if (sortKey === 'email') return String(left.email || '').localeCompare(String(right.email || '')) * direction;
    if (sortKey === 'role') return String(left.canonicalRole || '').localeCompare(String(right.canonicalRole || '')) * direction;
    if (sortKey === 'applications') return (Number(left.totalApplications || 0) - Number(right.totalApplications || 0)) * direction;
    if (sortKey === 'jobs') return (Number(left.totalJobsPosted || 0) - Number(right.totalJobsPosted || 0)) * direction;
    if (sortKey === 'resumescore') return (Number(left.latestResumeScore || 0) - Number(right.latestResumeScore || 0)) * direction;
    return (
      (new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime()) * direction
    );
  });

  const paginated = paginateData(users, page, limit);
  res.json({ data: paginated.data, meta: paginated.meta });
});

app.get('/api/users/:id', requireAuth, requireRoles('admin'), adminLimiter, (req, res) => {
  const target = db.profiles.find((entry: any) => entry.id === req.params.id);
  if (!target) return res.status(404).json({ message: 'User not found' });

  const summary = summarizeUserForAdmin(target);
  const resume = db.resumes.find((entry: any) => entry.userId === target.id) || null;
  const recentApplications = withApplicationDetails(
    db.applications
      .filter((entry: any) => entry.candidateId === target.id)
      .sort((left: any, right: any) => new Date(right.appliedAt || 0).getTime() - new Date(left.appliedAt || 0).getTime())
      .slice(0, 10)
  );
  const jobsPosted = db.jobs
    .filter((entry: any) => entry.employerId === target.id)
    .sort((left: any, right: any) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime())
    .slice(0, 10);

  res.json({
    data: {
      ...summary,
      resume,
      recentApplications,
      jobsPosted,
    },
  });
});

app.put('/api/users/:id', requireAuth, requireRoles('admin'), adminLimiter, async (req: RequestWithAuth, res) => {
  const profile = req.profile;
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });

  const idx = db.profiles.findIndex((entry: any) => entry.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'User not found' });

  if (req.params.id === profile.id && req.body.isActive === false) {
    return res.status(400).json({ message: 'You cannot deactivate your own account' });
  }

  const current = db.profiles[idx];
  const updates: Record<string, any> = {};
  if (typeof req.body?.name === 'string') updates.name = req.body.name.trim();
  if (typeof req.body?.email === 'string') updates.email = req.body.email.trim().toLowerCase();
  if (typeof req.body?.avatarUrl === 'string' || req.body?.avatarUrl === null) {
    updates.avatarUrl = req.body.avatarUrl;
  }
  if (typeof req.body?.isActive === 'boolean') updates.isActive = req.body.isActive;
  if (req.body?.role) updates.role = toStorageRole(req.body.role);

  const next = { ...current, ...updates, updatedAt: new Date() };
  db.profiles[idx] = next;
  await supabaseStore.upsertUser(next);

  const changedFields: Record<string, any> = {};
  for (const key of ['name', 'email', 'role', 'isActive'] as const) {
    if (current[key] !== next[key]) {
      changedFields[key] = { from: current[key], to: next[key] };
    }
  }
  if (Object.keys(changedFields).length > 0) {
    await appendAdminLog(profile, 'user_updated', 'user', next.id, { changedFields });
  }

  res.json({ data: summarizeUserForAdmin(next) });
});

app.delete('/api/users/:id', requireAuth, requireRoles('admin'), adminLimiter, async (req: RequestWithAuth, res) => {
  const profile = req.profile;
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (req.params.id === profile.id) return res.status(400).json({ message: 'You cannot delete your own account' });

  const idx = db.profiles.findIndex((entry: any) => entry.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'User not found' });

  const target = db.profiles[idx];
  const softDelete = String(req.query?.soft || '').toLowerCase() === 'true';
  const activeAdminCount = db.profiles.filter((entry: any) => roleMatches(entry.role, 'admin') && entry.isActive !== false).length;
  if (roleMatches(target.role, 'admin') && activeAdminCount <= 1) {
    return res.status(400).json({ message: 'Cannot delete the last active admin account' });
  }

  if (softDelete) {
    db.profiles[idx] = {
      ...target,
      isActive: false,
      updatedAt: new Date(),
    };
    await supabaseStore.upsertUser(db.profiles[idx]);
    await appendAdminLog(profile, 'user_deactivated', 'user', target.id, { softDelete: true });
    return res.json({ message: 'User deactivated', data: summarizeUserForAdmin(db.profiles[idx]) });
  }

  const recruiterJobIds = db.jobs
    .filter((entry: any) => entry.employerId === target.id)
    .map((entry: any) => entry.id);

  db.profiles.splice(idx, 1);
  db.candidates = db.candidates.filter((entry: any) => entry.userId !== req.params.id);
  db.resumes = db.resumes.filter((entry: any) => entry.userId !== req.params.id);
  db.applications = db.applications.filter(
    (entry: any) => entry.candidateId !== req.params.id && !recruiterJobIds.includes(entry.jobId)
  );
  db.jobs = db.jobs.filter((entry: any) => entry.employerId !== req.params.id);
  db.recommendations = db.recommendations.filter((entry: any) => entry.userId !== req.params.id);
  db.resumeScores = db.resumeScores.filter((entry: any) => entry.userId !== req.params.id);
  db.skillProgress = db.skillProgress.filter((entry: any) => entry.userId !== req.params.id);
  db.learningPlans = db.learningPlans.filter((entry: any) => entry.userId !== req.params.id);
  db.mockInterviewSessions = db.mockInterviewSessions.filter((entry: any) => entry.userId !== req.params.id);
  db.savedJobs = db.savedJobs.filter((entry: any) => entry.userId !== req.params.id);
  db.careerPreferences = db.careerPreferences.filter((entry: any) => entry.userId !== req.params.id);

  await supabaseStore.deleteUser(req.params.id);
  await supabaseStore.deleteCandidatesByUser(req.params.id);
  await supabaseStore.deleteResumesByUser(req.params.id);
  await supabaseStore.deleteApplicationsByCandidate(req.params.id);
  await supabaseStore.deleteRecommendationsByUser(req.params.id);
  await supabaseStore.deleteResumeScoresByUser(req.params.id);
  await supabaseStore.deleteSkillProgressByUser(req.params.id);
  await supabaseStore.deleteLearningPlansByUser(req.params.id);
  await supabaseStore.deleteMockInterviewSessionsByUser(req.params.id);
  await supabaseStore.deleteSavedJobsByUser(req.params.id);
  await supabaseStore.deleteCareerPreference(req.params.id);
  for (const jobId of recruiterJobIds) {
    await supabaseStore.deleteApplicationsByJob(jobId);
    await supabaseStore.deleteJob(jobId);
  }

  await appendAdminLog(profile, 'user_deleted', 'user', target.id, {
    cascade: {
      recruiterJobsRemoved: recruiterJobIds.length,
    },
  });
  res.json({ message: 'User deleted' });
});

// Resume Upload Route
app.post(
  '/api/resume/upload',
  requireAuth,
  requireRoles('student'),
  resumeUploadMiddleware,
  async (req: RequestWithAuth, res) => {
    const profile = req.profile;
    if (!profile) return res.status(401).json({ message: 'Not authenticated' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const shouldReplaceExisting = String(req.body?.replaceExisting ?? 'true').toLowerCase() !== 'false';
    const existingResumeIndex = db.resumes.findIndex((entry: any) => entry.userId === profile.id);
    if (existingResumeIndex >= 0 && !shouldReplaceExisting) {
      return res.status(409).json({
        message: 'A resume already exists. Set replaceExisting=true to replace it.',
      });
    }

    const fallbackParsedData = normalizeResumeParsedData(
      {
        name: profile.name,
        email: profile.email,
        phone: null,
        summary: null,
        education: [],
        experience: [],
        projects: [],
        skills: [],
      },
      profile
    );
    let parsedData = fallbackParsedData;
    let skills: string[] = normalizeSkillList(fallbackParsedData.skills);

    try {
      try {
        const fileBuffer =
          req.file.buffer && req.file.buffer.length > 0
            ? req.file.buffer
            : req.file.path
              ? await fs.promises.readFile(req.file.path)
              : Buffer.alloc(0);
        const formData = new FormData();
        formData.append('file', new Blob([fileBuffer], { type: 'application/pdf' }), req.file.originalname);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
          const aiResponse = await fetch(`${AI_SERVICE_URL}/ai/parse-resume`, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });

          if (aiResponse.ok) {
            const aiData: any = await aiResponse.json();
            parsedData = normalizeResumeParsedData(aiData?.parsedData, profile);
            skills = normalizeSkillList(aiData?.skills?.length ? aiData.skills : parsedData.skills);
            parsedData.skills = skills;
          } else {
            console.warn('AI parsing failed with status', aiResponse.status);
          }
        } finally {
          clearTimeout(timeout);
        }
      } catch (aiError) {
        console.warn('AI service unavailable, using fallback parsing');
        console.warn(aiError);
      }

      const replaced = existingResumeIndex >= 0;
      const resume = {
        id: replaced ? db.resumes[existingResumeIndex].id : uuidv4(),
        userId: profile.id,
        fileUrl: buildProcessedFileUrl(profile.id, req.file.originalname),
        fileName: req.file.originalname,
        parsedData,
        skills,
        createdAt: replaced ? db.resumes[existingResumeIndex].createdAt : new Date(),
        updatedAt: new Date(),
      };

      if (replaced) {
        db.resumes[existingResumeIndex] = resume;
      } else {
        db.resumes.push(resume);
      }
      await supabaseStore.upsertResume(resume);

      let candidate = db.candidates.find((entry: any) => entry.userId === profile.id);
      if (candidate) {
        candidate.skills = JSON.stringify(skills);
        candidate.education = JSON.stringify(parsedData.education || []);
        candidate.experience = JSON.stringify(parsedData.experience || []);
        candidate.parsedData = parsedData;
        candidate.updatedAt = new Date();
        await supabaseStore.upsertCandidate(candidate);
      } else {
        candidate = {
          id: uuidv4(),
          userId: profile.id,
          name: profile.name,
          email: profile.email,
          role: 'Student',
          skills: JSON.stringify(skills),
          education: JSON.stringify(parsedData.education || []),
          experience: JSON.stringify(parsedData.experience || []),
          parsedData,
          matchScore: 0,
          status: 'new',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        db.candidates.push(candidate);
        await supabaseStore.upsertCandidate(candidate);
      }

      const latestScore = await ensureResumeScoreHistory(profile.id);

      return res.status(replaced ? 200 : 201).json({ data: { ...resume, latestScore, replaced } });
    } catch (error: any) {
      console.error('Resume upload error:', error);
      return res.status(500).json({ message: error.message || 'Failed to upload resume' });
    } finally {
      await safeDeleteTempFile(req.file.path);
    }
  }
);

// Get my resume
app.get('/api/resume', requireAuth, requireRoles('student'), (req: RequestWithAuth, res) => {
  const profile = req.profile;
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });

  const resume = db.resumes.find((r: any) => r.userId === profile.id);
  if (!resume) return res.status(404).json({ message: 'No resume found' });

  const latestScore = getLatestResumeScore(profile.id);
  res.json({ data: { ...resume, latestScore } });
});

// Delete resume
app.delete('/api/resume/:id', requireAuth, requireRoles('student'), async (req: RequestWithAuth, res) => {
  const profile = req.profile;
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });

  const idx = db.resumes.findIndex((r: any) => r.id === req.params.id && r.userId === profile.id);
  if (idx === -1) return res.status(404).json({ message: 'Resume not found' });

  db.resumes.splice(idx, 1);
  await supabaseStore.deleteResume(req.params.id);
  res.json({ message: 'Resume deleted' });
});

// Resume moderation routes (admin)
app.get('/api/admin/resumes', requireAuth, requireRoles('admin'), adminLimiter, (req: RequestWithAuth, res) => {
  const { search, parseStatus, flaggedOnly, sortBy, order } = req.query;
  const pagination = getPagination(req.query as any, { page: 1, limit: 20, maxLimit: 100 });
  const direction = String(order || 'desc').toLowerCase() === 'asc' ? 1 : -1;
  const sortKey = String(sortBy || 'updatedAt').toLowerCase();

  let resumes = db.resumes.map((entry: any) => buildResumeMonitoringRecord(entry));
  if (search) {
    const searchText = String(search).toLowerCase();
    resumes = resumes.filter((entry: any) => {
      const haystack = [
        entry.fileName,
        entry.student?.name,
        entry.student?.email,
        ...(entry.skills || []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(searchText);
    });
  }

  if (parseStatus && ['success', 'failed'].includes(String(parseStatus))) {
    resumes = resumes.filter((entry: any) => entry.parseStatus === String(parseStatus));
  }

  if (String(flaggedOnly || '').toLowerCase() === 'true') {
    resumes = resumes.filter((entry: any) => entry.moderationStatus === 'flagged' || entry.flags.length > 0);
  }

  resumes.sort((left: any, right: any) => {
    if (sortKey === 'score') return (Number(left.resumeScore || 0) - Number(right.resumeScore || 0)) * direction;
    if (sortKey === 'student') {
      return String(left.student?.name || '').localeCompare(String(right.student?.name || '')) * direction;
    }
    if (sortKey === 'createdat') {
      return (new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime()) * direction;
    }
    return (new Date(left.updatedAt || 0).getTime() - new Date(right.updatedAt || 0).getTime()) * direction;
  });

  const summary = {
    total: resumes.length,
    success: resumes.filter((entry: any) => entry.parseStatus === 'success').length,
    failed: resumes.filter((entry: any) => entry.parseStatus === 'failed').length,
    flagged: resumes.filter((entry: any) => entry.moderationStatus === 'flagged').length,
  };
  const paginated = paginateData(resumes, pagination.page, pagination.limit);
  res.json({ data: paginated.data, meta: paginated.meta, summary });
});

app.get('/api/admin/resumes/:id', requireAuth, requireRoles('admin'), adminLimiter, (req, res) => {
  const resume = db.resumes.find((entry: any) => entry.id === req.params.id);
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  return res.json({ data: buildResumeMonitoringRecord(resume) });
});

app.put('/api/admin/resumes/:id/moderation', requireAuth, requireRoles('admin'), adminLimiter, async (req: RequestWithAuth, res) => {
  const profile = req.profile;
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });

  const idx = db.resumes.findIndex((entry: any) => entry.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Resume not found' });

  const status = String(req.body?.status || '').trim().toLowerCase();
  if (!['clean', 'flagged', 'review'].includes(status)) {
    return res.status(400).json({ message: 'status must be one of clean, flagged, or review' });
  }

  db.resumes[idx] = {
    ...db.resumes[idx],
    moderationStatus: status,
    moderationNotes: typeof req.body?.notes === 'string' ? req.body.notes.trim() : '',
    moderationUpdatedBy: profile.id,
    moderationUpdatedAt: new Date(),
    updatedAt: new Date(),
  };
  await supabaseStore.upsertResume(db.resumes[idx]);
  await appendAdminLog(profile, 'resume_moderated', 'resume', db.resumes[idx].id, {
    status,
    notes: db.resumes[idx].moderationNotes,
  });

  return res.json({ data: buildResumeMonitoringRecord(db.resumes[idx]) });
});

app.delete('/api/admin/resumes/:id', requireAuth, requireRoles('admin'), adminLimiter, async (req: RequestWithAuth, res) => {
  const profile = req.profile;
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });

  const idx = db.resumes.findIndex((entry: any) => entry.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Resume not found' });

  const removed = db.resumes[idx];
  db.resumes.splice(idx, 1);
  await supabaseStore.deleteResume(removed.id);

  const candidateIdx = db.candidates.findIndex((entry: any) => entry.userId === removed.userId);
  if (candidateIdx >= 0) {
    db.candidates[candidateIdx] = {
      ...db.candidates[candidateIdx],
      skills: JSON.stringify([]),
      parsedData: null,
      updatedAt: new Date(),
    };
    await supabaseStore.upsertCandidate(db.candidates[candidateIdx]);
  }

  await appendAdminLog(profile, 'resume_deleted', 'resume', removed.id, {
    userId: removed.userId,
    fileName: removed.fileName,
  });
  return res.json({ message: 'Resume deleted' });
});

// Jobs Routes
// Job and application routes used by students and recruiters.
app.get('/api/jobs', (req, res) => {
  const { search, jobType, location, status, limit, my, recruiterId, page } = req.query;
  let jobs = [...db.jobs];
  const profile = getProfileFromAuth(req);

  if (search) {
    const s = (search as string).toLowerCase();
    jobs = jobs.filter((j: any) => j.title.toLowerCase().includes(s) || j.company.toLowerCase().includes(s) || j.description.toLowerCase().includes(s));
  }
  if (jobType) jobs = jobs.filter((j: any) => j.jobType === jobType);
  if (location) jobs = jobs.filter((j: any) => j.location.toLowerCase().includes((location as string).toLowerCase()));
  if (status && status !== 'all') jobs = jobs.filter((j: any) => j.status === status);
  else if (!status) jobs = jobs.filter((j: any) => j.status === 'active');

  if (my === 'true') {
    if (profile && roleMatches(profile.role, 'recruiter')) {
      jobs = jobs.filter((j: any) => j.employerId === profile.id);
    }
  }

  if (recruiterId && profile && roleMatches(profile.role, 'admin')) {
    jobs = jobs.filter((j: any) => j.employerId === String(recruiterId));
  }

  jobs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const hasPage = page !== undefined && page !== null && String(page).trim() !== '';
  if (hasPage) {
    const pagination = getPagination(req.query as any, { page: 1, limit: 20, maxLimit: 100 });
    const paginated = paginateData(jobs, pagination.page, pagination.limit);
    return res.json({
      data: { jobs: paginated.data },
      meta: paginated.meta,
    });
  }

  if (limit) {
    const n = toPositiveInt(limit, jobs.length, 1000);
    jobs = jobs.slice(0, n);
  }

  res.json({
    data: { jobs },
    meta: {
      page: 1,
      limit: jobs.length,
      total: jobs.length,
      totalPages: jobs.length > 0 ? 1 : 0,
    },
  });
});

app.get('/api/jobs/:id', (req, res) => {
  const job = db.jobs.find((j: any) => j.id === req.params.id);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.json({ data: job });
});

app.post('/api/jobs', async (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (!profile || !(roleMatches(profile.role, 'recruiter') || roleMatches(profile.role, 'admin'))) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const title = String(req.body?.title || '').trim();
  const company = String(req.body?.company || '').trim();
  const description = String(req.body?.description || '').trim();
  const experienceLevel = String(req.body?.experienceLevel || 'mid').trim().toLowerCase();

  const requirements = Array.isArray(req.body.requirements)
    ? normalizeSkillList(req.body.requirements)
    : String(req.body.requirements || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  const skills = normalizeSkillList(
    Array.isArray(req.body.skills) && req.body.skills.length > 0 ? req.body.skills : requirements
  );
  if (!title || !company || !description || skills.length === 0) {
    return res.status(400).json({
      message: 'title, company, description, and required skills are required',
    });
  }

  const safeJobType = ['full_time', 'part_time', 'internship', 'contract'].includes(req.body.jobType)
    ? req.body.jobType
    : 'full_time';
  const safeStatus = ['active', 'closed'].includes(req.body.status) ? req.body.status : 'active';
  const safeExperienceLevel = ['entry', 'junior', 'mid', 'senior', 'lead'].includes(experienceLevel)
    ? experienceLevel
    : 'mid';

  const job = {
    ...req.body,
    title,
    company,
    description,
    id: uuidv4(),
    employerId: profile.id,
    requirements,
    skills,
    experienceLevel: safeExperienceLevel,
    jobType: safeJobType,
    status: safeStatus,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  db.jobs.push(job);
  await supabaseStore.upsertJob(job);
  if (roleMatches(profile.role, 'admin')) {
    await appendAdminLog(profile, 'job_created', 'job', job.id, {
      title: job.title,
      recruiterId: job.employerId,
    });
  }
  res.status(201).json({ data: job });
});

app.put('/api/jobs/:id', async (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });

  const idx = db.jobs.findIndex((j: any) => j.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Job not found' });

  const current = db.jobs[idx];
  if (!roleMatches(profile.role, 'admin') && current.employerId !== profile.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const title =
    req.body?.title !== undefined ? String(req.body.title).trim() : String(current.title || '').trim();
  const company =
    req.body?.company !== undefined ? String(req.body.company).trim() : String(current.company || '').trim();
  const description =
    req.body?.description !== undefined
      ? String(req.body.description).trim()
      : String(current.description || '').trim();
  const location =
    req.body?.location !== undefined ? String(req.body.location).trim() : String(current.location || '');
  const requestedRequirements =
    req.body?.requirements !== undefined ? req.body.requirements : current.requirements;
  const requirements = normalizeSkillList(requestedRequirements);
  const requestedSkills = req.body?.skills !== undefined ? req.body.skills : current.skills;
  const skills = normalizeSkillList(Array.isArray(requestedSkills) ? requestedSkills : requirements);

  if (!title || !company || !description || skills.length === 0) {
    return res.status(400).json({
      message: 'title, company, description, and required skills are required',
    });
  }

  const requestedExperienceLevel =
    req.body?.experienceLevel !== undefined
      ? String(req.body.experienceLevel).trim().toLowerCase()
      : String(current.experienceLevel || 'mid').trim().toLowerCase();
  const safeExperienceLevel = ['entry', 'junior', 'mid', 'senior', 'lead'].includes(requestedExperienceLevel)
    ? requestedExperienceLevel
    : 'mid';
  const requestedJobType = req.body?.jobType !== undefined ? String(req.body.jobType) : current.jobType;
  const safeJobType = ['full_time', 'part_time', 'internship', 'contract'].includes(requestedJobType)
    ? requestedJobType
    : 'full_time';
  const requestedStatus = req.body?.status !== undefined ? String(req.body.status) : current.status;
  const safeStatus = ['active', 'closed'].includes(requestedStatus) ? requestedStatus : 'active';
  const salaryMin =
    req.body?.salaryMin !== undefined && req.body?.salaryMin !== null && req.body?.salaryMin !== ''
      ? Number(req.body.salaryMin)
      : current.salaryMin ?? null;
  const salaryMax =
    req.body?.salaryMax !== undefined && req.body?.salaryMax !== null && req.body?.salaryMax !== ''
      ? Number(req.body.salaryMax)
      : current.salaryMax ?? null;

  db.jobs[idx] = {
    ...current,
    title,
    company,
    description,
    location,
    requirements,
    skills,
    experienceLevel: safeExperienceLevel,
    jobType: safeJobType,
    status: safeStatus,
    salaryMin: Number.isFinite(salaryMin) ? salaryMin : null,
    salaryMax: Number.isFinite(salaryMax) ? salaryMax : null,
    employerId: current.employerId,
    updatedAt: new Date(),
  };
  await supabaseStore.upsertJob(db.jobs[idx]);
  if (roleMatches(profile.role, 'admin')) {
    await appendAdminLog(profile, 'job_updated', 'job', db.jobs[idx].id, {
      title: db.jobs[idx].title,
      status: db.jobs[idx].status,
    });
  }
  res.json({ data: db.jobs[idx] });
});

app.delete('/api/jobs/:id', async (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });

  const idx = db.jobs.findIndex((j: any) => j.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Job not found' });

  if (!roleMatches(profile.role, 'admin') && db.jobs[idx].employerId !== profile.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const removedJob = db.jobs[idx];
  const removedApplications = db.applications.filter((entry: any) => entry.jobId === req.params.id).length;
  db.jobs.splice(idx, 1);
  db.applications = db.applications.filter((entry: any) => entry.jobId !== req.params.id);
  await supabaseStore.deleteJob(req.params.id);
  await supabaseStore.deleteApplicationsByJob(req.params.id);
  if (roleMatches(profile.role, 'admin')) {
    await appendAdminLog(profile, 'job_deleted', 'job', req.params.id, {
      title: removedJob?.title || '',
      removedApplications,
    });
  }
  res.json({ message: 'Job deleted' });
});

// Candidates Routes
app.get('/api/candidates', (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (!(roleMatches(profile.role, 'recruiter') || roleMatches(profile.role, 'admin'))) return res.status(403).json({ message: 'Not authorized' });

  const candidates = db.candidates.map((candidate: any) => ({
    ...candidate,
    skills: JSON.parse(candidate.skills || '[]'),
    education: JSON.parse(candidate.education || '[]'),
    experience: JSON.parse(candidate.experience || '[]'),
  }));

  res.json({ data: candidates });
});

app.get('/api/candidates/:id', async (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (!(roleMatches(profile.role, 'recruiter') || roleMatches(profile.role, 'admin'))) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const candidate = db.candidates.find(
    (c: any) => c.id === req.params.id || c.userId === req.params.id
  );
  if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
  const selectedJobId = String(req.query?.jobId || '').trim();
  const selectedJob = selectedJobId ? db.jobs.find((entry: any) => entry.id === selectedJobId) : null;

  if (roleMatches(profile.role, 'recruiter')) {
    const myJobIds = db.jobs
      .filter((entry: any) => entry.employerId === profile.id)
      .map((entry: any) => entry.id);
    if (selectedJob && !myJobIds.includes(selectedJob.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const hasCandidateRelationship = db.applications.some(
      (entry: any) => entry.candidateId === candidate.userId && myJobIds.includes(entry.jobId)
    );
    if (!selectedJob && !hasCandidateRelationship) {
      return res.status(403).json({ message: 'Not authorized' });
    }
  }

  const latestResumeScore = getLatestResumeScore(candidate.userId);
  const resume = db.resumes.find((entry: any) => entry.userId === candidate.userId) || null;
  const parsedSkills = normalizeSkillList(candidate.skills);
  const parsedEducation = (() => {
    try {
      const parsed = JSON.parse(candidate.education || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();
  const parsedExperience = (() => {
    try {
      const parsed = JSON.parse(candidate.experience || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();
  const parsedProjects = Array.isArray(resume?.parsedData?.projects)
    ? resume?.parsedData?.projects
    : [];

  let matchBreakdown = null as any;
  if (selectedJob) {
    const match = await getMatchInsights(parsedSkills, selectedJob);
    const explanationMeta = buildRecommendationExplanation(
      parsedSkills,
      toSkillList(selectedJob.skills?.length ? selectedJob.skills : selectedJob.requirements)
    );
    const improvementSuggestions = (explanationMeta.improvementImpacts || []).map((entry) => {
      return `Learning ${entry.skill} can increase fit by about ${toHumanReadableImpact(entry.impact)}%.`;
    });
    matchBreakdown = {
      jobId: selectedJob.id,
      title: selectedJob.title,
      matchScore: match.matchScore,
      matchedSkills: match.matchedSkills,
      missingSkills: match.missingSkills,
      explanation: match.explanation,
      improvementSuggestions,
    };
  }

  res.json({
    data: {
      ...candidate,
      skills: parsedSkills,
      education: parsedEducation,
      experience: parsedExperience,
      projects: parsedProjects,
      parsedData: resume?.parsedData || candidate?.parsedData || null,
      latestResumeScore,
      matchBreakdown,
      resume,
    },
  });
});

app.post('/api/candidates', requireAuth, requireRoles('recruiter', 'admin'), async (req, res) => {
  const candidate = { ...req.body, id: uuidv4(), status: 'new', matchScore: 0, createdAt: new Date() };
  db.candidates.push(candidate);
  await supabaseStore.upsertCandidate(candidate);
  res.status(201).json({ data: candidate });
});

app.put('/api/candidates/:id', requireAuth, requireRoles('recruiter', 'admin'), async (req, res) => {
  const idx = db.candidates.findIndex((c: any) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Candidate not found' });
  db.candidates[idx] = { ...db.candidates[idx], ...req.body, updatedAt: new Date() };
  await supabaseStore.upsertCandidate(db.candidates[idx]);
  res.json({ data: db.candidates[idx] });
});

// Applications Routes
app.get('/api/applications', (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (!(roleMatches(profile.role, 'recruiter') || roleMatches(profile.role, 'admin'))) return res.status(403).json({ message: 'Not authorized' });

  const { status, jobId, studentId } = req.query;
  const pagination = getPagination(req.query as any, { page: 1, limit: 25, maxLimit: 100 });
  let applications = [...db.applications];

  if (roleMatches(profile.role, 'recruiter')) {
    const myJobIds = db.jobs.filter((job: any) => job.employerId === profile.id).map((job: any) => job.id);
    applications = applications.filter((entry: any) => myJobIds.includes(entry.jobId));
  }

  if (status) {
    applications = applications.filter((entry: any) => entry.status === status);
  }
  if (jobId) {
    applications = applications.filter((entry: any) => entry.jobId === String(jobId));
  }
  if (studentId && roleMatches(profile.role, 'admin')) {
    applications = applications.filter((entry: any) => entry.candidateId === String(studentId));
  }

  applications.sort((a: any, b: any) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  const detailed = withApplicationDetails(applications);
  const paginated = paginateData(detailed, pagination.page, pagination.limit);
  res.json({ data: paginated.data, meta: paginated.meta });
});

app.get('/api/applications/my', (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });

  const myApps = db.applications
    .filter((a: any) => a.candidateId === profile.id)
    .sort((a: any, b: any) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

  res.json({ data: withApplicationDetails(myApps) });
});

app.post('/api/applications', async (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (profile.role !== 'student') return res.status(403).json({ message: 'Not authorized' });

  const { jobId, notes } = req.body;
  if (!jobId) return res.status(400).json({ message: 'jobId is required' });

  const existing = db.applications.find((a: any) => a.jobId === jobId && a.candidateId === profile.id);
  if (existing) return res.status(400).json({ message: 'Already applied' });

  const job = db.jobs.find((j: any) => j.id === jobId);
  if (!job || job.status !== 'active') return res.status(404).json({ message: 'Job not found or inactive' });

  const candidate = db.candidates.find((c: any) => c.userId === profile.id);

  let matchScore = 0;
  let matchedSkills: string[] = [];
  let missingSkills: string[] = [];
  let explanation: string | null = null;
  if (job && candidate) {
    const candidateSkills = toSkillList(candidate.skills);
    const insights = await getMatchInsights(candidateSkills, job);
    matchScore = insights.matchScore;
    matchedSkills = insights.matchedSkills;
    missingSkills = insights.missingSkills;
    explanation = insights.explanation;
  }

  const application = {
    id: uuidv4(),
    jobId,
    candidateId: profile.id,
    status: 'pending',
    matchScore,
    matchedSkills,
    missingSkills,
    explanation,
    notes: notes ? String(notes) : '',
    appliedAt: new Date(),
    updatedAt: new Date(),
  };
  db.applications.push(application);
  await supabaseStore.upsertApplication(application);
  res.status(201).json({ data: withApplicationDetails([application])[0] });
});

app.put('/api/applications/:id/status', async (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (!(roleMatches(profile.role, 'recruiter') || roleMatches(profile.role, 'admin'))) return res.status(403).json({ message: 'Not authorized' });

  const idx = db.applications.findIndex((a: any) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Application not found' });

  const { status, notes } = req.body;
  if (!['pending', 'shortlisted', 'interview', 'rejected', 'applied', 'interviewing', 'offer'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const record = db.applications[idx];
  const job = db.jobs.find((entry: any) => entry.id === record.jobId);
  if (roleMatches(profile.role, 'recruiter') && (!job || job.employerId !== profile.id)) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  db.applications[idx] = {
    ...record,
    status: toStorageApplicationStatus(status),
    notes: typeof notes === 'string' ? notes : record.notes || '',
    updatedAt: new Date(),
  };
  await supabaseStore.upsertApplication(db.applications[idx]);
  if (roleMatches(profile.role, 'admin')) {
    await appendAdminLog(profile, 'application_status_updated', 'application', db.applications[idx].id, {
      from: record.status,
      to: db.applications[idx].status,
    });
  }
  res.json({ data: withApplicationDetails([db.applications[idx]])[0] });
});

// Recommendation Routes
app.get('/api/recommendations', async (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (profile.role !== 'student') return res.status(403).json({ message: 'Not authorized' });
  const requestedLimit = Number(req.query.limit || 3);
  const recommendationLimit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(10, Math.floor(requestedLimit)))
    : 3;

  pruneStudentRecommendationCache();
  const candidate = db.candidates.find((entry: any) => entry.userId === profile.id);
  const resume = db.resumes.find((entry: any) => entry.userId === profile.id);
  const recommendationCacheKey = [
    profile.id,
    recommendationLimit,
    new Date(resume?.updatedAt || resume?.createdAt || 0).getTime(),
    new Date(candidate?.updatedAt || candidate?.createdAt || 0).getTime(),
    db.jobs.length,
    getCollectionVersion(db.jobs),
    db.courses.length,
    getCollectionVersion(db.courses),
  ].join(':');
  const cachedRecommendations = studentRecommendationCache.get(recommendationCacheKey);
  if (cachedRecommendations && cachedRecommendations.expiresAt > Date.now()) {
    return res.json({ data: cachedRecommendations.data });
  }
  const resumeSkills = Array.from(
    new Set([
      ...toSkillList(candidate?.skills),
      ...toSkillList(resume?.skills),
      ...toSkillList(resume?.parsedData?.skills),
    ])
  );

  if (resumeSkills.length === 0) {
    const emptyPayload = {
      generatedAt: new Date(),
      recommendedJobs: [],
      missingSkills: [],
      recommendedCourses: [],
    };
    studentRecommendationCache.set(recommendationCacheKey, {
      expiresAt: Date.now() + STUDENT_RECOMMENDATIONS_CACHE_TTL_MS,
      data: emptyPayload,
    });
    return res.json({ data: emptyPayload });
  }

  const activeJobs = db.jobs.filter((job: any) => job.status === 'active');
  const scoredJobs = await Promise.all(
    activeJobs.map(async (job: any) => {
      const insights = await getMatchInsights(resumeSkills, job);
      const requiredSkills = toSkillList(job.skills?.length ? job.skills : job.requirements);
      const explanation = buildRecommendationExplanation(resumeSkills, requiredSkills);
      return {
        job,
        matchScore: insights.matchScore,
        requiredSkills,
        matchedSkills: insights.matchedSkills,
        missingSkills: insights.missingSkills,
        explanation: insights.explanation || explanation.summary,
        shortSummary: (insights.explanation || explanation.summary || '').slice(0, 180),
        explanationMeta: {
          summary: explanation.summary,
          matchedCount: explanation.matchedCount,
          totalRequired: explanation.totalRequired,
          improvementImpacts: explanation.improvementImpacts.map((entry) => ({
            ...entry,
            impact: toHumanReadableImpact(entry.impact),
          })),
        },
      };
    })
  );

  const recommendedJobs = scoredJobs
    .sort((left, right) => right.matchScore - left.matchScore)
    .slice(0, recommendationLimit);

  const missingSkills = Array.from(
    new Set(
      recommendedJobs
        .slice(0, 5)
        .flatMap((entry) => entry.missingSkills)
        .map((entry) => entry.toLowerCase())
    )
  );

  const recommendedCourses = db.courses
    .map((course: any) => {
      const courseSkills = toSkillList(course.skills).map((entry) => entry.toLowerCase());
      const matchedMissing = missingSkills.filter((skill) => courseSkills.includes(skill));
      return {
        ...course,
        matchedMissingSkills: matchedMissing,
        relevanceScore: matchedMissing.length,
      };
    })
    .filter((course: any) => course.relevanceScore > 0)
    .sort((left: any, right: any) => right.relevanceScore - left.relevanceScore || (right.rating || 0) - (left.rating || 0))
    .slice(0, 6);

  db.recommendations = db.recommendations.filter((entry: any) => entry.userId !== profile.id);
  await supabaseStore.deleteRecommendationsByUser(profile.id);
  const now = new Date();
  for (const recommendation of recommendedJobs) {
    const recommendationRecord = {
      id: uuidv4(),
      userId: profile.id,
      jobId: recommendation.job.id,
      matchScore: recommendation.matchScore,
      matchedSkills: recommendation.matchedSkills,
      missingSkills: recommendation.missingSkills,
      explanation: recommendation.explanation,
      explanationMeta: recommendation.explanationMeta,
      createdAt: now,
    };
    db.recommendations.push(recommendationRecord);
    await supabaseStore.upsertRecommendation(recommendationRecord);
  }

  const responsePayload = {
    generatedAt: now,
    recommendedJobs,
    missingSkills,
    recommendedCourses,
    summary: recommendedJobs.length
      ? `You are matching ${recommendedJobs[0].explanationMeta?.matchedCount || 0} out of ${
          recommendedJobs[0].explanationMeta?.totalRequired || 0
        } key skills for your top role.`
      : 'Upload your resume to start receiving recommendations.',
  };
  studentRecommendationCache.set(recommendationCacheKey, {
    expiresAt: Date.now() + STUDENT_RECOMMENDATIONS_CACHE_TTL_MS,
    data: responsePayload,
  });

  res.json({ data: responsePayload });
});

// Career Growth Routes (student-focused)
app.get('/api/career/roles', (_req, res) => {
  res.json({ data: getRoleExplorerData() });
});

app.post('/api/career/target-role', (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (profile.role !== 'student') return res.status(403).json({ message: 'Not authorized' });

  const requestedRoleId = String(req.body?.roleId || '');
  const safeRoleId = setCareerPreference(profile.id, requestedRoleId);
  res.json({ data: { roleId: safeRoleId } });
});

// Student career routes: overview, roadmap, AI coach, learning plan, and progress tools.
app.get('/api/career/overview', async (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (profile.role !== 'student') return res.status(403).json({ message: 'Not authorized' });

  const roleId = getCareerPreference(profile.id);
  const role = CAREER_ROLES.find((entry) => entry.id === roleId) || CAREER_ROLES[0];
  await ensureResumeScoreHistory(profile.id);

  const history = db.resumeScores
    .filter((entry: any) => entry.userId === profile.id)
    .sort((left: any, right: any) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())
    .slice(-12);
  const latestScore = history[history.length - 1] || null;

  const roadmap = getStudentRoadmap(profile.id, roleId);
  const completedSkills = roadmap.filter((entry) => entry.status === 'completed').length;
  const inProgressSkills = roadmap.filter((entry) => entry.status === 'in_progress').length;

  const myApplications = db.applications
    .filter((entry: any) => entry.candidateId === profile.id)
    .sort((left: any, right: any) => new Date(left.appliedAt).getTime() - new Date(right.appliedAt).getTime());
  const mySavedJobs = db.savedJobs.filter((entry: any) => entry.userId === profile.id);
  const applicationStatusCounts = myApplications.reduce(
    (acc: any, entry: any) => {
      const trackerStatus = toTrackerApplicationStatus(entry.status);
      acc[trackerStatus] += 1;
      return acc;
    },
    { saved: mySavedJobs.length, applied: 0, interviewing: 0, offer: 0, rejected: 0 }
  );
  const appProgress =
    myApplications.length >= 2
      ? Math.max(0, Math.round((myApplications[myApplications.length - 1].matchScore || 0) - (myApplications[0].matchScore || 0)))
      : 0;

  const weeklyPlanner = generateWeeklyPlanner(roadmap);
  const missingSkills = roadmap
    .filter((entry) => entry.status !== 'completed')
    .map((entry) => entry.skill)
    .slice(0, 3);

  res.json({
    data: {
      roleId,
      role,
      latestScore,
      scoreHistory: history,
      roadmap,
      weeklyPlanner,
      progress: {
        resumeImprovement: deriveProgressDelta(
          history.map((entry: any) => ({
            score: Number(entry.score || 0),
            createdAt: new Date(entry.createdAt),
          }))
        ),
        skillsCompleted: completedSkills,
        skillsInProgress: inProgressSkills,
        totalSkills: roadmap.length,
        jobsMatchedImprovement: appProgress,
      },
      applicationStatusCounts,
      missingSkills,
    },
  });
});

app.get('/api/career/roadmap', (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (profile.role !== 'student') return res.status(403).json({ message: 'Not authorized' });

  const roleId = String(req.query.roleId || getCareerPreference(profile.id));
  const roadmap = getStudentRoadmap(profile.id, roleId);
  const role = CAREER_ROLES.find((entry) => entry.id === roleId) || CAREER_ROLES[0];
  res.json({ data: { role, roadmap } });
});

app.post('/api/career/ai-coach', async (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (profile.role !== 'student') return res.status(403).json({ message: 'Not authorized' });

  const feature = String(req.body?.feature || 'skill_gap')
    .trim()
    .toLowerCase();
  const supported = new Set([
    'skill_gap',
    'resume_improvement',
    'interview_prep',
    'project_ideas',
    'study_plan',
  ]);
  const safeFeature = supported.has(feature) ? feature : 'skill_gap';
  const prompt = String(req.body?.prompt || '').trim().slice(0, 1200);

  const roleId = getCareerPreference(profile.id);
  const role = CAREER_ROLES.find((entry) => entry.id === roleId) || CAREER_ROLES[0];
  const resume = db.resumes.find((entry: any) => entry.userId === profile.id) || null;
  const latestScore = await ensureResumeScoreHistory(profile.id);
  const roadmap = getStudentRoadmap(profile.id, roleId);
  const roadmapHighlights = roadmap
    .map((entry) => `${entry.skill} (${entry.status.replace('_', ' ')})`)
    .slice(0, 8);
  const missingSkills = roadmap
    .filter((entry) => entry.status !== 'completed')
    .map((entry) => entry.skill)
    .slice(0, 8);
  const skills = normalizeSkillList([
    ...toSkillList(resume?.skills || []),
    ...toSkillList(resume?.parsedData?.skills || []),
  ]).slice(0, 30);
  const resumeSummary = String(resume?.parsedData?.summary || '').trim();
  const studentApplications = db.applications.filter((entry: any) => entry.candidateId === profile.id);
  const studentSavedJobs = db.savedJobs.filter((entry: any) => entry.userId === profile.id);
  const applicationStatusCounts = studentApplications.reduce(
    (acc: Record<string, number>, entry: any) => {
      const trackerStatus = toTrackerApplicationStatus(entry.status);
      acc[trackerStatus] = (acc[trackerStatus] || 0) + 1;
      return acc;
    },
    {
      saved: studentSavedJobs.length,
      applied: 0,
      interviewing: 0,
      offer: 0,
      rejected: 0,
    }
  );
  const topRecommendedJobs = db.recommendations
    .filter((entry: any) => entry.userId === profile.id)
    .sort((left: any, right: any) => Number(right.matchScore || 0) - Number(left.matchScore || 0))
    .slice(0, 3)
    .map((entry: any) => {
      const job = db.jobs.find((jobItem: any) => jobItem.id === entry.jobId);
      return {
        title: job?.title || 'Recommended role',
        company: job?.company || 'Unknown company',
        matchScore: Math.round(Number(entry.matchScore || 0)),
      };
    });
  const topResources = generateLearningPlan(roleId, roadmap, 30)
    .weeks.flatMap((week) => week.resources || [])
    .slice(0, 3)
    .map((resource) => ({
      title: resource.title,
      provider: resource.provider,
      url: resource.url,
    }));

  const aiPayload = {
    feature: safeFeature,
    prompt,
    context: {
      targetRole: role.name,
      skills,
      missingSkills,
      resumeSummary,
      readinessScore: latestScore?.score || 0,
      roadmapHighlights,
      scoreSections: latestScore?.sectionScores || {},
      applicationStatusCounts,
      topRecommendedJobs,
      topResources,
    },
  };
  const response = await callStudentAICoach(aiPayload);
  res.json({ data: response });
});

app.put('/api/career/roadmap/skill', async (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (profile.role !== 'student') return res.status(403).json({ message: 'Not authorized' });

  const roleId = String(req.body?.roleId || getCareerPreference(profile.id));
  const skillName = String(req.body?.skillName || '').trim();
  const status = String(req.body?.status || 'missing') as SkillStatus;
  if (!skillName) return res.status(400).json({ message: 'skillName is required' });
  if (!['completed', 'in_progress', 'missing'].includes(status)) {
    return res.status(400).json({ message: 'Invalid skill status' });
  }

  const idx = db.skillProgress.findIndex(
    (entry: any) =>
      entry.userId === profile.id &&
      entry.roleId === roleId &&
      String(entry.skillName).toLowerCase() === skillName.toLowerCase()
  );
  const record = {
    id: idx >= 0 ? db.skillProgress[idx].id : uuidv4(),
    userId: profile.id,
    roleId,
    skillName,
    status,
    updatedAt: new Date(),
    createdAt: idx >= 0 ? db.skillProgress[idx].createdAt : new Date(),
  };
  if (idx >= 0) db.skillProgress[idx] = record;
  else db.skillProgress.push(record);
  await supabaseStore.upsertSkillProgress(record);

  const roadmap = getStudentRoadmap(profile.id, roleId);
  res.json({ data: { roadmap } });
});

app.get('/api/career/learning-plan', async (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (profile.role !== 'student') return res.status(403).json({ message: 'Not authorized' });

  const roleId = String(req.query.roleId || getCareerPreference(profile.id));
  const durationDays = Number(req.query.durationDays) === 60 ? 60 : 30;
  const existing = db.learningPlans
    .filter(
      (entry: any) =>
        entry.userId === profile.id && entry.roleId === roleId && Number(entry.durationDays) === durationDays
    )
    .sort((left: any, right: any) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())[0];

  if (existing) {
    return res.json({ data: existing });
  }

  const roadmap = getStudentRoadmap(profile.id, roleId);
  const planData = generateLearningPlan(roleId, roadmap, durationDays as 30 | 60);
  const record = {
    id: uuidv4(),
    userId: profile.id,
    roleId,
    durationDays,
    planData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  db.learningPlans.push(record);
  await supabaseStore.upsertLearningPlan(record);
  return res.json({ data: record });
});

app.post('/api/career/learning-plan', async (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (profile.role !== 'student') return res.status(403).json({ message: 'Not authorized' });

  const roleId = String(req.body?.roleId || getCareerPreference(profile.id));
  const durationDays = Number(req.body?.durationDays) === 60 ? 60 : 30;
  const roadmap = getStudentRoadmap(profile.id, roleId);
  const planData = generateLearningPlan(roleId, roadmap, durationDays as 30 | 60);
  const idx = db.learningPlans.findIndex(
    (entry: any) =>
      entry.userId === profile.id && entry.roleId === roleId && Number(entry.durationDays) === durationDays
  );
  const record = {
    id: idx >= 0 ? db.learningPlans[idx].id : uuidv4(),
    userId: profile.id,
    roleId,
    durationDays,
    planData,
    createdAt: idx >= 0 ? db.learningPlans[idx].createdAt : new Date(),
    updatedAt: new Date(),
  };
  if (idx >= 0) db.learningPlans[idx] = record;
  else db.learningPlans.push(record);
  await supabaseStore.upsertLearningPlan(record);
  res.json({ data: record });
});

app.get('/api/career/mock-interview', (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (profile.role !== 'student') return res.status(403).json({ message: 'Not authorized' });

  const roleId = String(req.query.roleId || getCareerPreference(profile.id));
  const pack = generateMockInterview(roleId);
  res.json({ data: pack });
});

app.post('/api/career/mock-interview/session', async (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (profile.role !== 'student') return res.status(403).json({ message: 'Not authorized' });

  const roleId = String(req.body?.roleId || getCareerPreference(profile.id));
  const question = String(req.body?.question || '').trim();
  const answer = String(req.body?.answer || '').trim();
  const rating = Number(req.body?.rating || 0);
  if (!question || !answer) {
    return res.status(400).json({ message: 'question and answer are required' });
  }

  const session = {
    id: uuidv4(),
    userId: profile.id,
    roleId,
    question,
    answer,
    rating: Number.isFinite(rating) ? rating : 0,
    createdAt: new Date(),
  };
  db.mockInterviewSessions.push(session);
  await supabaseStore.upsertMockInterviewSession(session);

  res.status(201).json({ data: session });
});

app.get('/api/career/mock-interview/sessions', (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (profile.role !== 'student') return res.status(403).json({ message: 'Not authorized' });

  const sessions = db.mockInterviewSessions
    .filter((entry: any) => entry.userId === profile.id)
    .sort((left: any, right: any) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 30);
  res.json({ data: sessions });
});

app.get('/api/career/job-tracker', (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (profile.role !== 'student') return res.status(403).json({ message: 'Not authorized' });

  const saved = db.savedJobs
    .filter((entry: any) => entry.userId === profile.id)
    .map((entry: any) => ({
      ...entry,
      job: db.jobs.find((job: any) => job.id === entry.jobId) || null,
    }))
    .filter((entry: any) => entry.job !== null);
  const applications = withApplicationDetails(
    db.applications.filter((entry: any) => entry.candidateId === profile.id)
  );
  const statusCounts = applications.reduce(
    (acc: any, entry: any) => {
      acc[entry.trackerStatus] = (acc[entry.trackerStatus] || 0) + 1;
      return acc;
    },
    { saved: saved.length, applied: 0, interviewing: 0, offer: 0, rejected: 0 }
  );
  res.json({
    data: {
      savedJobs: saved.sort(
        (left: any, right: any) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      ),
      applications: applications.sort(
        (left: any, right: any) =>
          new Date(right.appliedAt || right.createdAt || Date.now()).getTime() -
          new Date(left.appliedAt || left.createdAt || Date.now()).getTime()
      ),
      statusCounts,
    },
  });
});

app.post('/api/career/job-tracker/save', async (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (profile.role !== 'student') return res.status(403).json({ message: 'Not authorized' });

  const jobId = String(req.body?.jobId || '');
  if (!jobId) return res.status(400).json({ message: 'jobId is required' });
  const job = db.jobs.find((entry: any) => entry.id === jobId && entry.status === 'active');
  if (!job) return res.status(404).json({ message: 'Job not found' });

  const exists = db.savedJobs.find((entry: any) => entry.userId === profile.id && entry.jobId === jobId);
  if (exists) return res.json({ data: exists });

  const record = {
    id: uuidv4(),
    userId: profile.id,
    jobId,
    createdAt: new Date(),
  };
  db.savedJobs.push(record);
  await supabaseStore.upsertSavedJob(record);
  res.status(201).json({ data: record });
});

app.delete('/api/career/job-tracker/save/:jobId', async (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (profile.role !== 'student') return res.status(403).json({ message: 'Not authorized' });

  const idx = db.savedJobs.findIndex(
    (entry: any) => entry.userId === profile.id && entry.jobId === req.params.jobId
  );
  if (idx === -1) return res.status(404).json({ message: 'Saved job not found' });
  const record = db.savedJobs[idx];
  db.savedJobs.splice(idx, 1);
  await supabaseStore.deleteSavedJob(record.id);
  res.json({ message: 'Saved job removed' });
});

app.put('/api/career/job-tracker/application/:applicationId', async (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (profile.role !== 'student') return res.status(403).json({ message: 'Not authorized' });

  const idx = db.applications.findIndex(
    (entry: any) => entry.id === req.params.applicationId && entry.candidateId === profile.id
  );
  if (idx === -1) return res.status(404).json({ message: 'Application not found' });

  const updates: any = {};
  if (typeof req.body?.notes === 'string') updates.notes = req.body.notes;
  if (typeof req.body?.status === 'string') {
    const normalized = String(req.body.status).trim().toLowerCase();
    if (
      ['pending', 'shortlisted', 'interview', 'rejected', 'applied', 'interviewing', 'offer'].includes(
        normalized
      )
    ) {
      updates.status = toStorageApplicationStatus(normalized);
    }
  }
  db.applications[idx] = {
    ...db.applications[idx],
    ...updates,
    updatedAt: new Date(),
  };
  await supabaseStore.upsertApplication(db.applications[idx]);
  res.json({ data: withApplicationDetails([db.applications[idx]])[0] });
});

app.delete('/api/career/job-tracker/application/:applicationId', async (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (profile.role !== 'student') return res.status(403).json({ message: 'Not authorized' });

  const idx = db.applications.findIndex(
    (entry: any) => entry.id === req.params.applicationId && entry.candidateId === profile.id
  );
  if (idx === -1) return res.status(404).json({ message: 'Application not found' });

  const removed = db.applications[idx];
  db.applications.splice(idx, 1);
  await supabaseStore.deleteApplication(removed.id);
  res.json({ message: 'Application removed from tracker' });
});

app.get('/api/jobs/:id/candidate-matches', async (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (!(roleMatches(profile.role, 'recruiter') || roleMatches(profile.role, 'admin'))) return res.status(403).json({ message: 'Not authorized' });

  const job = db.jobs.find((entry: any) => entry.id === req.params.id);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  if (roleMatches(profile.role, 'recruiter') && job.employerId !== profile.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const sortBy = toSortKey(req.query?.sortBy);
  const order = toSortDirection(req.query?.order);
  const appliedOnly = String(req.query?.appliedOnly || '').toLowerCase() === 'true';
  const requestedLimit = Number(req.query?.limit);
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : 100;

  const { matches, meta } = await getCandidateMatchesForJob(job, {
    sortBy,
    order,
    appliedOnly,
    limit,
  });

  res.json({
    data: matches,
    meta: {
      ...meta,
      sortBy,
      order,
      appliedOnly,
      limit: Math.min(limit, 200),
    },
  });
});

// Recruiter routes: recruiter dashboard, candidate ranking, and hiring analytics.
app.get('/api/recruiter/overview', async (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (!(roleMatches(profile.role, 'recruiter') || roleMatches(profile.role, 'admin'))) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  pruneRecruiterOverviewCache();
  const overviewCacheKey = buildRecruiterOverviewCacheKey(profile);
  const cachedOverview = recruiterOverviewCache.get(overviewCacheKey);
  if (cachedOverview && cachedOverview.expiresAt > Date.now()) {
    return res.json({ data: cachedOverview.data });
  }

  const recruiterJobs = roleMatches(profile.role, 'admin')
    ? [...db.jobs]
    : db.jobs.filter((entry: any) => entry.employerId === profile.id);
  const recentJobs = [...recruiterJobs]
    .sort((left: any, right: any) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 6);
  const allJobIds = recruiterJobs.map((entry: any) => entry.id);
  const applications = db.applications.filter((entry: any) => allJobIds.includes(entry.jobId));
  const appliedCandidates = new Set(applications.map((entry: any) => entry.candidateId));

  const perJobAnalytics = await Promise.all(
    recentJobs.map(async (job: any) => {
      const { matches } = await getCandidateMatchesForJob(job, {
        sortBy: 'match',
        order: 'desc',
        limit: 50,
      });
      return getRecruiterJobAnalytics(job, matches);
    })
  );

  const topCandidateMap = new Map<string, any>();
  for (const job of recentJobs) {
    const { matches } = await getCandidateMatchesForJob(job, {
      sortBy: 'match',
      order: 'desc',
      limit: 5,
      appliedOnly: true,
    });
    for (const candidate of matches) {
      const existing = topCandidateMap.get(candidate.studentId);
      if (!existing || candidate.matchScore > existing.matchScore) {
        topCandidateMap.set(candidate.studentId, {
          ...candidate,
          jobId: job.id,
          jobTitle: job.title,
        });
      }
    }
  }

  const rankedTopCandidates = Array.from(topCandidateMap.values())
    .sort((left, right) => Number(right.matchScore || 0) - Number(left.matchScore || 0))
    .slice(0, 5);

  const missingSkillFrequency = new Map<string, number>();
  for (const job of recentJobs) {
    const { matches } = await getCandidateMatchesForJob(job, {
      sortBy: 'match',
      order: 'desc',
      limit: 50,
      appliedOnly: true,
    });
    for (const match of matches) {
      for (const skill of match.missingSkills || []) {
        const key = String(skill).trim();
        if (!key) continue;
        missingSkillFrequency.set(key, (missingSkillFrequency.get(key) || 0) + 1);
      }
    }
  }

  const skillDemandInsights = Array.from(missingSkillFrequency.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([skill, count]) => ({ skill, count }));

  const averageMatchAcrossJobs =
    perJobAnalytics.length > 0
      ? Math.round(
          perJobAnalytics.reduce((sum: number, entry: any) => sum + Number(entry.averageMatch || 0), 0) /
            perJobAnalytics.length
        )
      : 0;

  const responsePayload = {
    postedJobs: recruiterJobs.length,
    activeJobs: recruiterJobs.filter((entry: any) => entry.status === 'active').length,
    totalApplicants: applications.length,
    uniqueApplicants: appliedCandidates.size,
    averageMatchAcrossJobs,
    perJobAnalytics,
    topCandidates: rankedTopCandidates,
    skillDemandInsights,
  };

  recruiterOverviewCache.set(overviewCacheKey, {
    expiresAt: Date.now() + RECRUITER_OVERVIEW_CACHE_TTL_MS,
    data: responsePayload,
  });

  res.json({ data: responsePayload });
});

app.get('/api/recruiter/jobs/:id/analytics', async (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (!(roleMatches(profile.role, 'recruiter') || roleMatches(profile.role, 'admin'))) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const job = db.jobs.find((entry: any) => entry.id === req.params.id);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  if (roleMatches(profile.role, 'recruiter') && job.employerId !== profile.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const { matches, meta } = await getCandidateMatchesForJob(job, {
    sortBy: 'match',
    order: 'desc',
    limit: 100,
  });
  const analytics = getRecruiterJobAnalytics(job, matches);
  res.json({
    data: {
      ...analytics,
      matches,
    },
    meta,
  });
});

// Courses Routes
app.get('/api/courses', (_req, res) => {
  const courses = [...db.courses].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ data: courses });
});

app.get('/api/courses/:id', (req, res) => {
  const course = db.courses.find((c: any) => c.id === req.params.id);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  res.json({ data: course });
});

app.post('/api/courses', async (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (profile.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

  const { title, description, provider, url } = req.body;
  if (!title || !description || !provider || !url) {
    return res.status(400).json({ message: 'title, description, provider and url are required' });
  }

  const course = { ...req.body, id: uuidv4(), createdAt: new Date(), updatedAt: new Date() };
  db.courses.push(course);
  await supabaseStore.upsertCourse(course);
  res.status(201).json({ data: course });
});

app.put('/api/courses/:id', async (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (profile.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

  const idx = db.courses.findIndex((entry: any) => entry.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Course not found' });

  db.courses[idx] = { ...db.courses[idx], ...req.body, updatedAt: new Date() };
  await supabaseStore.upsertCourse(db.courses[idx]);
  res.json({ data: db.courses[idx] });
});

app.delete('/api/courses/:id', async (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.status(401).json({ message: 'Not authenticated' });
  if (profile.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

  const idx = db.courses.findIndex((entry: any) => entry.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Course not found' });

  db.courses.splice(idx, 1);
  await supabaseStore.deleteCourse(req.params.id);
  res.json({ message: 'Course deleted' });
});

// Dashboard Stats
// Shared dashboard summary route used to render role-specific top-line metrics.
app.get('/api/dashboard/stats', (req, res) => {
  const profile = getProfileFromAuth(req);
  if (!profile) return res.json({ data: {} });

  if (profile.role === 'student') {
    const myApps = db.applications.filter((a: any) => a.candidateId === profile.id);
    res.json({
      data: {
        myApplications: myApps.length,
        shortlisted: myApps.filter((a: any) => a.status === 'shortlisted').length,
        interviews: myApps.filter((a: any) => a.status === 'interview').length,
        pending: myApps.filter((a: any) => a.status === 'pending').length
      }
    });
  } else if (roleMatches(profile.role, 'recruiter')) {
    const myJobs = db.jobs.filter((j: any) => j.employerId === profile.id);
    const myApps = db.applications.filter((a: any) => myJobs.some((j: any) => j.id === a.jobId));
    res.json({
      data: {
        postedJobs: myJobs.length,
        totalApplications: myApps.length,
        interviewsScheduled: myApps.filter((a: any) => a.status === 'interview').length,
        shortlisted: myApps.filter((a: any) => a.status === 'shortlisted').length
      }
    });
  } else {
    res.json({
      data: {
        totalUsers: db.profiles.length,
        totalJobs: db.jobs.length,
        totalApplications: db.applications.length,
        totalCandidates: db.candidates.length,
        totalCourses: db.courses.length,
        totalResumes: db.resumes.length,
      }
    });
  }
});

app.get('/api/admin/applications/summary', requireAuth, requireRoles('admin'), adminLimiter, (req, res) => {
  const days = toPositiveInt(req.query?.days, 30, 365);
  const summary = buildAdminApplicationSummary(days);
  res.json({ data: summary });
});

app.get('/api/admin/logs', requireAuth, requireRoles('admin'), adminLimiter, (req, res) => {
  const { actionType, targetType } = req.query;
  const pagination = getPagination(req.query as any, { page: 1, limit: 30, maxLimit: 100 });

  let logs = [...db.adminLogs];
  if (actionType) {
    const normalized = String(actionType).toLowerCase();
    logs = logs.filter((entry: any) => String(entry.actionType || '').toLowerCase() === normalized);
  }
  if (targetType) {
    const normalized = String(targetType).toLowerCase();
    logs = logs.filter((entry: any) => String(entry.targetType || '').toLowerCase() === normalized);
  }

  logs.sort((left: any, right: any) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime());
  const paginated = paginateData(logs, pagination.page, pagination.limit);
  res.json({ data: paginated.data, meta: paginated.meta });
});

// Admin routes: monitoring, moderation, user management, and audit-friendly operations.
app.get('/api/admin/monitoring', requireAuth, requireRoles('admin'), adminLimiter, async (req: RequestWithAuth, res) => {
  const days = toPositiveInt(req.query?.days, 30, 365);
  const resumes = db.resumes.map((entry: any) => buildResumeMonitoringRecord(entry));
  const appSummary = buildAdminApplicationSummary(days);
  const platformHealth = await getPlatformHealthSnapshot();
  const averageResumeScore = Math.round(
    average(
      db.resumeScores
        .map((entry: any) => Number(entry.score || 0))
        .filter((entry: number) => Number.isFinite(entry) && entry > 0)
    )
  );

  const totals = {
    totalUsers: db.profiles.length,
    totalStudents: db.profiles.filter((entry: any) => roleMatches(entry.role, 'student')).length,
    totalRecruiters: db.profiles.filter((entry: any) => roleMatches(entry.role, 'recruiter')).length,
    totalAdmins: db.profiles.filter((entry: any) => roleMatches(entry.role, 'admin')).length,
    totalResumes: db.resumes.length,
    totalJobs: db.jobs.length,
    activeJobs: db.jobs.filter((entry: any) => entry.status === 'active').length,
    closedJobs: db.jobs.filter((entry: any) => entry.status === 'closed').length,
    totalApplications: db.applications.length,
    averageResumeScore,
    averageMatchPercentage: appSummary.averageMatchPercentage,
    resumeMonitoring: {
      successfulParses: resumes.filter((entry: any) => entry.parseStatus === 'success').length,
      failedParses: resumes.filter((entry: any) => entry.parseStatus === 'failed').length,
      flaggedResumes: resumes.filter((entry: any) => entry.moderationStatus === 'flagged').length,
    },
    applicationSummary: appSummary,
    mostAppliedJob: appSummary.applicationsPerJob[0] || null,
    recentAdminActions: db.adminLogs.slice(0, 12),
    platformHealth,
  };

  res.json({ data: totals });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend API is running',
    dataProvider: supabaseStore.isActive() ? 'supabase' : 'memory',
  });
});

const seedSupabaseFromMemory = async () => {
  if (!supabaseStore.isActive()) return;
  for (const profile of db.profiles) {
    await supabaseStore.upsertUser(profile);
  }
  for (const job of db.jobs) {
    await supabaseStore.upsertJob(job);
  }
  for (const course of db.courses) {
    await supabaseStore.upsertCourse(course);
  }
  for (const resume of db.resumes) {
    await supabaseStore.upsertResume(resume);
  }
  for (const candidate of db.candidates) {
    await supabaseStore.upsertCandidate(candidate);
  }
  for (const application of db.applications) {
    await supabaseStore.upsertApplication(application);
  }
  for (const recommendation of db.recommendations) {
    await supabaseStore.upsertRecommendation(recommendation);
  }
  for (const score of db.resumeScores) {
    await supabaseStore.upsertResumeScore(score);
  }
  for (const progress of db.skillProgress) {
    await supabaseStore.upsertSkillProgress(progress);
  }
  for (const plan of db.learningPlans) {
    await supabaseStore.upsertLearningPlan(plan);
  }
  for (const session of db.mockInterviewSessions) {
    await supabaseStore.upsertMockInterviewSession(session);
  }
  for (const saved of db.savedJobs) {
    await supabaseStore.upsertSavedJob(saved);
  }
  for (const preference of db.careerPreferences) {
    await supabaseStore.upsertCareerPreference(preference);
  }
};

const ensureBootstrapUsers = async () => {
  const bootstrapUsers = [
    readOptionalBootstrapUser('INITIAL_ADMIN', 'admin', 'Platform Admin'),
    readOptionalBootstrapUser('INITIAL_RECRUITER', 'employer', 'Initial Recruiter'),
  ].filter(Boolean) as Array<{ email: string; password: string; name: string; role: SupportedRole }>;

  for (const bootstrapUser of bootstrapUsers) {
    const existing = db.profiles.find(
      (entry: any) => entry.email?.toLowerCase() === bootstrapUser.email
    );

    if (existing) {
      let didChange = false;
      if (existing.role !== bootstrapUser.role) {
        existing.role = bootstrapUser.role;
        didChange = true;
      }
      if (!existing.name && bootstrapUser.name) {
        existing.name = bootstrapUser.name;
        didChange = true;
      }
      if (!existing.passwordHash) {
        existing.passwordHash = await bcrypt.hash(bootstrapUser.password, 10);
        didChange = true;
      }
      if (didChange) {
        existing.updatedAt = new Date();
        await supabaseStore.upsertUser(existing);
      }
      continue;
    }

    const profile = {
      id: uuidv4(),
      email: bootstrapUser.email,
      passwordHash: await bcrypt.hash(bootstrapUser.password, 10),
      name: bootstrapUser.name,
      role: bootstrapUser.role,
      avatarUrl: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.profiles.push(profile);
    await supabaseStore.upsertUser(profile);
  }
};

const initializeRuntime = async () => {
  const bootstrap = await supabaseStore.bootstrap(db);
  if (bootstrap.mode === 'supabase' && bootstrap.loaded) {
    console.log('Loaded runtime data from Supabase.');
  } else if (supabaseStore.isActive() && SHOULD_BOOT_DEMO_DATA && SYNC_DEMO_DATA_TO_SUPABASE) {
    console.log('Supabase mode enabled with explicit demo data sync.');
    await seedSupabaseFromMemory();
  } else if (supabaseStore.isActive()) {
    console.log('Supabase mode enabled with an empty initial store.');
  } else if (SHOULD_BOOT_DEMO_DATA) {
    console.log('Using in-memory data provider with explicit demo data.');
  } else {
    console.log('Using in-memory data provider with an empty initial store.');
  }

  await ensureBootstrapUsers();
};

runtimeReady = initializeRuntime();

const startServer = async () => {
  try {
    await runtimeReady;
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
};

if (process.env.VERCEL === undefined) {
  void startServer();
}

export default app;
