'use client';

/**
 * Admin users page.
 *
 * This page gives admins a searchable interface for viewing, updating,
 * deactivating, and deleting user accounts.
 */
import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { getAdminUsers, getReadableErrorMessage } from '@/lib/dashboardApi';
import { PaginationMeta, User } from '@/types';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import { Users, Search, Trash2 } from 'lucide-react';
import { useRoleAccess } from '@/lib/useRoleAccess';

const EMPTY_META: PaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

export default function UsersPage() {
  const { hasAllowedRole } = useRoleAccess({ allowedRoles: ['admin'] });
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'email' | 'role' | 'applications' | 'jobs' | 'resumeScore'>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!hasAllowedRole) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const result = await getAdminUsers({
        page,
        limit: 12,
        search: searchTerm || undefined,
        role: roleFilter || undefined,
        sortBy,
        order,
      });
      setUsers(result.data || []);
      setMeta(result.meta || EMPTY_META);
    } catch (err: any) {
      setUsers([]);
      setMeta(EMPTY_META);
      setError(getReadableErrorMessage(err, 'Failed to load users.'));
    } finally {
      setLoading(false);
    }
  }, [hasAllowedRole, order, page, roleFilter, searchTerm, sortBy]);

  useEffect(() => {
    if (!hasAllowedRole) return;
    void fetchUsers();
  }, [fetchUsers, hasAllowedRole]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, roleFilter, sortBy, order]);

  const handleDelete = async (userId: string) => {
    const ok = window.confirm('Delete this user and related data?');
    if (!ok) return;
    try {
      setError(null);
      await api.delete(`/users/${userId}`);
      await fetchUsers();
    } catch (err: any) {
      setError(getReadableErrorMessage(err, 'Failed to delete user.'));
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setError(null);
      await api.put(`/users/${userId}`, { isActive: !currentStatus });
      await fetchUsers();
    } catch (err: any) {
      setError(getReadableErrorMessage(err, 'Failed to update user status.'));
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'primary' | 'success' | 'warning'> = {
      admin: 'warning',
      employer: 'success',
      student: 'primary',
    };
    return <Badge variant={variants[role] || 'secondary'}>{role}</Badge>;
  };

  if (loading) {
    return <Loading text="Checking admin access..." />;
  }

  if (!hasAllowedRole) return null;

  const pageStart = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const pageEnd = meta.total === 0 ? 0 : Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="layout-container section-spacing space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-black">User Management</h1>
        <p className="text-secondary">Moderate accounts and platform access</p>
      </div>

      {error && (
        <Card hoverable={false} className="border border-gray-300 bg-gray-100 p-4 text-sm text-gray-800">
          {error}
        </Card>
      )}

      <Card>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5 mb-5">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="field-3d w-full rounded-xl py-2.5 pl-10 pr-4 focus:outline-none"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="field-3d rounded-xl px-4 py-2.5 focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="employer">Recruiter</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as 'createdAt' | 'name' | 'email' | 'role' | 'applications' | 'jobs' | 'resumeScore')}
            className="field-3d rounded-xl px-4 py-2.5 focus:outline-none"
          >
            <option value="createdAt">Sort by Join Date</option>
            <option value="name">Sort by Name</option>
            <option value="email">Sort by Email</option>
            <option value="role">Sort by Role</option>
            <option value="applications">Sort by Applications</option>
            <option value="jobs">Sort by Jobs</option>
            <option value="resumeScore">Sort by Resume Score</option>
          </select>
          <select
            value={order}
            onChange={(event) => setOrder(event.target.value as 'asc' | 'desc')}
            className="field-3d rounded-xl px-4 py-2.5 focus:outline-none"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        {users.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-secondary">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary">Resume</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary">Applications</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary">Jobs</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary">Joined</th>
                    <th className="text-right py-3 px-4 font-medium text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((entry) => (
                    <tr key={entry.id} className="border-b border-border hover:bg-black/5">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-black/5 rounded-full flex items-center justify-center">
                            <span className="text-black text-sm font-medium">
                              {entry.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <span className="font-medium text-black">{entry.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-secondary">{entry.email}</td>
                      <td className="py-3 px-4">{getRoleBadge(entry.role)}</td>
                      <td className="py-3 px-4 text-secondary text-sm">
                        {entry.resumeUploaded ? `${Math.round(entry.latestResumeScore || 0)}%` : 'No'}
                      </td>
                      <td className="py-3 px-4 text-secondary text-sm">{entry.totalApplications || 0}</td>
                      <td className="py-3 px-4 text-secondary text-sm">{entry.totalJobsPosted || 0}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStatus(entry.id, !!entry.isActive)}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            entry.isActive ? 'bg-gray-200 text-gray-800' : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {entry.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-secondary text-sm">
                        {new Date(entry.createdAt || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-2 hover:bg-gray-100 rounded text-gray-600"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-secondary">
                Showing {pageStart}-{pageEnd} of {meta.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={meta.page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <p className="text-sm text-secondary">
                  Page {meta.page} / {Math.max(1, meta.totalPages)}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-secondary/70 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">No users found</h3>
            <p className="text-secondary">Try adjusting search or filters</p>
          </div>
        )}
      </Card>
    </div>
  );
}

