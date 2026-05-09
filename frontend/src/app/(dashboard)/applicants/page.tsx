"use client";

/**
 * Applicants overview page.
 *
 * Recruiters and admins use this page to review ranked candidates, filter the
 * list, and move into a detailed applicant view.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Application, Job, RecruiterCandidateMatch } from "@/types";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Loading from "@/components/Loading";
import {
  Users,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  Search,
} from "lucide-react";
import {
  getCandidateMatches,
  getEmployerJobs,
  getReadableErrorMessage,
} from "@/lib/dashboardApi";
import { useRoleAccess } from "@/lib/useRoleAccess";

export default function ApplicantsPage() {
  const { user, hasAllowedRole, isCheckingAccess } = useRoleAccess({
    allowedRoles: ["employer", "admin"],
  });
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [candidateMatches, setCandidateMatches] = useState<
    RecruiterCandidateMatch[]
  >([]);
  const [sortBy, setSortBy] = useState<"match" | "resume" | "experience">(
    "match",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      setError(null);
      const params = statusFilter ? `?status=${statusFilter}` : "";
      const res = await api.get(`/applications${params}`);
      setApplications(res.data.data || []);
    } catch (err: any) {
      setApplications([]);
      setError(getReadableErrorMessage(err, "Failed to load applications."));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchJobs = useCallback(async () => {
    try {
      setError(null);
      const fetchedJobs =
        user?.role === "employer"
          ? await getEmployerJobs()
          : (await api.get("/jobs?status=active")).data.data?.jobs || [];
      setJobs(fetchedJobs);
      setSelectedJobId((current) => current || fetchedJobs[0]?.id || "");
    } catch (err: any) {
      setJobs([]);
      setError(getReadableErrorMessage(err, "Failed to load jobs."));
    }
  }, [user?.role]);

  const fetchCandidateMatches = useCallback(
    async (jobId: string) => {
      if (!jobId) {
        setCandidateMatches([]);
        return;
      }
      setLoadingMatches(true);
      try {
        setError(null);
        const matches = await getCandidateMatches(jobId, {
          sortBy,
          order: sortOrder,
          limit: 20,
        });
        setCandidateMatches(matches);
      } catch (err: any) {
        setCandidateMatches([]);
        setError(
          getReadableErrorMessage(err, "Failed to load candidate rankings."),
        );
      } finally {
        setLoadingMatches(false);
      }
    },
    [sortBy, sortOrder],
  );

  useEffect(() => {
    if (!hasAllowedRole) return;
    void fetchApplications();
    void fetchJobs();
  }, [fetchApplications, fetchJobs, hasAllowedRole]);

  useEffect(() => {
    if (selectedJobId) {
      void fetchCandidateMatches(selectedJobId);
      return;
    }
    setCandidateMatches([]);
  }, [fetchCandidateMatches, selectedJobId, sortBy, sortOrder]);

  const handleStatusUpdate = async (appId: string, newStatus: string) => {
    try {
      setError(null);
      await api.put(`/applications/${appId}/status`, { status: newStatus });
      void fetchApplications();
    } catch (err: any) {
      setError(getReadableErrorMessage(err, "Failed to update status."));
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "success" | "warning" | "error" | "primary"
    > = {
      pending: "warning",
      shortlisted: "success",
      rejected: "error",
      interview: "primary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getApplicantDetailHref = (application: Application) => {
    return `/applicants/${application.candidateProfileId || application.candidateId}?jobId=${application.jobId}`;
  };

  const filteredApplications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return applications;
    return applications.filter((app) => {
      const haystack = [
        app.student?.name,
        app.student?.email,
        app.job?.title,
        app.job?.company,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [applications, searchTerm]);

  if (isCheckingAccess) {
    return <Loading text="Checking applicant access..." />;
  }

  if (loading) {
    return <Loading text="Loading applicants..." />;
  }

  if (!hasAllowedRole || !user) return null;

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    shortlisted: applications.filter((a) => a.status === "shortlisted").length,
    interview: applications.filter((a) => a.status === "interview").length,
  };

  return (
    <div className="layout-container section-spacing space-y-8 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Applicants
        </h1>
        <p className="text-secondary">
          Review applications, compare ranked candidates, and move hiring
          forward.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card hoverable={false} className="text-center p-5">
          <Users className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold text-primary">{stats.total}</p>
          <p className="text-sm text-secondary">Total</p>
        </Card>
        <Card hoverable={false} className="text-center p-5">
          <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold text-primary">{stats.pending}</p>
          <p className="text-sm text-secondary">Pending</p>
        </Card>
        <Card hoverable={false} className="text-center p-5">
          <CheckCircle className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold text-primary">{stats.shortlisted}</p>
          <p className="text-sm text-secondary">Shortlisted</p>
        </Card>
        <Card hoverable={false} className="text-center p-5">
          <Briefcase className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold text-primary">{stats.interview}</p>
          <p className="text-sm text-secondary">Interview</p>
        </Card>
      </div>

      <Card
        hoverable={false}
        title="AI Candidate Ranking"
        subtitle="Review the best-fit candidates for each active role."
      >
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary/70 mb-1">
                Select Job
              </label>
              <select
                value={selectedJobId}
                onChange={(event) => setSelectedJobId(event.target.value)}
                className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {jobs.length === 0 && <option value="">No active jobs</option>}
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} - {job.company}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary/70 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value as "match" | "resume" | "experience",
                  )
                }
                className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="match">Highest Match %</option>
                <option value="resume">Resume Score</option>
                <option value="experience">Experience</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary/70 mb-1">
                Order
              </label>
              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(event.target.value as "asc" | "desc")
                }
                className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="desc">High to Low</option>
                <option value="asc">Low to High</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-800">
              {error}
            </div>
          )}

          {loadingMatches ? (
            <div className="text-sm text-secondary py-8 text-center">
              Loading AI candidate rankings...
            </div>
          ) : candidateMatches.length > 0 ? (
            <div className="space-y-3">
              {candidateMatches.slice(0, 8).map((match) => (
                <div
                  key={match.candidateId}
                  className="rounded-2xl border border-border bg-white/70 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-primary">
                        {match.name}
                      </p>
                      <p className="break-words text-sm text-secondary">
                        {match.email}
                      </p>
                      <p className="text-xs text-secondary mt-1">
                        Resume: {Math.round(match.resumeScore || 0)}% |
                        Experience: {match.experienceYears || 0} yrs
                      </p>
                    </div>
                    <Badge
                      variant={
                        match.matchScore >= 70
                          ? "success"
                          : match.matchScore >= 50
                            ? "warning"
                            : "secondary"
                      }
                      className="self-start sm:self-auto"
                    >
                      {match.matchScore}% Match
                    </Badge>
                  </div>
                  {match.topSkills?.length ? (
                    <p className="mt-2 text-xs text-secondary">
                      Top Skills: {match.topSkills.slice(0, 3).join(", ")}
                    </p>
                  ) : null}
                  {match.missingSkills.length > 0 && (
                    <p className="mt-2 text-xs text-secondary">
                      Missing: {match.missingSkills.slice(0, 5).join(", ")}
                    </p>
                  )}
                  {match.hasApplied && (
                    <p className="mt-1 text-xs text-secondary">
                      Application: {match.applicationStatus || "pending"}
                    </p>
                  )}
                  <button
                    onClick={() =>
                      router.push(
                        `/applicants/${match.candidateId}?jobId=${selectedJobId}`,
                      )
                    }
                    className="mt-3 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-gray-50"
                  >
                    View Profile
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-secondary py-8 text-center">
              No candidate ranking available for this job yet.
            </div>
          )}
        </div>
      </Card>

      <Card hoverable={false}>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name or job..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary sm:w-auto"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interview">Interview</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {filteredApplications.length > 0 ? (
          <div className="space-y-4">
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-white/70 p-4 transition-colors hover:bg-white sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <span className="font-medium text-primary">
                      {app.student?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate font-medium text-primary">
                      {app.student?.name}
                    </h4>
                    <p className="break-words text-sm text-secondary">
                      {app.job?.title} at {app.job?.company}
                    </p>
                    {app.matchScore && (
                      <p className="text-xs text-primary">
                        Match: {Math.round(app.matchScore)}%
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                  {getStatusBadge(app.status)}
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <button
                      onClick={() => router.push(getApplicantDetailHref(app))}
                      className="min-h-[38px] rounded-lg border border-border px-3 py-1 text-sm text-primary transition-colors hover:bg-gray-50"
                    >
                      View Profile
                    </button>
                    {app.status === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            handleStatusUpdate(app.id, "shortlisted")
                          }
                          className="min-h-[38px] rounded-lg p-2 text-gray-700 hover:bg-gray-200"
                          title="Shortlist"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(app.id, "rejected")}
                          className="min-h-[38px] rounded-lg p-2 text-gray-600 hover:bg-gray-200"
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {app.status === "shortlisted" && (
                      <button
                        onClick={() => handleStatusUpdate(app.id, "interview")}
                        className="min-h-[38px] rounded-lg bg-black px-3 py-1 text-sm text-white hover:bg-primary/90"
                      >
                        Schedule Interview
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-secondary/70 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              {searchTerm
                ? "No applicants match your search"
                : "No applicants yet"}
            </h3>
            <p className="text-secondary">
              {searchTerm
                ? "Try a different candidate name, email, job title, or company."
                : "Applications will appear here when candidates apply."}
            </p>
            {!searchTerm && jobs.length === 0 && (
              <div className="mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/jobs/new")}
                >
                  Post Your First Job
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
