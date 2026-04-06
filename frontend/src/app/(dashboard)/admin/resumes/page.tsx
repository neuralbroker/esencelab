'use client';

/**
 * Admin resume monitoring page.
 *
 * This page helps admins inspect parsing results, find suspicious uploads,
 * and apply moderation actions such as review, flag, or delete.
 */
import { useCallback, useEffect, useState } from 'react';
import { AdminResumeRecord } from '@/types';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import Loading from '@/components/Loading';
import {
  deleteAdminResume,
  getAdminResumes,
  getReadableErrorMessage,
  moderateAdminResume,
} from '@/lib/dashboardApi';
import { useRoleAccess } from '@/lib/useRoleAccess';

export default function AdminResumesPage() {
  const { hasAllowedRole } = useRoleAccess({ allowedRoles: ['admin'] });
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AdminResumeRecord[]>([]);
  const [summary, setSummary] = useState({ total: 0, success: 0, failed: 0, flagged: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [parseStatus, setParseStatus] = useState<'success' | 'failed' | ''>('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!hasAllowedRole) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const result = await getAdminResumes({
        page,
        limit: 12,
        search: search || undefined,
        parseStatus: parseStatus || undefined,
        flaggedOnly,
        sortBy: 'updatedAt',
        order: 'desc',
      });
      setRecords(result.data || []);
      setSummary(result.summary || { total: 0, success: 0, failed: 0, flagged: 0 });
      setTotalPages(result.meta?.totalPages || 0);
    } catch (err: any) {
      setError(getReadableErrorMessage(err, 'Failed to load resumes.'));
      setRecords([]);
      setSummary({ total: 0, success: 0, failed: 0, flagged: 0 });
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [flaggedOnly, hasAllowedRole, page, parseStatus, search]);

  useEffect(() => {
    if (!hasAllowedRole) return;
    void fetchData();
  }, [fetchData, hasAllowedRole]);

  useEffect(() => {
    setPage(1);
  }, [search, parseStatus, flaggedOnly]);

  const handleModeration = async (resumeId: string, status: 'clean' | 'flagged' | 'review') => {
    try {
      setError(null);
      await moderateAdminResume(resumeId, {
        status,
        notes: status === 'flagged' ? 'Flagged by admin moderation.' : '',
      });
      await fetchData();
    } catch (err: any) {
      setError(getReadableErrorMessage(err, 'Failed to update moderation status.'));
    }
  };

  const handleDelete = async (resumeId: string) => {
    const ok = window.confirm('Delete this resume from the platform?');
    if (!ok) return;
    try {
      setError(null);
      await deleteAdminResume(resumeId);
      await fetchData();
    } catch (err: any) {
      setError(getReadableErrorMessage(err, 'Failed to delete resume.'));
    }
  };

  if (loading) {
    return <Loading text="Checking admin resume access..." />;
  }

  if (!hasAllowedRole) return null;

  return (
    <div className="layout-container section-spacing space-y-8 max-w-7xl mx-auto">
      <div className="max-w-3xl space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Resume Monitoring</h1>
        <p className="text-secondary">Review parsing quality, inspect flagged uploads, and moderate student resumes.</p>
      </div>

      {error && (
        <Card hoverable={false} className="border border-gray-300 bg-gray-100 p-4 text-sm text-gray-800">
          {error}
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <Card hoverable={false} className="p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-secondary">Total</p>
          <p className="text-2xl font-semibold text-primary">{summary.total}</p>
        </Card>
        <Card hoverable={false} className="p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-secondary">Parsed</p>
          <p className="text-2xl font-semibold text-primary">{summary.success}</p>
        </Card>
        <Card hoverable={false} className="p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-secondary">Failed</p>
          <p className="text-2xl font-semibold text-primary">{summary.failed}</p>
        </Card>
        <Card hoverable={false} className="p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-secondary">Flagged</p>
          <p className="text-2xl font-semibold text-primary">{summary.flagged}</p>
        </Card>
      </section>

      <Card hoverable={false} className="space-y-5 p-5 sm:p-6">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, skill..."
            className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary md:col-span-2"
          />
          <select
            value={parseStatus}
            onChange={(event) => setParseStatus(event.target.value as 'success' | 'failed' | '')}
            className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Parse States</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
          <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-secondary">
            <input
              type="checkbox"
              checked={flaggedOnly}
              onChange={(event) => setFlaggedOnly(event.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Flagged only
          </label>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 text-left text-sm font-medium text-secondary">Student</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-secondary">Resume</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-secondary">Parse</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-secondary">Score</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-secondary">Flags</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-secondary">Moderation</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-secondary">Updated</th>
                <th className="py-3 px-4 text-right text-sm font-medium text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((resume) => (
                <tr key={resume.id} className="border-b border-border">
                  <td className="py-3 px-4 text-sm">
                    <p className="font-medium text-primary">{resume.student?.name || 'Unknown'}</p>
                    <p className="text-secondary">{resume.student?.email || '-'}</p>
                  </td>
                  <td className="py-3 px-4 text-sm text-secondary">{resume.fileName}</td>
                  <td className="py-3 px-4">
                    <Badge variant={resume.parseStatus === 'success' ? 'success' : 'warning'}>
                      {resume.parseStatus}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-secondary">{Math.round(resume.resumeScore || 0)}%</td>
                  <td className="py-3 px-4 text-xs text-secondary">
                    {resume.flags.length ? resume.flags.slice(0, 2).join(', ') : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={resume.moderationStatus === 'flagged' ? 'error' : resume.moderationStatus === 'review' ? 'warning' : 'secondary'}>
                      {resume.moderationStatus}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-secondary">
                    {new Date(resume.updatedAt || resume.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleModeration(resume.id, 'clean')}>
                        Clean
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleModeration(resume.id, 'review')}>
                        Review
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleModeration(resume.id, 'flagged')} className="text-gray-800 hover:bg-gray-100">
                        Flag
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(resume.id)} className="text-gray-700 hover:bg-gray-100">
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-secondary">
                    No resumes matched the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-end">
          <p className="text-sm text-secondary sm:mr-auto">
            Showing {records.length} resume{records.length === 1 ? '' : 's'} on this page
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </Button>
          <p className="text-sm text-secondary">
            Page {page} / {Math.max(1, totalPages)}
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      </Card>
    </div>
  );
}

