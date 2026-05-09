"use client";

/**
 * Jobs list page.
 *
 * Students browse opportunities here, while recruiters and admins use the
 * same page to manage jobs they own or oversee.
 */
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Job } from "@/types";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Link from "next/link";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Search,
  Trash2,
} from "lucide-react";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { Skeleton } from "@/components/Skeleton";
import { motion } from "framer-motion";
import { getReadableErrorMessage } from "@/lib/dashboardApi";

export default function JobsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const userRole = user?.role;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [jobType, setJobType] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [location, setLocation] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionJobId, setActionJobId] = useState<string | null>(null);
  const showPostedMessage = searchParams.get("posted") === "1";

  const fetchJobs = useCallback(async () => {
    if (!user) return;
    const isManager = userRole === "employer" || userRole === "admin";
    try {
      setLoading(true);
      setActionError(null);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (jobType) params.append("jobType", jobType);
      if (statusFilter) params.append("status", statusFilter);
      if (location) params.append("location", location);
      if (isManager && !statusFilter) params.append("status", "all");
      if (userRole === "employer") params.append("my", "true");

      const res = await api.get(`/jobs?${params.toString()}`);
      setJobs(res.data.data?.jobs || []);
    } catch (error: any) {
      setJobs([]);
      setActionError(getReadableErrorMessage(error, "Failed to load jobs."));
    } finally {
      setLoading(false);
    }
  }, [jobType, location, searchTerm, statusFilter, user, userRole]);

  useEffect(() => {
    if (!user) return;
    void fetchJobs();
  }, [fetchJobs, user]);

  const handleToggleStatus = async (job: Job) => {
    const nextStatus = job.status === "active" ? "closed" : "active";
    setActionJobId(job.id);
    setActionError(null);
    try {
      await api.put(`/jobs/${job.id}`, { status: nextStatus });
      await fetchJobs();
    } catch (error: any) {
      setActionError(
        getReadableErrorMessage(error, "Failed to update job status."),
      );
    } finally {
      setActionJobId(null);
    }
  };

  const handleDeleteJob = async (job: Job) => {
    const confirmed = window.confirm(
      `Delete "${job.title}" at ${job.company}?`,
    );
    if (!confirmed) return;
    setActionJobId(job.id);
    setActionError(null);
    try {
      await api.delete(`/jobs/${job.id}`);
      await fetchJobs();
    } catch (error: any) {
      setActionError(getReadableErrorMessage(error, "Failed to delete job."));
    } finally {
      setActionJobId(null);
    }
  };

  const getJobTypeBadge = (type: string) => {
    const variants: Record<
      string,
      "success" | "warning" | "primary" | "secondary"
    > = {
      full_time: "primary",
      part_time: "success",
      internship: "warning",
      contract: "secondary",
    };
    return (
      <Badge variant={variants[type] || "secondary"}>
        {type.replace("_", " ")}
      </Badge>
    );
  };

  if (!user || loading) {
    return (
      <div className="layout-container section-spacing space-y-8 max-w-6xl mx-auto">
        <Skeleton className="h-16 w-1/3 mb-8" />
        <Skeleton className="h-24 w-full mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="layout-container section-spacing mx-auto max-w-6xl space-y-8 sm:space-y-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="min-w-0 space-y-2">
          <h1 className="break-words text-3xl font-bold tracking-tight text-primary md:text-4xl">
            Job Listings
          </h1>
          <p className="max-w-2xl text-base text-secondary">
            Find relevant openings, compare role fit, and manage hiring
            workflows from one place.
          </p>
        </div>
        {(user?.role === "employer" || user?.role === "admin") && (
          <Link href="/jobs/new" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full sm:w-auto">
              Post New Job
            </Button>
          </Link>
        )}
      </div>

      {actionError && (
        <Card
          hoverable={false}
          className="border border-gray-300 bg-gray-100 p-4 text-sm text-gray-800"
        >
          {actionError}
        </Card>
      )}

      {showPostedMessage && !actionError && (
        <Card
          hoverable={false}
          className="border border-gray-300 bg-gray-100 p-4 text-sm text-gray-800"
        >
          Job posted successfully.
        </Card>
      )}

      <Card hoverable={false} className="p-4 sm:p-5 md:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <div className="relative pt-2 sm:col-span-2">
            <label className="absolute left-4 transition-all duration-200 pointer-events-none text-xs px-1 bg-white/80 text-secondary z-10 -top-1 rounded">
              Search Jobs
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary w-4 h-4 z-10" />
              <input
                type="text"
                placeholder="Keywords, role, or company"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-border bg-white/68 py-3.5 pl-11 pr-4 text-base text-primary transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <Select
            label="Job Type"
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            options={[
              { value: "", label: "All Types" },
              { value: "full_time", label: "Full Time" },
              { value: "part_time", label: "Part Time" },
              { value: "internship", label: "Internship" },
              { value: "contract", label: "Contract" },
            ]}
          />
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "", label: "All Statuses" },
              { value: "active", label: "Active" },
              { value: "closed", label: "Closed" },
            ]}
          />
          <Input
            label="Location"
            placeholder="City, state, or remote"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      </Card>

      {jobs.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
          }}
        >
          {jobs.map((job) => (
            <motion.div
              key={job.id}
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 },
              }}
            >
              <Card hoverable className="flex h-full flex-col p-5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                  <Badge
                    variant={job.status === "active" ? "success" : "secondary"}
                    className="px-3 capitalize"
                  >
                    {job.status}
                  </Badge>
                  {getJobTypeBadge(job.jobType)}
                </div>
                <div className="min-w-0">
                  <h3
                    className="mb-1 line-clamp-2 break-words text-xl font-semibold text-primary"
                    title={job.title}
                  >
                    {job.title}
                  </h3>
                  <p className="mb-5 break-words font-medium text-secondary">
                    {job.company}
                  </p>
                </div>
                <div className="mb-8 flex-grow space-y-3 text-sm text-secondary">
                  <div className="flex items-start">
                    <MapPin className="mr-3 mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span
                      className="line-clamp-2 break-words"
                      title={job.location}
                    >
                      {job.location}
                    </span>
                  </div>
                  {(job.salaryMin || job.salaryMax) && (
                    <div className="flex items-start">
                      <DollarSign className="mr-3 mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span className="break-words">
                        {job.salaryMin && job.salaryMax
                          ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
                          : job.salaryMin
                            ? `From $${job.salaryMin.toLocaleString()}`
                            : `Up to $${job.salaryMax?.toLocaleString()}`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start">
                    <Clock className="mr-3 mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="mt-auto">
                  <Link href={`/jobs/${job.id}`} className="block">
                    <Button variant="outline" className="w-full justify-center">
                      View Details
                    </Button>
                  </Link>
                  {(user?.role === "admin" ||
                    (user?.role === "employer" &&
                      job.employerId === user.id)) && (
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatus(job)}
                        isLoading={actionJobId === job.id}
                        className="w-full justify-center"
                      >
                        {job.status === "active" ? "Close" : "Reopen"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteJob(job)}
                        isLoading={actionJobId === job.id}
                        className="w-full justify-center text-gray-700 hover:bg-gray-100"
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <Card
          hoverable={false}
          className="flex flex-col items-center px-4 py-12 text-center sm:py-16"
        >
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft">
            <Briefcase className="h-8 w-8 text-accent" />
          </div>
          <h3 className="mb-2 text-xl font-medium text-primary">
            No jobs found
          </h3>
          <p className="max-w-md text-secondary">
            Try adjusting your search criteria or clearing filters to broaden
            the results.
          </p>
        </Card>
      )}
    </div>
  );
}
