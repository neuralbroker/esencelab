/**
 * Supabase persistence adapter.
 *
 * The API works against an in-memory `db` object for runtime simplicity. This
 * class mirrors that data to Supabase so the same route code can run locally
 * or with persistent live data.
 *
 * In practice this file does three jobs:
 * 1. decide whether Supabase mode is active
 * 2. load remote tables into the in-memory runtime shape at startup
 * 3. persist writes from the API routes back into Supabase
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
type AnyRecord = Record<string, any>;
type QueryResult<T = any> = { data: T | null; error: any };

const RETRYABLE_STATUS_CODES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
const RETRYABLE_ERROR_CODES = new Set([
  'aborted',
  'eai_again',
  'econnaborted',
  'econnrefused',
  'econnreset',
  'enetdown',
  'enetreset',
  'enetwork',
  'enotfound',
  'etimedout',
]);
const RETRYABLE_MESSAGE_FRAGMENTS = [
  'connection terminated unexpectedly',
  'dns lookup timed out',
  'fetch failed',
  'network request failed',
  'network timeout',
  'socket hang up',
  'timed out',
  'timeout',
  'too many requests',
  'try again later',
];
const TRANSIENT_RETRY_DELAYS_MS = [150, 450, 900];

const toArray = (value: any): string[] => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => String(item));
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const toDate = (value: any): Date => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const toIso = (value: any): string => {
  const date = toDate(value);
  return date.toISOString();
};

const toNumberOrNull = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toNumberOrZero = (value: any): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toJsonArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const stringifyError = (error: any): string => {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;

  const message = error.message || error.details || error.hint || String(error);
  const code = error.code || error.status || error.statusCode || error.cause?.code;
  return code ? `${message} (code: ${code})` : String(message);
};

const getErrorStatus = (error: any): number | null => {
  const raw = error?.status ?? error?.statusCode ?? error?.code;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const getErrorCode = (error: any): string => {
  return String(error?.code || error?.cause?.code || '').trim().toLowerCase();
};

const isRetryableError = (error: any): boolean => {
  const status = getErrorStatus(error);
  if (status !== null && RETRYABLE_STATUS_CODES.has(status)) {
    return true;
  }

  const code = getErrorCode(error);
  if (code && RETRYABLE_ERROR_CODES.has(code)) {
    return true;
  }

  const message = stringifyError(error).toLowerCase();
  return RETRYABLE_MESSAGE_FRAGMENTS.some((fragment) => message.includes(fragment));
};

export class SupabaseStore {
  private client: SupabaseClient | null = null;
  private active = false;

  constructor() {
    const provider = (process.env.DATA_PROVIDER || 'memory').toLowerCase();
    const url = process.env.SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_KEY;

    if (provider === 'supabase' && url && key) {
      this.client = createClient(url, key, {
        auth: { persistSession: false },
      });
      this.active = true;
    }
  }

  isActive() {
    return this.active && !!this.client;
  }

  private disableWithError(error: any, context?: string) {
    this.active = false;
    const prefix = context ? `Supabase store disabled during ${context}:` : 'Supabase store disabled:';
    console.error(prefix, stringifyError(error));
  }

  private async runWithRetry<T>(context: string, operation: () => Promise<T>): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= TRANSIENT_RETRY_DELAYS_MS.length; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (!isRetryableError(error) || attempt === TRANSIENT_RETRY_DELAYS_MS.length) {
          throw error;
        }
      }

      await delay(TRANSIENT_RETRY_DELAYS_MS[attempt]);
      console.warn(`Supabase transient failure during ${context}; retrying attempt ${attempt + 2}.`);
    }

    throw lastError;
  }

  private async selectAll(table: string): Promise<any[]> {
    if (!this.client) return [];
    const result = await this.runWithRetry(`bootstrap.select.${table}`, async () => {
      const response = (await this.client!.from(table).select('*')) as QueryResult<any[]>;
      if (response.error) {
        throw response.error;
      }
      return response;
    });

    return Array.isArray(result.data) ? result.data : [];
  }

  private shouldDisable(error: any): boolean {
    return !isRetryableError(error);
  }

  async bootstrap(db: AnyRecord) {
    if (!this.isActive() || !this.client) {
      return { mode: 'memory', loaded: false };
    }

    try {
      const [
        users,
        jobs,
        resumes,
        candidates,
        applications,
        courses,
        recommendations,
        resumeScores,
        skillProgress,
        learningPlans,
        mockInterviewSessions,
        savedJobs,
        careerPreferences,
      ] = await Promise.all([
        this.selectAll('users'),
        this.selectAll('jobs'),
        this.selectAll('resumes'),
        this.selectAll('candidates'),
        this.selectAll('applications'),
        this.selectAll('courses'),
        this.selectAll('recommendations'),
        this.selectAll('resume_scores'),
        this.selectAll('skill_progress'),
        this.selectAll('learning_plans'),
        this.selectAll('mock_interview_sessions'),
        this.selectAll('saved_jobs'),
        this.selectAll('career_preferences'),
      ]);

      if ((users || []).length === 0) {
        return { mode: 'supabase', loaded: false };
      }

      db.profiles = (users || []).map((row: AnyRecord) => ({
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash || '',
        name: row.name,
        role: row.role === 'recruiter' ? 'employer' : row.role,
        avatarUrl: row.avatar_url || null,
        isActive: row.is_active !== false,
        createdAt: toDate(row.created_at),
        updatedAt: toDate(row.updated_at),
      }));

      db.jobs = (jobs || []).map((row: AnyRecord) => ({
        id: row.id,
        employerId: row.employer_id,
        title: row.title,
        company: row.company,
        location: row.location,
        description: row.description,
        requirements: toArray(row.requirements),
        skills: toArray(row.skills),
        salaryMin: toNumberOrNull(row.salary_min),
        salaryMax: toNumberOrNull(row.salary_max),
        jobType: row.job_type || 'full_time',
        status: row.status || 'active',
        createdAt: toDate(row.created_at),
        updatedAt: toDate(row.updated_at),
      }));

      db.resumes = (resumes || []).map((row: AnyRecord) => ({
        id: row.id,
        userId: row.user_id,
        fileUrl: row.file_url,
        fileName: row.file_name,
        parsedData: row.parsed_data || {},
        skills: toArray(row.skills),
        createdAt: toDate(row.created_at),
        updatedAt: toDate(row.updated_at),
      }));

      db.candidates = (candidates || []).map((row: AnyRecord) => {
        const skills = Array.isArray(row.skills) ? row.skills : toArray(row.skills);
        const education = Array.isArray(row.education) ? row.education : row.education || [];
        const experience = Array.isArray(row.experience) ? row.experience : row.experience || [];
        return {
          id: row.id,
          userId: row.user_id,
          name: row.name,
          email: row.email,
          role: row.role || 'Student',
          skills: JSON.stringify(skills),
          education: JSON.stringify(education),
          experience: JSON.stringify(experience),
          parsedData: row.parsed_data || null,
          matchScore: toNumberOrZero(row.match_score),
          status: row.status || 'new',
          createdAt: toDate(row.created_at),
          updatedAt: toDate(row.updated_at),
        };
      });

      db.applications = (applications || []).map((row: AnyRecord) => ({
        id: row.id,
        jobId: row.job_id,
        candidateId: row.candidate_id,
        status: row.status || 'pending',
        matchScore: toNumberOrZero(row.match_score),
        matchedSkills: toArray(row.matched_skills),
        missingSkills: toArray(row.missing_skills),
        explanation: row.explanation || null,
        notes: row.notes || '',
        appliedAt: toDate(row.applied_at),
        updatedAt: toDate(row.updated_at),
      }));

      db.courses = (courses || []).map((row: AnyRecord) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        provider: row.provider,
        url: row.url,
        skills: toArray(row.skills),
        duration: row.duration || null,
        level: row.level || null,
        rating: toNumberOrNull(row.rating),
        createdAt: toDate(row.created_at),
        updatedAt: toDate(row.updated_at),
      }));

      db.recommendations = (recommendations || []).map((row: AnyRecord) => ({
        id: row.id,
        userId: row.user_id,
        jobId: row.job_id,
        matchScore: toNumberOrZero(row.match_score),
        matchedSkills: toArray(row.matched_skills),
        missingSkills: toArray(row.missing_skills),
        explanation: row.explanation || null,
        createdAt: toDate(row.created_at),
      }));

      db.resumeScores = (resumeScores || []).map((row: AnyRecord) => ({
        id: row.id,
        userId: row.user_id,
        roleId: row.role_id || 'backend_developer',
        score: toNumberOrZero(row.score),
        sectionScores: row.section_scores || {},
        suggestions: Array.isArray(row.suggestions) ? row.suggestions : [],
        createdAt: toDate(row.created_at),
      }));

      db.skillProgress = (skillProgress || []).map((row: AnyRecord) => ({
        id: row.id,
        userId: row.user_id,
        roleId: row.role_id || 'backend_developer',
        skillName: row.skill_name,
        status: row.status || 'missing',
        createdAt: toDate(row.created_at),
        updatedAt: toDate(row.updated_at),
      }));

      db.learningPlans = (learningPlans || []).map((row: AnyRecord) => ({
        id: row.id,
        userId: row.user_id,
        roleId: row.role_id || 'backend_developer',
        durationDays: toNumberOrZero(row.duration_days),
        planData: row.plan_data || {},
        createdAt: toDate(row.created_at),
        updatedAt: toDate(row.updated_at),
      }));

      db.mockInterviewSessions = (mockInterviewSessions || []).map((row: AnyRecord) => ({
        id: row.id,
        userId: row.user_id,
        roleId: row.role_id || 'backend_developer',
        question: row.question || '',
        answer: row.answer || '',
        rating: toNumberOrZero(row.rating),
        createdAt: toDate(row.created_at),
      }));

      db.savedJobs = (savedJobs || []).map((row: AnyRecord) => ({
        id: row.id,
        userId: row.user_id,
        jobId: row.job_id,
        createdAt: toDate(row.created_at),
      }));

      db.careerPreferences = (careerPreferences || []).map((row: AnyRecord) => ({
        userId: row.user_id,
        roleId: row.role_id || 'backend_developer',
        updatedAt: toDate(row.updated_at),
      }));

      return { mode: 'supabase', loaded: true };
    } catch (error) {
      if (this.shouldDisable(error)) {
        this.disableWithError(error, 'bootstrap');
      } else {
        console.error('Supabase bootstrap failed after retries:', stringifyError(error));
      }
      throw error;
    }
  }

  private async upsert(table: string, payload: AnyRecord, onConflict = 'id') {
    if (!this.isActive() || !this.client) return;
    try {
      await this.runWithRetry(`upsert.${table}`, async () => {
        const { error } = await this.client!.from(table).upsert(payload, { onConflict });
        if (error) {
          throw error;
        }
      });
    } catch (error) {
      if (this.shouldDisable(error)) {
        this.disableWithError(error, `upsert.${table}`);
      }
      throw error;
    }
  }

  private async delete(table: string, column: string, value: string) {
    if (!this.isActive() || !this.client) return;
    try {
      await this.runWithRetry(`delete.${table}`, async () => {
        const { error } = await this.client!.from(table).delete().eq(column, value);
        if (error) {
          throw error;
        }
      });
    } catch (error) {
      if (this.shouldDisable(error)) {
        this.disableWithError(error, `delete.${table}`);
      }
      throw error;
    }
  }

  async upsertUser(profile: AnyRecord) {
    await this.upsert('users', {
      id: profile.id,
      email: profile.email,
      password_hash: profile.passwordHash,
      name: profile.name,
      role: profile.role,
      avatar_url: profile.avatarUrl,
      is_active: profile.isActive !== false,
      created_at: toIso(profile.createdAt),
      updated_at: toIso(profile.updatedAt),
    });
  }

  async deleteUser(id: string) {
    await this.delete('users', 'id', id);
  }

  async upsertResume(resume: AnyRecord) {
    await this.upsert('resumes', {
      id: resume.id,
      user_id: resume.userId,
      file_url: resume.fileUrl,
      file_name: resume.fileName,
      parsed_data: resume.parsedData || {},
      skills: toArray(resume.skills),
      created_at: toIso(resume.createdAt),
      updated_at: toIso(resume.updatedAt),
    });
  }

  async deleteResume(id: string) {
    await this.delete('resumes', 'id', id);
  }

  async deleteResumesByUser(userId: string) {
    await this.delete('resumes', 'user_id', userId);
  }

  async upsertCandidate(candidate: AnyRecord) {
    await this.upsert('candidates', {
      id: candidate.id,
      user_id: candidate.userId,
      name: candidate.name,
      email: candidate.email,
      role: candidate.role,
      skills: toJsonArray(candidate.skills),
      education: toJsonArray(candidate.education),
      experience: toJsonArray(candidate.experience),
      parsed_data: candidate.parsedData || null,
      match_score: toNumberOrZero(candidate.matchScore),
      status: candidate.status || 'new',
      created_at: toIso(candidate.createdAt),
      updated_at: toIso(candidate.updatedAt),
    });
  }

  async deleteCandidatesByUser(userId: string) {
    await this.delete('candidates', 'user_id', userId);
  }

  async upsertJob(job: AnyRecord) {
    await this.upsert('jobs', {
      id: job.id,
      employer_id: job.employerId,
      title: job.title,
      company: job.company,
      description: job.description,
      requirements: toArray(job.requirements),
      skills: toArray(job.skills),
      location: job.location,
      salary_min: toNumberOrNull(job.salaryMin),
      salary_max: toNumberOrNull(job.salaryMax),
      job_type: job.jobType || 'full_time',
      status: job.status || 'active',
      created_at: toIso(job.createdAt),
      updated_at: toIso(job.updatedAt),
    });
  }

  async deleteJob(id: string) {
    await this.delete('jobs', 'id', id);
  }

  async upsertApplication(application: AnyRecord) {
    await this.upsert('applications', {
      id: application.id,
      job_id: application.jobId,
      candidate_id: application.candidateId,
      status: application.status,
      match_score: toNumberOrZero(application.matchScore),
      matched_skills: toArray(application.matchedSkills),
      missing_skills: toArray(application.missingSkills),
      explanation: application.explanation || null,
      notes: application.notes || null,
      applied_at: toIso(application.appliedAt),
      updated_at: toIso(application.updatedAt),
    });
  }

  async deleteApplicationsByJob(jobId: string) {
    await this.delete('applications', 'job_id', jobId);
  }

  async deleteApplicationsByCandidate(candidateId: string) {
    await this.delete('applications', 'candidate_id', candidateId);
  }

  async deleteApplication(id: string) {
    await this.delete('applications', 'id', id);
  }

  async upsertCourse(course: AnyRecord) {
    await this.upsert('courses', {
      id: course.id,
      title: course.title,
      description: course.description,
      provider: course.provider,
      url: course.url,
      skills: toArray(course.skills),
      duration: course.duration,
      level: course.level,
      rating: toNumberOrNull(course.rating),
      created_at: toIso(course.createdAt),
      updated_at: toIso(course.updatedAt),
    });
  }

  async deleteCourse(id: string) {
    await this.delete('courses', 'id', id);
  }

  async upsertRecommendation(recommendation: AnyRecord) {
    await this.upsert('recommendations', {
      id: recommendation.id,
      user_id: recommendation.userId,
      job_id: recommendation.jobId,
      match_score: toNumberOrZero(recommendation.matchScore),
      matched_skills: toArray(recommendation.matchedSkills),
      missing_skills: toArray(recommendation.missingSkills),
      explanation: recommendation.explanation || null,
      created_at: toIso(recommendation.createdAt),
    });
  }

  async deleteRecommendationsByUser(userId: string) {
    await this.delete('recommendations', 'user_id', userId);
  }

  async upsertResumeScore(score: AnyRecord) {
    await this.upsert('resume_scores', {
      id: score.id,
      user_id: score.userId,
      role_id: score.roleId,
      score: toNumberOrZero(score.score),
      section_scores: score.sectionScores || {},
      suggestions: Array.isArray(score.suggestions) ? score.suggestions : [],
      created_at: toIso(score.createdAt),
    });
  }

  async deleteResumeScoresByUser(userId: string) {
    await this.delete('resume_scores', 'user_id', userId);
  }

  async upsertSkillProgress(progress: AnyRecord) {
    await this.upsert('skill_progress', {
      id: progress.id,
      user_id: progress.userId,
      role_id: progress.roleId,
      skill_name: progress.skillName,
      status: progress.status,
      created_at: toIso(progress.createdAt),
      updated_at: toIso(progress.updatedAt),
    });
  }

  async deleteSkillProgressByUser(userId: string) {
    await this.delete('skill_progress', 'user_id', userId);
  }

  async upsertLearningPlan(plan: AnyRecord) {
    await this.upsert('learning_plans', {
      id: plan.id,
      user_id: plan.userId,
      role_id: plan.roleId,
      duration_days: toNumberOrZero(plan.durationDays),
      plan_data: plan.planData || {},
      created_at: toIso(plan.createdAt),
      updated_at: toIso(plan.updatedAt),
    });
  }

  async deleteLearningPlansByUser(userId: string) {
    await this.delete('learning_plans', 'user_id', userId);
  }

  async upsertMockInterviewSession(session: AnyRecord) {
    await this.upsert('mock_interview_sessions', {
      id: session.id,
      user_id: session.userId,
      role_id: session.roleId,
      question: session.question,
      answer: session.answer,
      rating: toNumberOrNull(session.rating),
      created_at: toIso(session.createdAt),
    });
  }

  async deleteMockInterviewSessionsByUser(userId: string) {
    await this.delete('mock_interview_sessions', 'user_id', userId);
  }

  async upsertSavedJob(saved: AnyRecord) {
    await this.upsert('saved_jobs', {
      id: saved.id,
      user_id: saved.userId,
      job_id: saved.jobId,
      created_at: toIso(saved.createdAt),
    });
  }

  async deleteSavedJob(id: string) {
    await this.delete('saved_jobs', 'id', id);
  }

  async deleteSavedJobsByUser(userId: string) {
    await this.delete('saved_jobs', 'user_id', userId);
  }

  async upsertCareerPreference(preference: AnyRecord) {
    await this.upsert(
      'career_preferences',
      {
        user_id: preference.userId,
        role_id: preference.roleId,
        updated_at: toIso(preference.updatedAt || new Date()),
      },
      'user_id'
    );
  }

  async deleteCareerPreference(userId: string) {
    await this.delete('career_preferences', 'user_id', userId);
  }

  async insertAdminLog(log: AnyRecord) {
    if (!this.isActive() || !this.client) return;
    try {
      const { error } = await this.client.from('admin_logs').insert({
        id: log.id,
        admin_id: log.adminId,
        action_type: log.actionType,
        target_type: log.targetType,
        target_id: log.targetId,
        details: log.details || {},
        created_at: toIso(log.createdAt),
      });
      if (error) {
        const message = String(error.message || '').toLowerCase();
        if (
          message.includes('relation') ||
          message.includes('does not exist') ||
          message.includes('schema cache')
        ) {
          return;
        }
        console.warn('Supabase admin_logs insert warning:', error.message || error);
      }
    } catch (error: any) {
      console.warn('Supabase admin_logs insert failed:', error?.message || error);
    }
  }
}
