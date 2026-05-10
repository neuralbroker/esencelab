"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Copy,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Loading from "@/components/Loading";
import {
  getAdminRecruiterRequests,
  getReadableErrorMessage,
  reviewRecruiterAccessRequest,
} from "@/lib/dashboardApi";
import { useRoleAccess } from "@/lib/useRoleAccess";
import {
  PaginationMeta,
  RecruiterAccessRequest,
  RecruiterAccessRequestStatus,
  RecruiterAccessRequestSummary,
} from "@/types";

const EMPTY_META: PaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

const EMPTY_SUMMARY: RecruiterAccessRequestSummary = {
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
};

const getStatusBadgeVariant = (
  status: RecruiterAccessRequestStatus,
): "primary" | "success" | "warning" | "error" => {
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  return "warning";
};

const getReadableDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

export default function AdminRecruiterRequestsPage() {
  const { hasAllowedRole } = useRoleAccess({ allowedRoles: ["admin"] });
  const [requests, setRequests] = useState<RecruiterAccessRequest[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [summary, setSummary] =
    useState<RecruiterAccessRequestSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    RecruiterAccessRequestStatus | "all"
  >("pending");
  const [sortBy, setSortBy] = useState<
    "createdAt" | "name" | "company" | "status" | "reviewedAt"
  >("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [approvedCredential, setApprovedCredential] = useState<{
    email: string;
    temporaryPassword: string;
  } | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!hasAllowedRole) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const result = await getAdminRecruiterRequests({
        page,
        limit: 12,
        search: searchTerm || undefined,
        status: statusFilter,
        sortBy,
        order,
      });
      setRequests(result.data || []);
      setMeta(result.meta || EMPTY_META);
      setSummary(result.summary || EMPTY_SUMMARY);
    } catch (err: any) {
      setRequests([]);
      setMeta(EMPTY_META);
      setSummary(EMPTY_SUMMARY);
      setError(
        getReadableErrorMessage(err, "Failed to load recruiter requests."),
      );
    } finally {
      setLoading(false);
    }
  }, [hasAllowedRole, order, page, searchTerm, sortBy, statusFilter]);

  useEffect(() => {
    if (!hasAllowedRole) return;
    void fetchRequests();
  }, [fetchRequests, hasAllowedRole]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, sortBy, order]);

  const handleApprove = async (request: RecruiterAccessRequest) => {
    const customPassword = window.prompt(
      "Optional: enter a custom temporary password with at least 10 characters. Leave blank to generate one automatically.",
      "",
    );
    if (customPassword === null) return;

    try {
      setError(null);
      setActionId(request.id);
      const result = await reviewRecruiterAccessRequest(request.id, {
        status: "approved",
        temporaryPassword: customPassword.trim() || undefined,
      });
      if (result.temporaryPassword) {
        setApprovedCredential({
          email: request.email,
          temporaryPassword: result.temporaryPassword,
        });
      }
      await fetchRequests();
    } catch (err: any) {
      setError(getReadableErrorMessage(err, "Failed to approve request."));
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (request: RecruiterAccessRequest) => {
    const notes = window.prompt(
      "Add admin notes for the rejection. These notes stay visible to admins.",
      request.adminNotes || "",
    );
    if (notes === null) return;

    try {
      setError(null);
      setActionId(request.id);
      await reviewRecruiterAccessRequest(request.id, {
        status: "rejected",
        adminNotes: notes.trim(),
      });
      await fetchRequests();
    } catch (err: any) {
      setError(getReadableErrorMessage(err, "Failed to reject request."));
    } finally {
      setActionId(null);
    }
  };

  const copyTemporaryPassword = async () => {
    if (!approvedCredential) return;
    try {
      await navigator.clipboard.writeText(approvedCredential.temporaryPassword);
    } catch {
      setError(
        "Unable to copy automatically. Select and copy the password manually.",
      );
    }
  };

  if (loading) {
    return <Loading text="Checking admin access..." />;
  }

  if (!hasAllowedRole) return null;

  const pageStart = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const pageEnd =
    meta.total === 0 ? 0 : Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="layout-container section-spacing mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-3xl space-y-2">
          <span className="inline-flex rounded-full border border-border bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
            Admin approvals
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-primary md:text-4xl">
            Recruiter Access Requests
          </h1>
          <p className="text-secondary">
            Review recruiter requests, approve trusted teams, and issue a
            temporary password only after admin validation.
          </p>
        </div>
        <Link
          href="/users"
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-white/72 bg-white/64 px-6 py-3 text-base font-medium text-primary transition-colors hover:bg-white/78 sm:w-auto"
        >
          View user accounts
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Pending", value: summary.pending, icon: ShieldCheck },
          { label: "Approved", value: summary.approved, icon: CheckCircle2 },
          { label: "Rejected", value: summary.rejected, icon: XCircle },
          { label: "Total", value: summary.total, icon: Building2 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} hoverable={false} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-secondary">{item.label}</p>
                  <p className="mt-1 text-3xl font-semibold text-primary">
                    {item.value}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {approvedCredential && (
        <Card
          hoverable={false}
          className="border border-[#d8ead8] bg-[#f5fbf4] p-5"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-[#254525]">
                Recruiter approved for {approvedCredential.email}
              </p>
              <p className="mt-1 text-sm text-[#315231]">
                Share this temporary password securely. It is shown only in this
                admin response.
              </p>
              <p className="mt-3 break-all rounded-xl border border-[#d8ead8] bg-white px-3 py-2 font-mono text-sm text-[#1f3f1f]">
                {approvedCredential.temporaryPassword}
              </p>
            </div>
            <Button variant="outline" onClick={copyTemporaryPassword}>
              <Copy className="mr-2 h-4 w-4" />
              Copy password
            </Button>
          </div>
        </Card>
      )}

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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-secondary" />
            <input
              type="text"
              placeholder="Search name, email, company..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as RecruiterAccessRequestStatus | "all",
              )
            }
            className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All statuses</option>
          </select>
          <select
            value={sortBy}
            onChange={(event) =>
              setSortBy(
                event.target.value as
                  | "createdAt"
                  | "name"
                  | "company"
                  | "status"
                  | "reviewedAt",
              )
            }
            className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="createdAt">Sort by request date</option>
            <option value="name">Sort by name</option>
            <option value="company">Sort by company</option>
            <option value="status">Sort by status</option>
            <option value="reviewedAt">Sort by reviewed date</option>
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

        {requests.length > 0 ? (
          <div className="space-y-4">
            <div className="-mx-4 overflow-x-auto rounded-2xl border border-border px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[980px] table-fixed">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-medium text-secondary">
                      Recruiter
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-secondary">
                      Company
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-secondary">
                      Use case
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-secondary">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-secondary">
                      Requested
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-secondary">
                      Reviewed
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-secondary">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-border transition-colors hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 align-top">
                        <p className="truncate font-medium text-primary">
                          {request.name}
                        </p>
                        <p className="truncate text-sm text-secondary">
                          {request.email}
                        </p>
                        {request.jobTitle && (
                          <p className="mt-1 truncate text-xs text-secondary">
                            {request.jobTitle}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="truncate font-medium text-primary">
                          {request.companyName}
                        </p>
                        {request.companyWebsite ? (
                          <a
                            href={request.companyWebsite}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block truncate text-sm text-secondary underline underline-offset-4"
                          >
                            {request.companyWebsite}
                          </a>
                        ) : (
                          <p className="mt-1 text-sm text-secondary">
                            No website
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="line-clamp-3 text-sm leading-6 text-secondary">
                          {request.message}
                        </p>
                        {request.adminNotes && (
                          <p className="mt-2 line-clamp-2 rounded-lg bg-white px-2 py-1 text-xs text-secondary">
                            Admin notes: {request.adminNotes}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <Badge variant={getStatusBadgeVariant(request.status)}>
                          {request.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-secondary">
                        {getReadableDate(request.createdAt)}
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-secondary">
                        {getReadableDate(request.reviewedAt)}
                      </td>
                      <td className="px-4 py-4 text-right align-top">
                        {request.status === "pending" ? (
                          <div className="flex flex-col justify-end gap-2 sm:flex-row">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(request)}
                              isLoading={actionId === request.id}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(request)}
                              disabled={actionId === request.id}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-secondary">
                            Reviewed
                          </span>
                        )}
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
          <div className="py-12 text-center">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-secondary/70" />
            <h3 className="mb-2 text-lg font-medium text-black">
              No recruiter requests found
            </h3>
            <p className="text-secondary">
              Try changing the status or search filters.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
