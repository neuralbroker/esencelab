'use client';

/**
 * Applicant detail page.
 *
 * This page shows the structured profile for one candidate, including resume
 * insights, match breakdowns, and recruiter-side review actions.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Loading from '@/components/Loading';
import { Skeleton } from '@/components/Skeleton';
import { Job } from '@/types';
import { getEmployerJobs, getReadableErrorMessage } from '@/lib/dashboardApi';
import { useRoleAccess } from '@/lib/useRoleAccess';

interface CandidateProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
  skills: string[];
  education: Array<Record<string, unknown>>;
  experience: Array<Record<string, unknown>>;
  projects?: Array<Record<string, unknown>>;
  parsedData?: Record<string, unknown> | null;
  matchBreakdown?: {
    jobId: string;
    title: string;
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    explanation?: string | null;
    improvementSuggestions?: string[];
  } | null;
  latestResumeScore?: {
    score: number;
    sectionScores?: {
      skills?: number;
      projects?: number;
      experience?: number;
      education?: number;
    };
  } | null;
}

const toPercent = (value: unknown) => {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n <= 1 ? Math.round(n * 100) : Math.round(n)));
};

const summarizeRecord = (value: Record<string, unknown>) => {
  const parts = Object.entries(value || {})
    .filter(([, entryValue]) => entryValue !== null && entryValue !== undefined && String(entryValue).trim() !== '')
    .map(([key, entryValue]) => `${key}: ${typeof entryValue === 'object' ? JSON.stringify(entryValue) : String(entryValue)}`);
  return parts.join(' | ');
};

export default function ApplicantProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, hasAllowedRole, isCheckingAccess } = useRoleAccess({ allowedRoles: ['employer', 'admin'] });
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialJobId = searchParams.get('jobId') || '';
    if (initialJobId) setSelectedJobId(initialJobId);
  }, [searchParams]);

  useEffect(() => {
    if (!hasAllowedRole || !user) return;

    const loadJobs = async () => {
      try {
        const roleJobs =
          user?.role === 'employer'
            ? await getEmployerJobs()
            : ((await api.get('/jobs?status=active')).data.data?.jobs || []);
        setJobs(roleJobs || []);
        setSelectedJobId((current) => current || roleJobs?.[0]?.id || '');
      } catch {
        setJobs([]);
      }
    };

    void loadJobs();
  }, [hasAllowedRole, user]);

  const loadProfile = useCallback(async () => {
    if (!id || !hasAllowedRole || !user) return;

    setLoading(true);
    setError(null);
    try {
      const query = selectedJobId ? `?jobId=${encodeURIComponent(selectedJobId)}` : '';
      const res = await api.get(`/candidates/${id}${query}`);
      setProfile(res.data.data || null);
    } catch (err: any) {
      setError(getReadableErrorMessage(err, 'Failed to load candidate profile.'));
    } finally {
      setLoading(false);
    }
  }, [hasAllowedRole, id, selectedJobId, user]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const sectionScores = useMemo(() => {
    return {
      skills: toPercent(profile?.latestResumeScore?.sectionScores?.skills),
      projects: toPercent(profile?.latestResumeScore?.sectionScores?.projects),
      experience: toPercent(profile?.latestResumeScore?.sectionScores?.experience),
      education: toPercent(profile?.latestResumeScore?.sectionScores?.education),
    };
  }, [profile?.latestResumeScore?.sectionScores]);

  if (isCheckingAccess) {
    return <Loading text="Checking candidate profile access..." />;
  }

  if (loading) {
    return (
      <div className="layout-container section-spacing space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (!hasAllowedRole || !user) return null;

  if (error) {
    return (
      <div className="layout-container section-spacing max-w-5xl mx-auto">
        <Card hoverable={false} className="p-6 text-gray-800 bg-gray-100 border-gray-300">
          {error}
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="layout-container section-spacing max-w-5xl mx-auto">
        <Card hoverable={false} className="p-6 text-secondary">
          Candidate not found.
        </Card>
      </div>
    );
  }

  return (
    <div className="layout-container section-spacing space-y-6 max-w-5xl mx-auto">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">{profile.name}</h1>
        <p className="text-secondary">{profile.email}</p>
      </section>

      <Card hoverable={false} className="p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-secondary">Match For Job</label>
            <select
              value={selectedJobId}
              onChange={(event) => setSelectedJobId(event.target.value)}
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
            >
              <option value="">No specific job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} - {job.company}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            {profile.matchBreakdown ? (
              <div className="rounded-xl border border-border bg-white/70 px-3 py-2 text-sm text-secondary w-full">
                Match: <span className="font-semibold text-primary">{Math.round(profile.matchBreakdown.matchScore || 0)}%</span>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-white/70 px-3 py-2 text-sm text-secondary w-full">
                Select a job to view match breakdown.
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card hoverable={false} className="p-6 space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">Role: {profile.role || 'Candidate'}</Badge>
          {profile.latestResumeScore && (
            <Badge variant="success">Resume Score: {toPercent(profile.latestResumeScore.score)}%</Badge>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-primary mb-3">Top Skills</h2>
          <div className="flex flex-wrap gap-2">
            {(profile.skills || []).map((skill) => (
              <span
                key={skill}
                className="rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-primary"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {profile.matchBreakdown && (
        <Card hoverable={false} className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-primary">Skill Match Breakdown</h2>
          <p className="text-sm text-secondary">
            {profile.matchBreakdown.title} | {Math.round(profile.matchBreakdown.matchScore || 0)}% match
          </p>
          {profile.matchBreakdown.matchedSkills?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-secondary mb-2">Matching skills</p>
              <div className="flex flex-wrap gap-2">
                {profile.matchBreakdown.matchedSkills.slice(0, 8).map((skill) => (
                  <span key={`matched-${skill}`} className="rounded-md border border-gray-300 bg-gray-100 px-2 py-1 text-xs text-gray-800">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          {profile.matchBreakdown.missingSkills?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-secondary mb-2">Missing skills</p>
              <div className="flex flex-wrap gap-2">
                {profile.matchBreakdown.missingSkills.slice(0, 8).map((skill) => (
                  <span key={`missing-${skill}`} className="rounded-md border border-gray-300 bg-gray-100 px-2 py-1 text-xs text-gray-800">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          {profile.matchBreakdown.improvementSuggestions?.length ? (
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-secondary mb-2">Improvement suggestions</p>
              <div className="space-y-2">
                {profile.matchBreakdown.improvementSuggestions.slice(0, 3).map((item) => (
                  <p key={item} className="rounded-lg border border-border bg-white p-2 text-sm text-secondary">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      )}

      <Card hoverable={false} className="p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Resume Score Breakdown</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {Object.entries(sectionScores).map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border bg-white p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-secondary">{label}</p>
              <p className="mt-1 text-xl font-semibold text-primary">{value}%</p>
            </div>
          ))}
        </div>
      </Card>

      <Card hoverable={false} className="p-6">
        <h2 className="text-lg font-semibold text-primary mb-3">Experience Highlights</h2>
        {profile.experience?.length ? (
          <div className="space-y-2">
            {profile.experience.slice(0, 6).map((item, index) => (
              <div key={`${index}`} className="rounded-lg border border-border bg-white p-3 text-sm text-secondary leading-relaxed">
                {summarizeRecord(item)}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-secondary">No experience entries available.</p>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card hoverable={false} className="p-6">
          <h2 className="text-lg font-semibold text-primary mb-3">Education</h2>
          {profile.education?.length ? (
            <div className="space-y-2">
              {profile.education.slice(0, 6).map((item, index) => (
                <div key={`${index}`} className="rounded-lg border border-border bg-white p-3 text-sm text-secondary leading-relaxed">
                  {summarizeRecord(item)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-secondary">No education entries available.</p>
          )}
        </Card>
        <Card hoverable={false} className="p-6">
          <h2 className="text-lg font-semibold text-primary mb-3">Projects</h2>
          {profile.projects?.length ? (
            <div className="space-y-2">
              {profile.projects.slice(0, 6).map((item, index) => (
                <div key={`${index}`} className="rounded-lg border border-border bg-white p-3 text-sm text-secondary leading-relaxed">
                  {summarizeRecord(item)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-secondary">No projects available.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
