"use client";

/**
 * Admin users page.
 *
 * This page gives admins a searchable interface for viewing, updating,
 * deactivating, and deleting user accounts.
 */
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { getAdminUsers, getReadableErrorMessage } from "@/lib/dashboardApi";
import { PaginationMeta, User } from "@/types";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Loading from "@/components/Loading";
import { Users, Search, Trash2 } from "lucide-react";
import { useRoleAccess } from "@/lib/useRoleAccess";

const EMPTY_META: PaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

export default function UsersPage() {
  const { hasAllowedRole } = useRoleAccess({ allowedRoles: ["admin"] });
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sortBy, setSortBy] = useState<
    | "createdAt"
    | "name"
    | "email"
    | "role"
    | "applications"
    | "jobs"
    | "resumeScore"
  >("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
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
      setError(getReadableErrorMessage(err, "Failed to load users."));
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
    const ok = window.confirm("Delete this user and related data?");
    if (!ok) return;
    try {
      setError(null);
      await api.delete(`/users/${userId}`);
      await fetchUsers();
    } catch (err: any) {
      setError(getReadableErrorMessage(err, "Failed to delete user."));
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setError(null);
      await api.put(`/users/${userId}`, { isActive: !currentStatus });
      await fetchUsers();
    } catch (err: any) {
      setError(getReadableErrorMessage(err, "Failed to update user status."));
    }
  };

  const getRoleBadge = (role: string) => {
    const displayRole = role === "employer" ? "recruiter" : role;
    const variants: Record<string, "primary" | "success" | "warning"> = {
      admin: "warning",
      employer: "success",
      recruiter: "success",
      student: "primary",
    };
    return (
      <Badge variant={variants[displayRole] || "secondary"}>
        {displayRole}
      </Badge>
    );
  };

  if (loading) {
    return <Loading text="Checking admin access..." />;
  }

  if (!hasAllowedRole) return null;

  const pageStart = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const pageEnd =
    meta.total === 0 ? 0 : Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="layout-container section-spacing space-y-8 max-w-7xl mx-auto">
      <div className="max-w-3xl space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          User Management
        </h1>
        <p className="text-secondary">
          Search accounts, adjust access, and keep the platform healthy.
        </p>
      </div>

      {error && (
        <Card
          hoverable={false}
          className="border border-gray-300 bg-gray-100 p-4 text-sm text-gray-800"
        >
          {error}
        </Card>
      )}

      <Card hoverable={false} className="space-y-5 p-5 sm:p-6">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="employer">Recruiter</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={sortBy}
            onChange={(event) =>
              setSortBy(
                event.target.value as
                  | "createdAt"
                  | "name"
                  | "email"
                  | "role"
                  | "applications"
                  | "jobs"
                  | "resumeScore",
              )
            }
            className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
            onChange={(event) => setOrder(event.target.value as "asc" | "desc")}
            className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        {users.length > 0 ? (
          <div className="space-y-4">
            <div className="-mx-4 overflow-x-auto rounded-2xl border border-border px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[860px] table-fixed">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-secondary">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-secondary">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-secondary">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-secondary">
                      Resume
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-secondary">
                      Applications
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-secondary">
                      Jobs
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-secondary">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-secondary">
                      Joined
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-secondary">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-border transition-colors hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex min-w-0 items-center space-x-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                            <span className="text-primary text-sm font-medium">
                              {entry.name?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                          </div>
                          <span className="truncate font-medium text-primary">
                            {entry.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-secondary">
                        <span className="block truncate">{entry.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        {getRoleBadge(entry.canonicalRole || entry.role)}
                      </td>
                      <td className="py-3 px-4 text-secondary text-sm">
                        {entry.resumeUploaded
                          ? `${Math.round(entry.latestResumeScore || 0)}%`
                          : "No"}
                      </td>
                      <td className="py-3 px-4 text-secondary text-sm">
                        {entry.totalApplications || 0}
                      </td>
                      <td className="py-3 px-4 text-secondary text-sm">
                        {entry.totalJobsPosted || 0}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() =>
                            handleToggleStatus(entry.id, !!entry.isActive)
                          }
                          className="min-h-[36px] rounded px-3 py-1 text-xs font-medium text-gray-800 transition hover:bg-gray-100"
                        >
                          {entry.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-secondary text-sm">
                        {new Date(
                          entry.createdAt || Date.now(),
                        ).toLocaleDateString()}
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <h3 className="text-lg font-medium text-black mb-2">
              No users found
            </h3>
            <p className="text-secondary">Try adjusting search or filters</p>
          </div>
        )}
      </Card>
    </div>
  );
}
