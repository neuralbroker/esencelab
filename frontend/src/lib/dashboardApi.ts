import api, { cachedGet, invalidateApiCache } from '@/lib/api';
import {
  AdminMonitoringData,
  AdminResumeRecord,
  CareerOverview,
  CareerRole,
  Job,
  JobTrackerData,
  LearningPlan,
  MockInterviewPack,
  PaginationMeta,
  RecruiterCandidateMatch,
  RecruiterOverview,
  Resume,
  RoadmapItem,
  StudentAICoachResponse,
  StudentRecommendations,
  User,
} from '@/types';

interface RecommendationCachePayload {
  ts: number;
  data: StudentRecommendations;
}

const RECOMMENDATION_CACHE_PREFIX = 'esencelab.recommendations.';
const RECOMMENDATION_CACHE_TTL_MS = 5 * 60 * 1000;

const getRecommendationCacheKey = (userId: string) =>
  `${RECOMMENDATION_CACHE_PREFIX}${userId}`;

const safeJsonParse = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const getDashboardStats = async () => {
  const payload = await cachedGet<{ data?: any }>('/dashboard/stats', { ttlMs: 8000 });
  return payload.data || {};
};

export const getAdminMonitoring = async (): Promise<AdminMonitoringData> => {
  const payload = await cachedGet<{ data?: AdminMonitoringData }>('/admin/monitoring', { ttlMs: 12000 });
  return (
    payload.data || {
      totalUsers: 0,
      totalStudents: 0,
      totalRecruiters: 0,
      totalAdmins: 0,
      totalResumes: 0,
      totalJobs: 0,
      activeJobs: 0,
      closedJobs: 0,
      totalApplications: 0,
      averageResumeScore: 0,
      averageMatchPercentage: 0,
      resumeMonitoring: {
        successfulParses: 0,
        failedParses: 0,
        flaggedResumes: 0,
      },
      applicationSummary: {
        totalApplications: 0,
        averageMatchPercentage: 0,
        byStatus: { pending: 0, shortlisted: 0, interview: 0, rejected: 0 },
        applicationsPerJob: [],
        applicationsPerStudent: [],
        trendLastDays: [],
      },
      mostAppliedJob: null,
      recentAdminActions: [],
      platformHealth: {
        uptimeSeconds: 0,
        totalRequests: 0,
        totalErrors: 0,
        apiErrorRate: 0,
        authFailures: 0,
        slowRequests: 0,
        slowThresholdMs: 1200,
        avgResponseMs: 0,
        aiService: { status: 'unknown', statusCode: null, latencyMs: null },
        slowEndpoints: [],
      },
    }
  );
};

export const getAdminUsers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  sortBy?: 'createdAt' | 'name' | 'email' | 'role' | 'applications' | 'jobs' | 'resumeScore';
  order?: 'asc' | 'desc';
}): Promise<{ data: User[]; meta: PaginationMeta }> => {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.search) query.append('search', params.search);
  if (params?.role) query.append('role', params.role);
  if (params?.sortBy) query.append('sortBy', params.sortBy);
  if (params?.order) query.append('order', params.order);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const payload = await cachedGet<{ data?: User[]; meta?: PaginationMeta }>(`/users${suffix}`, {
    ttlMs: 7000,
  });
  return {
    data: payload.data || [],
    meta: payload.meta || { page: 1, limit: 20, total: 0, totalPages: 0 },
  };
};

export const getAdminUserDetails = async (userId: string) => {
  const payload = await cachedGet<{ data?: any }>(`/users/${userId}`, { ttlMs: 7000 });
  return payload.data;
};

export const getAdminLogs = async (params?: {
  page?: number;
  limit?: number;
  actionType?: string;
  targetType?: string;
}) => {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.actionType) query.append('actionType', params.actionType);
  if (params?.targetType) query.append('targetType', params.targetType);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const payload = await cachedGet<{ data?: any[]; meta?: PaginationMeta }>(`/admin/logs${suffix}`, {
    ttlMs: 6000,
  });
  return {
    data: payload.data || [],
    meta: payload.meta || { page: 1, limit: 30, total: 0, totalPages: 0 },
  };
};

export const getAdminResumes = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  parseStatus?: 'success' | 'failed';
  flaggedOnly?: boolean;
  sortBy?: 'updatedAt' | 'createdAt' | 'score' | 'student';
  order?: 'asc' | 'desc';
}): Promise<{
  data: AdminResumeRecord[];
  meta: PaginationMeta;
  summary: {
    total: number;
    success: number;
    failed: number;
    flagged: number;
  };
}> => {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.search) query.append('search', params.search);
  if (params?.parseStatus) query.append('parseStatus', params.parseStatus);
  if (typeof params?.flaggedOnly === 'boolean') query.append('flaggedOnly', String(params.flaggedOnly));
  if (params?.sortBy) query.append('sortBy', params.sortBy);
  if (params?.order) query.append('order', params.order);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const payload = await cachedGet<{
    data?: AdminResumeRecord[];
    meta?: PaginationMeta;
    summary?: { total: number; success: number; failed: number; flagged: number };
  }>(`/admin/resumes${suffix}`, { ttlMs: 6000 });
  return {
    data: payload.data || [],
    meta: payload.meta || { page: 1, limit: 20, total: 0, totalPages: 0 },
    summary: payload.summary || { total: 0, success: 0, failed: 0, flagged: 0 },
  };
};

export const moderateAdminResume = async (
  resumeId: string,
  payload: {
    status: 'clean' | 'flagged' | 'review';
    notes?: string;
  }
) => {
  const res = await api.put(`/admin/resumes/${resumeId}/moderation`, payload);
  invalidateApiCache('/admin/resumes');
  invalidateApiCache('/admin/monitoring');
  invalidateApiCache('/admin/logs');
  return res.data.data as AdminResumeRecord;
};

export const deleteAdminResume = async (resumeId: string) => {
  await api.delete(`/admin/resumes/${resumeId}`);
  invalidateApiCache('/admin/resumes');
  invalidateApiCache('/admin/monitoring');
  invalidateApiCache('/admin/logs');
};

export const getLatestJobs = async (limit = 6): Promise<Job[]> => {
  const payload = await cachedGet<{ data?: { jobs?: Job[] } }>(`/jobs?limit=${limit}`, { ttlMs: 10000 });
  return payload.data?.jobs || [];
};

export const getEmployerJobs = async (): Promise<Job[]> => {
  const payload = await cachedGet<{ data?: { jobs?: Job[] } }>('/jobs?my=true&status=active', {
    ttlMs: 8000,
  });
  return payload.data?.jobs || [];
};

export const getCandidateMatches = async (
  jobId: string,
  options?: {
    sortBy?: 'match' | 'resume' | 'experience';
    order?: 'asc' | 'desc';
    limit?: number;
    appliedOnly?: boolean;
  }
): Promise<RecruiterCandidateMatch[]> => {
  const params = new URLSearchParams();
  if (options?.sortBy) params.append('sortBy', options.sortBy);
  if (options?.order) params.append('order', options.order);
  if (typeof options?.limit === 'number') params.append('limit', String(options.limit));
  if (typeof options?.appliedOnly === 'boolean') params.append('appliedOnly', String(options.appliedOnly));
  const query = params.toString() ? `?${params.toString()}` : '';
  const payload = await cachedGet<{ data?: RecruiterCandidateMatch[] }>(`/jobs/${jobId}/candidate-matches${query}`, {
    ttlMs: 5000,
  });
  return payload.data || [];
};

export const getRecruiterOverview = async (): Promise<RecruiterOverview> => {
  const payload = await cachedGet<{ data?: RecruiterOverview }>('/recruiter/overview', { ttlMs: 9000 });
  return (
    payload.data || {
      postedJobs: 0,
      activeJobs: 0,
      totalApplicants: 0,
      uniqueApplicants: 0,
      averageMatchAcrossJobs: 0,
      perJobAnalytics: [],
      topCandidates: [],
      skillDemandInsights: [],
    }
  );
};

export const createJob = async (payload: {
  title: string;
  company: string;
  location?: string;
  requirements: string;
  description?: string;
  experienceLevel?: 'entry' | 'junior' | 'mid' | 'senior' | 'lead';
  jobType?: 'full_time' | 'part_time' | 'internship' | 'contract';
}) => {
  const requirements = payload.requirements
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  const safeRequirements = requirements.length > 0 ? requirements : ['Communication', 'Problem Solving'];

  const res = await api.post('/jobs', {
    title: payload.title,
    company: payload.company,
    location: payload.location?.trim() || 'Remote',
    description:
      payload.description?.trim() || `Opportunity for ${payload.title} candidates.`,
    requirements: safeRequirements,
    skills: safeRequirements,
    experienceLevel: payload.experienceLevel || 'mid',
    jobType: payload.jobType || 'full_time',
    status: 'active',
  });
  invalidateApiCache('/jobs');
  invalidateApiCache('/recruiter/overview');
  invalidateApiCache('/dashboard/stats');
  invalidateApiCache('/admin/monitoring');
  return res.data.data;
};

export const updateJob = async (
  jobId: string,
  payload: Partial<{
    title: string;
    company: string;
    description: string;
    location: string;
    requirements: string[] | string;
    skills: string[];
    experienceLevel: 'entry' | 'junior' | 'mid' | 'senior' | 'lead';
    jobType: 'full_time' | 'part_time' | 'internship' | 'contract';
    status: 'active' | 'closed';
    salaryMin: number | null;
    salaryMax: number | null;
  }>
) => {
  const res = await api.put(`/jobs/${jobId}`, payload);
  invalidateApiCache('/jobs');
  invalidateApiCache('/recruiter/overview');
  invalidateApiCache('/dashboard/stats');
  invalidateApiCache('/admin/monitoring');
  return res.data.data;
};

export const deleteJob = async (jobId: string) => {
  await api.delete(`/jobs/${jobId}`);
  invalidateApiCache('/jobs');
  invalidateApiCache('/recruiter/overview');
  invalidateApiCache('/dashboard/stats');
  invalidateApiCache('/admin/monitoring');
};

export const getResume = async (): Promise<Resume | null> => {
  try {
    const payload = await cachedGet<{ data?: Resume | null }>('/resume', { ttlMs: 6000 });
    return payload.data || null;
  } catch (error: any) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
};

export const uploadResume = async (
  file: File,
  onProgress?: (progress: number) => void,
  options?: { replaceExisting?: boolean }
): Promise<Resume> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('replaceExisting', String(options?.replaceExisting ?? true));

  const res = await api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (!onProgress) return;
      const percent = Math.round((event.loaded * 100) / (event.total || 1));
      onProgress(percent);
    },
  });
  invalidateApiCache('/resume');
  invalidateApiCache('/recommendations');
  invalidateApiCache('/career/overview');
  invalidateApiCache('/career/roadmap');
  invalidateApiCache('/career/learning-plan');
  invalidateApiCache('/dashboard/stats');
  invalidateApiCache('/admin/resumes');
  invalidateApiCache('/admin/monitoring');
  return res.data.data;
};

export const deleteResume = async (resumeId: string) => {
  await api.delete(`/resume/${resumeId}`);
  invalidateApiCache('/resume');
  invalidateApiCache('/recommendations');
  invalidateApiCache('/career/overview');
  invalidateApiCache('/career/roadmap');
  invalidateApiCache('/career/learning-plan');
  invalidateApiCache('/dashboard/stats');
  invalidateApiCache('/admin/resumes');
  invalidateApiCache('/admin/monitoring');
};

export const getStudentRecommendations = async (
  userId: string,
  forceRefresh = false
): Promise<StudentRecommendations | null> => {
  const cacheKey = getRecommendationCacheKey(userId);
  const canUseCache = !forceRefresh && typeof window !== 'undefined';

  if (canUseCache) {
    const cached = safeJsonParse<RecommendationCachePayload>(sessionStorage.getItem(cacheKey));
    if (cached && Date.now() - cached.ts < RECOMMENDATION_CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const res = await api.get('/recommendations');
  const data = (res.data.data || null) as StudentRecommendations | null;

  if (data && typeof window !== 'undefined') {
    const payload: RecommendationCachePayload = { ts: Date.now(), data };
    sessionStorage.setItem(cacheKey, JSON.stringify(payload));
  }

  return data;
};

export const clearRecommendationCache = (userId: string) => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(getRecommendationCacheKey(userId));
};

export const getCareerRoles = async (): Promise<CareerRole[]> => {
  const payload = await cachedGet<{ data?: CareerRole[] }>('/career/roles', { ttlMs: 15 * 60 * 1000 });
  return payload.data || [];
};

export const askStudentAICoach = async (payload: {
  feature: 'skill_gap' | 'resume_improvement' | 'interview_prep' | 'project_ideas' | 'study_plan';
  prompt?: string;
}): Promise<StudentAICoachResponse> => {
  const res = await api.post('/career/ai-coach', payload);
  return res.data.data;
};

export const setTargetRole = async (roleId: string) => {
  const res = await api.post('/career/target-role', { roleId });
  invalidateApiCache('/career/overview');
  invalidateApiCache('/career/roadmap');
  invalidateApiCache('/career/learning-plan');
  invalidateApiCache('/recommendations');
  return res.data.data;
};

export const getCareerOverview = async (): Promise<CareerOverview> => {
  const payload = await cachedGet<{ data: CareerOverview }>('/career/overview', { ttlMs: 7000 });
  return payload.data;
};

export const getCareerRoadmap = async (roleId?: string): Promise<{ role: CareerRole; roadmap: RoadmapItem[] }> => {
  const query = roleId ? `?roleId=${encodeURIComponent(roleId)}` : '';
  const payload = await cachedGet<{ data: { role: CareerRole; roadmap: RoadmapItem[] } }>(`/career/roadmap${query}`, {
    ttlMs: 7000,
  });
  return payload.data;
};

export const updateRoadmapSkill = async (payload: {
  roleId: string;
  skillName: string;
  status: 'completed' | 'in_progress' | 'missing';
}) => {
  const res = await api.put('/career/roadmap/skill', payload);
  invalidateApiCache('/career/roadmap');
  invalidateApiCache('/career/overview');
  invalidateApiCache('/career/learning-plan');
  return res.data.data;
};

export const getLearningPlan = async (roleId?: string, durationDays: 30 | 60 = 30): Promise<LearningPlan> => {
  const params = new URLSearchParams();
  params.append('durationDays', String(durationDays));
  if (roleId) params.append('roleId', roleId);
  const payload = await cachedGet<{ data: LearningPlan }>(`/career/learning-plan?${params.toString()}`, {
    ttlMs: 20_000,
  });
  return payload.data;
};

export const regenerateLearningPlan = async (roleId?: string, durationDays: 30 | 60 = 30): Promise<LearningPlan> => {
  const res = await api.post('/career/learning-plan', {
    roleId,
    durationDays,
  });
  invalidateApiCache('/career/learning-plan');
  invalidateApiCache('/career/overview');
  return res.data.data;
};

export const getMockInterview = async (roleId?: string): Promise<MockInterviewPack> => {
  const query = roleId ? `?roleId=${encodeURIComponent(roleId)}` : '';
  const payload = await cachedGet<{ data: MockInterviewPack }>(`/career/mock-interview${query}`, {
    ttlMs: 20_000,
  });
  return payload.data;
};

export const saveInterviewSession = async (payload: {
  roleId: string;
  question: string;
  answer: string;
  rating?: number;
}) => {
  const res = await api.post('/career/mock-interview/session', payload);
  invalidateApiCache('/career/mock-interview/sessions');
  invalidateApiCache('/career/overview');
  return res.data.data;
};

export const getMockInterviewSessions = async () => {
  const payload = await cachedGet<{ data?: any[] }>('/career/mock-interview/sessions', { ttlMs: 7000 });
  return payload.data || [];
};

export const getJobTracker = async (): Promise<JobTrackerData> => {
  const payload = await cachedGet<{ data?: JobTrackerData }>('/career/job-tracker', { ttlMs: 5000 });
  return (
    payload.data || {
      savedJobs: [],
      applications: [],
      statusCounts: {
        saved: 0,
        applied: 0,
        interviewing: 0,
        offer: 0,
        rejected: 0,
      },
    }
  );
};

export const saveJobForLater = async (jobId: string) => {
  const res = await api.post('/career/job-tracker/save', { jobId });
  invalidateApiCache('/career/job-tracker');
  invalidateApiCache('/career/overview');
  return res.data.data;
};

export const removeSavedJob = async (jobId: string) => {
  await api.delete(`/career/job-tracker/save/${jobId}`);
  invalidateApiCache('/career/job-tracker');
  invalidateApiCache('/career/overview');
};

export const updateTrackedApplication = async (
  applicationId: string,
  payload: {
    notes?: string;
    status?: 'pending' | 'shortlisted' | 'interview' | 'rejected' | 'applied' | 'interviewing' | 'offer';
  }
) => {
  const res = await api.put(`/career/job-tracker/application/${applicationId}`, payload);
  invalidateApiCache('/career/job-tracker');
  invalidateApiCache('/career/overview');
  invalidateApiCache('/applications');
  return res.data.data;
};

export const deleteTrackedApplication = async (applicationId: string) => {
  await api.delete(`/career/job-tracker/application/${applicationId}`);
  invalidateApiCache('/career/job-tracker');
  invalidateApiCache('/career/overview');
  invalidateApiCache('/applications');
};

export const getReadableErrorMessage = (error: any, fallback: string) => {
  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.message;

  if (status === 401) return 'Your session has expired. Please login again.';
  if (status === 400 && serverMessage) return serverMessage;
  if (status >= 500) return 'Server error occurred. Please try again in a moment.';
  return serverMessage || fallback;
};
