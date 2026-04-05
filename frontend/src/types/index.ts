/**
 * Shared frontend data models.
 *
 * These interfaces describe the shapes returned by the backend so pages,
 * components, and API helpers all work from the same contract.
 */
export type UserRole = 'student' | 'employer' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  canonicalRole?: 'student' | 'recruiter' | 'admin';
  avatarUrl?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  resumeUploaded?: boolean;
  resumeId?: string | null;
  latestResumeScore?: number;
  totalApplications?: number;
  totalJobsPosted?: number;
  lastActivityAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface Education {
  institution?: string;
  degree?: string;
  field?: string;
  year?: string;
}

export interface Experience {
  company?: string;
  title?: string;
  duration?: string;
  description?: string;
}

export interface ResumeParsedData {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  education?: Education[];
  experience?: Experience[];
  projects?: Array<Record<string, unknown>>;
  skills?: string[];
  summary?: string | null;
  organizations?: string[];
  dates?: string[];
}

export interface Resume {
  id: string;
  userId: string;
  fileUrl: string;
  fileName: string;
  parsedData: ResumeParsedData;
  skills: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[] | string;
  skills: string[];
  location: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  jobType: 'full_time' | 'part_time' | 'internship' | 'contract';
  status: 'active' | 'closed';
  employerId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  candidateProfileId?: string | null;
  status: 'pending' | 'shortlisted' | 'rejected' | 'interview' | 'applied' | 'interviewing' | 'offer';
  trackerStatus?: 'applied' | 'interviewing' | 'offer' | 'rejected';
  storageStatus?: 'pending' | 'shortlisted' | 'interview' | 'rejected';
  matchScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  explanation?: string | null;
  notes?: string;
  job?: Job;
  student?: User;
  resume?: Resume | null;
  appliedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  provider: string;
  url: string;
  skills?: string[];
  duration?: string;
  level?: string;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobMatch {
  job: Job;
  matchScore: number;
  requiredSkills?: string[];
  matchedSkills: string[];
  missingSkills: string[];
  explanation?: string | null;
  shortSummary?: string;
  explanationMeta?: {
    summary: string;
    matchedCount: number;
    totalRequired: number;
    improvementImpacts: Array<{
      skill: string;
      impact: number;
    }>;
  };
}

export interface RecruiterCandidateMatch {
  candidateId: string;
  studentId: string;
  name: string;
  email: string;
  role?: string;
  skills: string[];
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  explanation?: string | null;
  hasApplied: boolean;
  applicationStatus?: string | null;
  resumeScore: number;
  experienceYears: number;
  topSkills?: string[];
  latestResumeAt?: string | null;
  student?: User | null;
}

export interface RecruiterJobAnalytics {
  jobId: string;
  title: string;
  totalCandidatesRanked: number;
  totalApplicants: number;
  averageMatch: number;
  averageApplicantMatch: number;
  highestMatchCandidate: {
    candidateId: string;
    name: string;
    matchScore: number;
    resumeScore: number;
  } | null;
  mostMissingSkill: {
    skill: string;
    count: number;
  } | null;
}

export interface RecruiterOverview {
  postedJobs: number;
  activeJobs: number;
  totalApplicants: number;
  uniqueApplicants: number;
  averageMatchAcrossJobs: number;
  perJobAnalytics: RecruiterJobAnalytics[];
  topCandidates: Array<
    RecruiterCandidateMatch & {
      jobId: string;
      jobTitle: string;
    }
  >;
  skillDemandInsights: Array<{
    skill: string;
    count: number;
  }>;
}

export interface CourseRecommendation extends Course {
  matchedMissingSkills: string[];
  relevanceScore: number;
}

export interface StudentRecommendations {
  generatedAt: string;
  recommendedJobs: JobMatch[];
  missingSkills: string[];
  recommendedCourses: CourseRecommendation[];
  summary?: string;
}

export interface StudentResource {
  id: string;
  title: string;
  provider: string;
  url: string;
  description: string;
  format: 'official_docs' | 'guided_course' | 'hands_on' | 'reference';
  level: 'beginner' | 'intermediate' | 'all_levels';
  skills: string[];
  roleIds: string[];
  whyItHelps: string;
  branchTags?: string[];
  recommendedYears?: string[];
  roadmapSource?: string;
  isOfficial?: boolean;
}

export interface ResumeScoreEntry {
  id: string;
  userId: string;
  roleId: string;
  score: number;
  sectionScores: {
    skillsCompleteness?: number;
    experienceRelevance?: number;
    projectStrength?: number;
    formattingConsistency?: number;
    skills: number;
    projects: number;
    experience: number;
    education: number;
  };
  suggestions: string[];
  createdAt: string;
}

export interface CareerRole {
  id: string;
  name: string;
  description: string;
  requiredSkills: string[];
  suggestedTools: string[];
  growthPath: string[];
  track?: string;
  recommendedFor?: string[];
  roadmapSource?: string;
  yearGuidance?: string[];
}

export interface RoadmapItem {
  skill: string;
  status: 'completed' | 'in_progress' | 'missing';
  level?: 'beginner' | 'intermediate' | 'advanced';
}

export interface WeeklyPlannerItem {
  day: number;
  title: string;
  tasks: string[];
}

export interface CareerOverview {
  roleId: string;
  role: CareerRole;
  latestScore: ResumeScoreEntry | null;
  scoreHistory: ResumeScoreEntry[];
  roadmap: RoadmapItem[];
  weeklyPlanner: WeeklyPlannerItem[];
  progress: {
    resumeImprovement: number;
    skillsCompleted: number;
    skillsInProgress: number;
    totalSkills: number;
    jobsMatchedImprovement: number;
  };
  applicationStatusCounts?: {
    saved: number;
    applied: number;
    interviewing: number;
    offer: number;
    rejected: number;
  };
  missingSkills: string[];
}

export interface LearningPlan {
  id: string;
  userId: string;
  roleId: string;
  durationDays: number;
  planData: {
    roleId: string;
    roleName: string;
    durationDays: number;
    generatedAt: string;
    weeks: Array<{
      week: number;
      title: string;
      goals: string[];
      resources: Array<{
        title: string;
        provider: string;
        url: string;
      }>;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MockInterviewPack {
  roleId: string;
  roleName: string;
  technical: Array<{
    question: string;
    suggestedAnswer: string;
  }>;
  behavioral: Array<{
    question: string;
    suggestedAnswer: string;
  }>;
}

export interface StudentAICoachResponse {
  provider: string;
  model?: string | null;
  feature: 'skill_gap' | 'resume_improvement' | 'interview_prep' | 'project_ideas' | 'study_plan';
  title: string;
  summary: string;
  actionItems: string[];
  followUpQuestions: string[];
}

export interface JobTrackerData {
  savedJobs: Array<{
    id: string;
    userId: string;
    jobId: string;
    createdAt: string;
    job: Job;
  }>;
  applications: Application[];
  statusCounts?: {
    saved: number;
    applied: number;
    interviewing: number;
    offer: number;
    rejected: number;
  };
}

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface DashboardStats {
  totalUsers?: number;
  totalJobs?: number;
  totalApplications?: number;
  totalCandidates?: number;
  totalCourses?: number;
  totalResumes?: number;
  myApplications?: number;
  postedJobs?: number;
  interviewsScheduled?: number;
}

export interface AdminApplicationSummary {
  totalApplications: number;
  averageMatchPercentage: number;
  byStatus: {
    pending: number;
    shortlisted: number;
    interview: number;
    rejected: number;
  };
  applicationsPerJob: Array<{
    jobId: string;
    title: string;
    company: string;
    applications: number;
  }>;
  applicationsPerStudent: Array<{
    userId: string;
    name: string;
    email: string;
    applications: number;
  }>;
  trendLastDays: Array<{
    date: string;
    count: number;
  }>;
}

export interface AdminPlatformHealth {
  uptimeSeconds: number;
  totalRequests: number;
  totalErrors: number;
  apiErrorRate: number;
  authFailures: number;
  slowRequests: number;
  slowThresholdMs: number;
  avgResponseMs: number;
  aiService: {
    status: 'up' | 'degraded' | 'down' | 'unknown';
    statusCode: number | null;
    latencyMs: number | null;
  };
  slowEndpoints: Array<{
    endpoint: string;
    count: number;
    errors: number;
    avgDurationMs: number;
    maxDurationMs: number;
    slowCount: number;
    errorRate: number;
    lastStatusCode: number;
    lastSeenAt: string | null;
  }>;
}

export interface AdminMonitoringData {
  totalUsers: number;
  totalStudents: number;
  totalRecruiters: number;
  totalAdmins: number;
  totalResumes: number;
  totalJobs: number;
  activeJobs: number;
  closedJobs: number;
  totalApplications: number;
  averageResumeScore: number;
  averageMatchPercentage: number;
  resumeMonitoring: {
    successfulParses: number;
    failedParses: number;
    flaggedResumes: number;
  };
  applicationSummary: AdminApplicationSummary;
  mostAppliedJob: {
    jobId: string;
    title: string;
    company: string;
    applications: number;
  } | null;
  recentAdminActions: Array<{
    id: string;
    adminId: string | null;
    adminName: string;
    actionType: string;
    targetType: string;
    targetId: string;
    details?: Record<string, unknown>;
    createdAt: string;
  }>;
  platformHealth: AdminPlatformHealth;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminResumeRecord {
  id: string;
  userId: string;
  student: User | null;
  fileName: string;
  fileUrl: string;
  skills: string[];
  parseStatus: 'success' | 'failed';
  flags: string[];
  resumeScore: number;
  parsedData: ResumeParsedData | Record<string, unknown>;
  moderationStatus: 'clean' | 'flagged' | 'review';
  moderationNotes: string;
  moderationUpdatedAt: string | null;
  moderationUpdatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}
