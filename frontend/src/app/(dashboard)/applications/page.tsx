'use client';

/**
 * Student application tracker page.
 *
 * This page combines saved jobs, submitted applications, notes, and status
 * updates so students can manage their job pipeline in one place.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Application, JobTrackerData } from '@/types';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import { AlertCircle, Bookmark, Briefcase, Loader2, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/Skeleton';
import {
  deleteTrackedApplication,
  getJobTracker,
  getReadableErrorMessage,
  removeSavedJob,
  updateTrackedApplication,
} from '@/lib/dashboardApi';
import { useRoleAccess } from '@/lib/useRoleAccess';

const TRACKER_STATUS_OPTIONS: Array<{ value: 'applied' | 'interviewing' | 'offer' | 'rejected'; label: string }> = [
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
];

const toTrackerStatus = (application: Application): 'applied' | 'interviewing' | 'offer' | 'rejected' => {
  if (application.trackerStatus) return application.trackerStatus;
  const status = String(application.status || '').toLowerCase();
  if (status === 'pending' || status === 'applied') return 'applied';
  if (status === 'interview' || status === 'interviewing') return 'interviewing';
  if (status === 'shortlisted' || status === 'offer') return 'offer';
  return 'rejected';
};

export default function ApplicationsPage() {
  const { user, hasAllowedRole, isCheckingAccess } = useRoleAccess({ allowedRoles: ['student'] });
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [trackerData, setTrackerData] = useState<JobTrackerData>({
    savedJobs: [],
    applications: [],
    statusCounts: { saved: 0, applied: 0, interviewing: 0, offer: 0, rejected: 0 },
  });
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [statusDraft, setStatusDraft] = useState<Record<string, 'applied' | 'interviewing' | 'offer' | 'rejected'>>(
    {}
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchTracker = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getJobTracker();
      setTrackerData(data);

      const noteMap: Record<string, string> = {};
      const statusMap: Record<string, 'applied' | 'interviewing' | 'offer' | 'rejected'> = {};
      for (const entry of data.applications || []) {
        noteMap[entry.id] = entry.notes || '';
        statusMap[entry.id] = toTrackerStatus(entry);
      }
      setNotesDraft(noteMap);
      setStatusDraft(statusMap);
    } catch (err: any) {
      setError(getReadableErrorMessage(err, 'Failed to load application tracker.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasAllowedRole) return;
    void fetchTracker();
  }, [fetchTracker, hasAllowedRole]);

  const stats = useMemo(() => {
    const counts = trackerData.statusCounts || {
      saved: trackerData.savedJobs.length,
      applied: 0,
      interviewing: 0,
      offer: 0,
      rejected: 0,
    };
    return counts;
  }, [trackerData.savedJobs.length, trackerData.statusCounts]);

  const saveApplicationUpdate = async (applicationId: string) => {
    setBusyKey(`save:${applicationId}`);
    setError(null);
    setSuccess(null);
    try {
      await updateTrackedApplication(applicationId, {
        status: statusDraft[applicationId],
        notes: notesDraft[applicationId] || '',
      });
      setSuccess('Application updated successfully.');
      await fetchTracker();
    } catch (err: any) {
      setError(getReadableErrorMessage(err, 'Failed to update application.'));
    } finally {
      setBusyKey(null);
    }
  };

  const removeApplication = async (applicationId: string) => {
    if (!confirm('Remove this application from your tracker?')) return;
    setBusyKey(`delete:${applicationId}`);
    setError(null);
    setSuccess(null);
    try {
      await deleteTrackedApplication(applicationId);
      setSuccess('Application removed from tracker.');
      await fetchTracker();
    } catch (err: any) {
      setError(getReadableErrorMessage(err, 'Failed to remove application.'));
    } finally {
      setBusyKey(null);
    }
  };

  const unsaveJob = async (jobId: string) => {
    setBusyKey(`unsave:${jobId}`);
    setError(null);
    setSuccess(null);
    try {
      await removeSavedJob(jobId);
      setSuccess('Saved job removed.');
      await fetchTracker();
    } catch (err: any) {
      setError(getReadableErrorMessage(err, 'Failed to remove saved job.'));
    } finally {
      setBusyKey(null);
    }
  };

  if (isCheckingAccess) {
    return <Loading text="Checking application tracker access..." />;
  }

  if (loading) {
    return (
      <div className="layout-container section-spacing space-y-8 max-w-6xl mx-auto">
        <Skeleton className="h-14 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!hasAllowedRole || !user) return null;

  return (
    <div className="layout-container section-spacing space-y-8 max-w-6xl mx-auto">
      <section>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">Application Tracker</h1>
        <p className="text-secondary mt-2">Manage saved jobs, update statuses, and keep recruiter notes organized.</p>
      </section>

      {error && (
        <div className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {success && <div className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-800">{success}</div>}

      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card hoverable className="text-center py-6 px-4">
          <p className="text-3xl font-semibold text-primary mb-1">{stats.saved}</p>
          <p className="text-xs uppercase tracking-wider text-secondary font-medium">Saved</p>
        </Card>
        <Card hoverable className="text-center py-6 px-4">
          <p className="text-3xl font-semibold text-primary mb-1">{stats.applied}</p>
          <p className="text-xs uppercase tracking-wider text-secondary font-medium">Applied</p>
        </Card>
        <Card hoverable className="text-center py-6 px-4">
          <p className="text-3xl font-semibold text-primary mb-1">{stats.interviewing}</p>
          <p className="text-xs uppercase tracking-wider text-secondary font-medium">Interviewing</p>
        </Card>
        <Card hoverable className="text-center py-6 px-4">
          <p className="text-3xl font-semibold text-primary mb-1">{stats.offer}</p>
          <p className="text-xs uppercase tracking-wider text-secondary font-medium">Offer</p>
        </Card>
        <Card hoverable className="text-center py-6 px-4">
          <p className="text-3xl font-semibold text-primary mb-1">{stats.rejected}</p>
          <p className="text-xs uppercase tracking-wider text-secondary font-medium">Rejected</p>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-serif text-primary">Saved Jobs</h2>
        {trackerData.savedJobs.length === 0 ? (
          <Card hoverable={false} className="p-6 text-sm text-secondary">
            No saved jobs yet. Browse roles and save opportunities first.
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {trackerData.savedJobs.map((entry) => (
              <Card key={entry.id} hoverable className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-primary">{entry.job.title}</p>
                    <p className="text-sm text-secondary">{entry.job.company}</p>
                  </div>
                  <Badge variant="secondary">
                    <Bookmark className="mr-1 h-3 w-3" /> Saved
                  </Badge>
                </div>
                <p className="text-sm text-secondary line-clamp-2">{entry.job.description}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => router.push(`/jobs/${entry.job.id}`)}>
                    View Job
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void unsaveJob(entry.jobId)}
                    disabled={busyKey === `unsave:${entry.jobId}`}
                  >
                    {busyKey === `unsave:${entry.jobId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Remove'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-serif text-primary">Tracked Applications</h2>
        {trackerData.applications.length === 0 ? (
          <Card hoverable={false} className="p-6 text-sm text-secondary">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>You have not applied to any jobs yet.</span>
              <Button size="sm" variant="outline" onClick={() => router.push('/jobs')}>
                Browse Jobs
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {trackerData.applications.map((application) => {
              const trackerStatus = statusDraft[application.id] || toTrackerStatus(application);
              const saveBusy = busyKey === `save:${application.id}`;
              const deleteBusy = busyKey === `delete:${application.id}`;

              return (
                <Card key={application.id} hoverable={false} className="p-5 space-y-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-primary">{application.job?.title || 'Job Position'}</p>
                      <p className="text-sm text-secondary">{application.job?.company || '-'} | {application.job?.location || '-'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        <Briefcase className="mr-1 h-3 w-3" />
                        {trackerStatus}
                      </Badge>
                      {application.matchScore !== undefined && (
                        <Badge variant="success">{Math.round(application.matchScore)}% match</Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[220px,1fr] md:items-start">
                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-secondary">Status</label>
                      <select
                        value={trackerStatus}
                        onChange={(event) =>
                          setStatusDraft((prev) => ({
                            ...prev,
                            [application.id]: event.target.value as 'applied' | 'interviewing' | 'offer' | 'rejected',
                          }))
                        }
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                      >
                        {TRACKER_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-secondary">Notes</label>
                      <textarea
                        rows={3}
                        value={notesDraft[application.id] || ''}
                        onChange={(event) =>
                          setNotesDraft((prev) => ({
                            ...prev,
                            [application.id]: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                        placeholder="Add interview notes, recruiter feedback, or follow-up reminders..."
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-secondary">
                      Applied: {new Date(application.appliedAt || application.createdAt || Date.now()).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => void saveApplicationUpdate(application.id)}
                        disabled={saveBusy || deleteBusy}
                      >
                        {saveBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void removeApplication(application.id)}
                        disabled={saveBusy || deleteBusy}
                      >
                        {deleteBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}


