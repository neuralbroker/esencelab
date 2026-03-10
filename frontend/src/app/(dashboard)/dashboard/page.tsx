'use client';

/**
 * Main role-aware dashboard page.
 *
 * This page is the primary control center after login and switches between
 * student, recruiter, and admin summaries based on the current user role.
 */
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowUpRight, Loader2, PlusCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Badge from '@/components/Badge';
import { Skeleton } from '@/components/Skeleton';
import { AdminMonitoringData, Job, RecruiterCandidateMatch, RecruiterOverview, StudentRecommendations } from '@/types';
import {
  createJob,
  getAdminMonitoring,
  getCandidateMatches,
  getEmployerJobs,
  getRecruiterOverview,
  getReadableErrorMessage,
  getStudentRecommendations,
} from '@/lib/dashboardApi';

const StudentUpskillingHub = dynamic(() => import('@/components/StudentUpskillingHub'), {
  loading: () => <DashboardSkeleton />,
});

const scoreToPercent = (score: number) => {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, score <= 1 ? Math.round(score * 100) : Math.round(score)));
};

const formatUptime = (uptimeSeconds: number) => {
  const total = Math.max(0, Math.floor(uptimeSeconds || 0));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

function DashboardSkeleton() {
  return (
    <div className="layout-container section-spacing space-y-8">
      <Skeleton className="h-24 w-full max-w-xl" />
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [recommendations, setRecommendations] = useState<StudentRecommendations | null>(null);
  const [stats, setStats] = useState<AdminMonitoringData | null>(null);
  const [employerJobs, setEmployerJobs] = useState<Job[]>([]);
  const [recruiterOverview, setRecruiterOverview] = useState<RecruiterOverview | null>(null);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [candidateMatches, setCandidateMatches] = useState<RecruiterCandidateMatch[]>([]);
  const [candidateSortBy, setCandidateSortBy] = useState<'match' | 'resume' | 'experience'>('match');
  const [candidateSortOrder, setCandidateSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAppliedOnly, setShowAppliedOnly] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [postingJob, setPostingJob] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    description: '',
    location: '',
    requirements: '',
    experienceLevel: 'mid' as 'entry' | 'junior' | 'mid' | 'senior' | 'lead',
    jobType: 'full_time' as 'full_time' | 'part_time' | 'internship' | 'contract',
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchStudentDashboard = useCallback(
    async (forceRefresh = false) => {
      if (!user) return;
      try {
        const data = await getStudentRecommendations(user.id, forceRefresh);
        setRecommendations(data);
      } catch (error: any) {
        setMessage(getReadableErrorMessage(error, 'Failed to load recommendations.'));
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const fetchEmployerDashboard = useCallback(async () => {
    try {
      const [jobs, overview] = await Promise.all([getEmployerJobs(), getRecruiterOverview()]);
      setEmployerJobs(jobs);
      setRecruiterOverview(overview);
      setSelectedJobId((current) => {
        if (current && jobs.some((job) => job.id === current)) return current;
        return jobs[0]?.id || '';
      });
    } catch (error: any) {
      setMessage(getReadableErrorMessage(error, 'Failed to load recruiter dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAdminDashboard = useCallback(async () => {
    try {
      const data = await getAdminMonitoring();
      setStats(data);
    } catch (error: any) {
      setMessage(getReadableErrorMessage(error, 'Failed to load admin dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    setLoading(true);
    setMessage(null);

    if (user.role === 'student') {
      void fetchStudentDashboard(false);
      return;
    }
    if (user.role === 'employer') {
      void fetchEmployerDashboard();
      return;
    }
    void fetchAdminDashboard();
  }, [fetchAdminDashboard, fetchEmployerDashboard, fetchStudentDashboard, isAuthenticated, user]);

  const fetchCandidateRanking = useCallback(async (jobId: string) => {
    if (!jobId) {
      setCandidateMatches([]);
      return;
    }
    setLoadingMatches(true);
    try {
      const matches = await getCandidateMatches(jobId, {
        sortBy: candidateSortBy,
        order: candidateSortOrder,
        appliedOnly: showAppliedOnly,
        limit: 24,
      });
      setCandidateMatches(matches || []);
    } catch (error: any) {
      setMessage(getReadableErrorMessage(error, 'Failed to load ranked candidates.'));
      setCandidateMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  }, [candidateSortBy, candidateSortOrder, showAppliedOnly]);

  useEffect(() => {
    if (user?.role !== 'employer') return;
    void fetchCandidateRanking(selectedJobId);
  }, [candidateSortBy, candidateSortOrder, fetchCandidateRanking, selectedJobId, showAppliedOnly, user?.role]);

  const handleCreateJob = async (event: FormEvent) => {
    event.preventDefault();
    if (postingJob) return;

    setPostingJob(true);
    setMessage(null);
    try {
      await createJob(jobForm);
      setJobForm({
        title: '',
        company: '',
        description: '',
        location: '',
        requirements: '',
        experienceLevel: 'mid',
        jobType: 'full_time',
      });
      setMessage('Job posted successfully.');
      await fetchEmployerDashboard();
    } catch (error: any) {
      setMessage(getReadableErrorMessage(error, 'Failed to create job.'));
    } finally {
      setPostingJob(false);
    }
  };

  const topCandidateMatches = useMemo(() => {
    return [...candidateMatches].slice(0, 8);
  }, [candidateMatches]);

  if (isLoading || loading) {
    return <DashboardSkeleton />;
  }

  if (!user) return null;

  if (user.role === 'student') {
    return (
      <>
        {message && (
          <div className="layout-container pt-8">
            <div className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-800">
              {message}
            </div>
          </div>
        )}
        <StudentUpskillingHub
          recommendations={recommendations}
          onRefresh={() => fetchStudentDashboard(true)}
        />
      </>
    );
  }

  if (user.role === 'employer') {
    return (
      <div className="layout-container section-spacing space-y-12">
        <section>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-3 tracking-tight">Recruiter Command Center</h1>
          <p className="text-lg font-sans text-secondary font-light">AI-assisted hiring with ranked candidate insights and job-level analytics.</p>
        </section>

        {message && (
          <div className="rounded-2xl border-[0.5px] border-accent/20 bg-accent/5 px-6 py-4 text-sm font-sans font-medium text-accent shadow-sm">
            {message}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card hoverable={false} className="p-5 text-center">
            <p className="text-xs uppercase tracking-[0.12em] text-secondary mb-1">Posted Jobs</p>
            <p className="text-3xl font-semibold text-primary">{recruiterOverview?.postedJobs || 0}</p>
          </Card>
          <Card hoverable={false} className="p-5 text-center">
            <p className="text-xs uppercase tracking-[0.12em] text-secondary mb-1">Active Jobs</p>
            <p className="text-3xl font-semibold text-primary">{recruiterOverview?.activeJobs || 0}</p>
          </Card>
          <Card hoverable={false} className="p-5 text-center">
            <p className="text-xs uppercase tracking-[0.12em] text-secondary mb-1">Total Applicants</p>
            <p className="text-3xl font-semibold text-primary">{recruiterOverview?.totalApplicants || 0}</p>
          </Card>
          <Card hoverable={false} className="p-5 text-center">
            <p className="text-xs uppercase tracking-[0.12em] text-secondary mb-1">Avg Match</p>
            <p className="text-3xl font-semibold text-primary">{recruiterOverview?.averageMatchAcrossJobs || 0}%</p>
          </Card>
        </section>

        <section>
          <div className="glass-panel p-8 max-w-4xl rounded-3xl">
            <h2 className="text-2xl font-serif text-primary mb-6">Post a New Job</h2>
            <form className="space-y-6" onSubmit={handleCreateJob}>
              <Input
                label="Job Title"
                value={jobForm.title}
                onChange={(event) => setJobForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Backend Developer"
                required
              />
              <div className="grid gap-6 md:grid-cols-2">
                <Input
                  label="Company"
                  value={jobForm.company}
                  onChange={(event) => setJobForm((prev) => ({ ...prev, company: event.target.value }))}
                  placeholder="EsenceLab"
                  required
                />
                <Input
                  label="Location"
                  value={jobForm.location}
                  onChange={(event) => setJobForm((prev) => ({ ...prev, location: event.target.value }))}
                  placeholder="Remote / Kochi (optional)"
                />
              </div>
              <div className="relative pt-2">
                <label className="absolute left-4 transition-all duration-200 pointer-events-none text-[10px] uppercase tracking-widest px-1 bg-transparent text-secondary z-10 -top-1 font-bold">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={jobForm.description}
                  onChange={(event) =>
                    setJobForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  className="w-full rounded-2xl border-[0.5px] border-border bg-white/50 px-4 py-4 font-sans text-primary text-base transition-all focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent shadow-inner relative z-0 appearance-none"
                  placeholder="What outcomes should this hire deliver?"
                  required
                />
              </div>
              <div className="relative pt-2">
                <label className="absolute left-4 transition-all duration-200 pointer-events-none text-[10px] uppercase tracking-widest px-1 bg-transparent text-secondary z-10 -top-1 font-bold">
                  Required Skills (comma separated)
                </label>
                <textarea
                  rows={3}
                  value={jobForm.requirements}
                  onChange={(event) =>
                    setJobForm((prev) => ({ ...prev, requirements: event.target.value }))
                  }
                  className="w-full rounded-2xl border-[0.5px] border-border bg-white/50 px-4 py-4 font-sans text-primary text-base transition-all focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent shadow-inner relative z-0 appearance-none"
                  placeholder="Node.js, Express, SQL"
                  required
                />
              </div>
              <div className="relative pt-2 max-w-xs">
                <label className="absolute left-4 transition-all duration-200 pointer-events-none text-[10px] uppercase tracking-widest px-1 bg-transparent text-secondary z-10 -top-1 font-bold">
                  Experience Level
                </label>
                <select
                  value={jobForm.experienceLevel}
                  onChange={(event) =>
                    setJobForm((prev) => ({
                      ...prev,
                      experienceLevel: event.target.value as 'entry' | 'junior' | 'mid' | 'senior' | 'lead',
                    }))
                  }
                  className="w-full rounded-2xl border-[0.5px] border-border bg-white/50 px-4 py-4 font-sans text-primary text-base transition-all focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent shadow-sm relative z-0 appearance-none"
                >
                  <option value="entry">Entry</option>
                  <option value="junior">Junior</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                </select>
              </div>
              <div className="relative pt-2 max-w-xs">
                <label className="absolute left-4 transition-all duration-200 pointer-events-none text-[10px] uppercase tracking-widest px-1 bg-transparent text-secondary z-10 -top-1 font-bold">
                  Employment Type
                </label>
                <select
                  value={jobForm.jobType}
                  onChange={(event) =>
                    setJobForm((prev) => ({
                      ...prev,
                      jobType: event.target.value as 'full_time' | 'part_time' | 'internship' | 'contract',
                    }))
                  }
                  className="w-full rounded-2xl border-[0.5px] border-border bg-white/50 px-4 py-4 font-sans text-primary text-base transition-all focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent shadow-sm relative z-0 appearance-none"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="internship">Internship</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
              <Button type="submit" isLoading={postingJob} className="w-full justify-center h-12 rounded-full font-serif text-lg bg-primary text-white hover:bg-black/80 transition-all">
                <PlusCircle className="mr-2 h-5 w-5" />
                Deploy Job Profile
              </Button>
            </form>
          </div>
        </section>

        <section>
          <div className="glass-panel p-8 rounded-3xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-serif text-primary">Candidate Ranking Summary</h2>
              <Button variant="outline" size="sm" onClick={() => router.push('/jobs/new')}>
                Quick Post Job <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <div className="mb-8 grid gap-4 md:grid-cols-4">
              <div className="relative pt-2 md:col-span-2">
                <label className="absolute left-4 transition-all duration-200 pointer-events-none text-[10px] uppercase tracking-widest px-1 bg-transparent text-secondary z-10 -top-1 font-bold">Select Active Job</label>
                <select
                  value={selectedJobId}
                  onChange={(event) => setSelectedJobId(event.target.value)}
                  className="w-full rounded-2xl border-[0.5px] border-border bg-white/50 px-4 py-4 font-sans text-primary text-base transition-all focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent shadow-sm relative z-0 appearance-none"
                >
                  {employerJobs.length === 0 && <option value="">No active jobs</option>}
                  {employerJobs.map((job) => (
                    <option key={job.id} value={job.id} className="text-primary bg-white">
                      {job.title} - {job.company}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-[60%] -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="relative pt-2">
                <label className="absolute left-4 transition-all duration-200 pointer-events-none text-[10px] uppercase tracking-widest px-1 bg-transparent text-secondary z-10 -top-1 font-bold">Sort By</label>
                <select
                  value={candidateSortBy}
                  onChange={(event) =>
                    setCandidateSortBy(event.target.value as 'match' | 'resume' | 'experience')
                  }
                  className="w-full rounded-2xl border-[0.5px] border-border bg-white/50 px-4 py-4 font-sans text-primary text-base transition-all focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent shadow-sm relative z-0 appearance-none"
                >
                  <option value="match">Highest Match %</option>
                  <option value="resume">Resume Score</option>
                  <option value="experience">Experience</option>
                </select>
              </div>
              <div className="relative pt-2">
                <label className="absolute left-4 transition-all duration-200 pointer-events-none text-[10px] uppercase tracking-widest px-1 bg-transparent text-secondary z-10 -top-1 font-bold">Order</label>
                <select
                  value={candidateSortOrder}
                  onChange={(event) => setCandidateSortOrder(event.target.value as 'asc' | 'desc')}
                  className="w-full rounded-2xl border-[0.5px] border-border bg-white/50 px-4 py-4 font-sans text-primary text-base transition-all focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent shadow-sm relative z-0 appearance-none"
                >
                  <option value="desc">High to Low</option>
                  <option value="asc">Low to High</option>
                </select>
              </div>
            </div>
            <div className="mb-8">
              <label className="inline-flex items-center gap-2 text-sm text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAppliedOnly}
                  onChange={(event) => setShowAppliedOnly(event.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Show only applicants who have applied
              </label>
            </div>

            {loadingMatches ? (
              <div className="flex items-center justify-center gap-3 py-16 text-sm font-sans font-medium text-secondary">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
                <span>Running candidate analysis matrix...</span>
              </div>
            ) : topCandidateMatches.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {topCandidateMatches.map((candidate) => {
                  const topSkills = (candidate.topSkills || candidate.matchedSkills || candidate.skills || []).slice(0, 3);
                  const match = scoreToPercent(candidate.matchScore);
                  return (
                    <div
                      key={candidate.candidateId}
                      className="p-6 rounded-2xl border-[0.5px] border-border bg-white/60 hover:bg-white transition-all shadow-sm hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between"
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <p className="text-xl font-serif font-bold text-primary">{candidate.name}</p>
                          <p className="text-xs text-secondary">{candidate.email}</p>
                        </div>
                        <Badge variant={match > 75 ? 'success' : match > 50 ? 'warning' : 'secondary'} className="font-sans font-semibold tracking-wide uppercase text-[10px] px-2 py-1">
                          {match}% Match
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-lg border border-border bg-white/80 px-2 py-1.5 text-secondary">
                            Resume Score: <span className="font-semibold text-primary">{candidate.resumeScore}%</span>
                          </div>
                          <div className="rounded-lg border border-border bg-white/80 px-2 py-1.5 text-secondary">
                            Experience: <span className="font-semibold text-primary">{candidate.experienceYears} yrs</span>
                          </div>
                        </div>
                        <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-secondary mb-2">Detected Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {topSkills.map(skill => (
                            <span key={skill} className="px-2 py-1 text-[10px] font-semibold bg-primary/5 text-primary border-[0.5px] border-border rounded-md uppercase tracking-wider">
                              {skill}
                            </span>
                          ))}
                        </div>
                        {candidate.missingSkills?.length > 0 && (
                          <p className="text-xs text-secondary">
                            Missing: {candidate.missingSkills.slice(0, 3).join(', ')}
                          </p>
                        )}
                        {candidate.hasApplied && (
                          <Badge variant="secondary" className="w-fit">
                            Applied • {candidate.applicationStatus || 'pending'}
                          </Badge>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push(`/applicants/${candidate.candidateId}?jobId=${selectedJobId}`)}
                        className="mt-4 w-full rounded-xl border-[0.5px] border-border px-3 py-2 text-xs font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-black/5"
                      >
                        View Profile
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-lg font-sans font-light text-secondary">
                  No ranked candidates available for the selected job.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card hoverable={false} className="p-6 space-y-4">
            <h2 className="text-2xl font-serif text-primary">Top Performing Candidates</h2>
            {recruiterOverview?.topCandidates?.length ? (
              <div className="space-y-3">
                {recruiterOverview.topCandidates.slice(0, 5).map((candidate) => (
                  <div key={`${candidate.studentId}-${candidate.jobId}`} className="rounded-xl border border-border bg-white/70 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-primary">{candidate.name}</p>
                        <p className="text-xs text-secondary">{candidate.jobTitle}</p>
                      </div>
                      <Badge variant="success">{scoreToPercent(candidate.matchScore)}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-secondary">Top candidates appear after applications or ranking activity.</p>
            )}
          </Card>

          <Card hoverable={false} className="p-6 space-y-4">
            <h2 className="text-2xl font-serif text-primary">Job Analytics</h2>
            {recruiterOverview?.perJobAnalytics?.length ? (
              <div className="space-y-3">
                {recruiterOverview.perJobAnalytics.slice(0, 4).map((entry) => (
                  <div key={entry.jobId} className="rounded-xl border border-border bg-white/70 p-3 space-y-1">
                    <p className="text-sm font-semibold text-primary">{entry.title}</p>
                    <p className="text-xs text-secondary">
                      Applicants: {entry.totalApplicants} • Avg match: {entry.averageMatch}% • Highest: {entry.highestMatchCandidate?.matchScore || 0}%
                    </p>
                    {entry.mostMissingSkill && (
                      <p className="text-xs text-secondary">
                        Most missing skill: <span className="font-semibold text-primary">{entry.mostMissingSkill.skill}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-secondary">Post jobs and collect applications to unlock analytics.</p>
            )}
            {recruiterOverview?.skillDemandInsights?.length ? (
              <div className="pt-2">
                <p className="text-xs uppercase tracking-[0.12em] text-secondary mb-2">Skill demand insights</p>
                <div className="flex flex-wrap gap-2">
                  {recruiterOverview.skillDemandInsights.slice(0, 5).map((entry) => (
                    <span key={entry.skill} className="rounded-full border border-border bg-white px-2.5 py-1 text-[11px] text-secondary">
                      {entry.skill} ({entry.count})
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        </section>
      </div>
    );
  }

  return (
    <div className="layout-container section-spacing space-y-10">
      <section>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-3 tracking-tight">System Control Center</h1>
        <p className="text-lg font-sans text-secondary font-light">Platform governance, moderation, and health telemetry.</p>
      </section>

      {message && (
        <div className="rounded-2xl border-[0.5px] border-gray-300 bg-gray-100/50 px-6 py-4 text-sm font-sans font-medium text-gray-800 shadow-sm">
          {message}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card hoverable={false} className="p-5 text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-secondary mb-1">Total Users</p>
          <p className="text-3xl font-semibold text-primary">{stats?.totalUsers || 0}</p>
          <p className="text-xs text-secondary mt-1">Students {stats?.totalStudents || 0} • Recruiters {stats?.totalRecruiters || 0}</p>
        </Card>
        <Card hoverable={false} className="p-5 text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-secondary mb-1">Resumes</p>
          <p className="text-3xl font-semibold text-primary">{stats?.totalResumes || 0}</p>
          <p className="text-xs text-secondary mt-1">Avg score {stats?.averageResumeScore || 0}%</p>
        </Card>
        <Card hoverable={false} className="p-5 text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-secondary mb-1">Jobs</p>
          <p className="text-3xl font-semibold text-primary">{stats?.totalJobs || 0}</p>
          <p className="text-xs text-secondary mt-1">Active {stats?.activeJobs || 0} • Closed {stats?.closedJobs || 0}</p>
        </Card>
        <Card hoverable={false} className="p-5 text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-secondary mb-1">Applications</p>
          <p className="text-3xl font-semibold text-primary">{stats?.totalApplications || 0}</p>
          <p className="text-xs text-secondary mt-1">Avg match {stats?.averageMatchPercentage || 0}%</p>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card hoverable={false} className="p-6 space-y-4">
          <h2 className="text-xl font-serif text-primary">Resume Monitoring</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-white p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-secondary">Parsed</p>
              <p className="mt-1 text-xl font-semibold text-primary">{stats?.resumeMonitoring?.successfulParses || 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-secondary">Failed</p>
              <p className="mt-1 text-xl font-semibold text-primary">{stats?.resumeMonitoring?.failedParses || 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-secondary">Flagged</p>
              <p className="mt-1 text-xl font-semibold text-primary">{stats?.resumeMonitoring?.flaggedResumes || 0}</p>
            </div>
          </div>
          <p className="text-sm text-secondary">
            Most applied role: {stats?.mostAppliedJob ? `${stats.mostAppliedJob.title} (${stats.mostAppliedJob.applications})` : 'No applications yet'}
          </p>
        </Card>

        <Card hoverable={false} className="p-6 space-y-4">
          <h2 className="text-xl font-serif text-primary">Platform Health</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-border bg-white p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-secondary">Uptime</p>
              <p className="mt-1 font-semibold text-primary">{formatUptime(stats?.platformHealth?.uptimeSeconds || 0)}</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-secondary">AI Service</p>
              <p className="mt-1 font-semibold text-primary">{stats?.platformHealth?.aiService?.status || 'unknown'}</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-secondary">API Error Rate</p>
              <p className="mt-1 font-semibold text-primary">{stats?.platformHealth?.apiErrorRate || 0}%</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-secondary">Auth Failures</p>
              <p className="mt-1 font-semibold text-primary">{stats?.platformHealth?.authFailures || 0}</p>
            </div>
          </div>
          {stats?.platformHealth?.slowEndpoints?.length ? (
            <div className="space-y-2">
              {stats.platformHealth.slowEndpoints.slice(0, 3).map((entry) => (
                <div key={entry.endpoint} className="rounded-lg border border-border bg-white p-2 text-xs text-secondary">
                  <span className="font-semibold text-primary">{entry.endpoint}</span> • avg {entry.avgDurationMs}ms
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-secondary">No slow endpoints detected.</p>
          )}
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card hoverable={false} className="p-6 space-y-4">
          <h2 className="text-xl font-serif text-primary">Application Status</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-white p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-secondary">Pending</p>
              <p className="mt-1 text-xl font-semibold text-primary">{stats?.applicationSummary?.byStatus?.pending || 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-secondary">Shortlisted</p>
              <p className="mt-1 text-xl font-semibold text-primary">{stats?.applicationSummary?.byStatus?.shortlisted || 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-secondary">Interview</p>
              <p className="mt-1 text-xl font-semibold text-primary">{stats?.applicationSummary?.byStatus?.interview || 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-secondary">Rejected</p>
              <p className="mt-1 text-xl font-semibold text-primary">{stats?.applicationSummary?.byStatus?.rejected || 0}</p>
            </div>
          </div>
        </Card>

        <Card hoverable={false} className="p-6 space-y-4">
          <h2 className="text-xl font-serif text-primary">Recent Admin Actions</h2>
          {stats?.recentAdminActions?.length ? (
            <div className="space-y-2">
              {stats.recentAdminActions.slice(0, 6).map((entry) => (
                <div key={entry.id} className="rounded-lg border border-border bg-white p-2 text-xs text-secondary">
                  <span className="font-semibold text-primary">{entry.actionType}</span> • {entry.targetType} • {new Date(entry.createdAt).toLocaleString()}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-secondary">No admin actions recorded yet.</p>
          )}
        </Card>
      </section>
    </div>
  );
}

