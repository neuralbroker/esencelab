"use client";

/**
 * New job creation page.
 *
 * Recruiters and admins use this page to create structured job posts that the
 * ranking and candidate-matching features can work with later.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Loading from "@/components/Loading";
import { Briefcase } from "lucide-react";
import { useRoleAccess } from "@/lib/useRoleAccess";
import { createJob, getReadableErrorMessage } from "@/lib/dashboardApi";

export default function NewJobPage() {
  const router = useRouter();
  const { hasAllowedRole, isCheckingAccess } = useRoleAccess({
    allowedRoles: ["employer", "admin"],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    description: "",
    requirements: "",
    location: "",
    salaryMin: "",
    salaryMax: "",
    experienceLevel: "mid",
    jobType: "full_time",
    status: "active",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createJob({
        title: formData.title,
        company: formData.company,
        description: formData.description,
        location: formData.location,
        requirements: formData.requirements,
        experienceLevel: formData.experienceLevel as
          | "entry"
          | "junior"
          | "mid"
          | "senior"
          | "lead",
        jobType: formData.jobType as
          | "full_time"
          | "part_time"
          | "internship"
          | "contract",
        status: formData.status as "active" | "closed",
        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin, 10) : null,
        salaryMax: formData.salaryMax ? parseInt(formData.salaryMax, 10) : null,
      });
      router.push("/jobs?posted=1");
    } catch (error: any) {
      setError(getReadableErrorMessage(error, "Failed to create job."));
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingAccess) {
    return <Loading text="Checking job posting access..." />;
  }

  if (!hasAllowedRole) return null;

  return (
    <div className="layout-container section-spacing mx-auto max-w-3xl space-y-8">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-white/70">
            <Briefcase className="h-6 w-6 text-accent" />
          </span>
          <h1 className="break-words text-3xl font-bold tracking-tight text-primary md:text-4xl">
            Post a New Job
          </h1>
        </div>
        <p className="max-w-2xl text-base text-secondary">
          Create a structured job post that supports matching, ranking, and
          recruiter review.
        </p>
      </div>

      <Card
        hoverable={false}
        className="border border-border p-4 sm:p-6 md:p-8"
      >
        {error && (
          <div className="mb-6 rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-800">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            <Input
              label="Job Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g. Software Engineer"
              required
            />
            <Input
              label="Company Name"
              value={formData.company}
              onChange={(e) =>
                setFormData({ ...formData, company: e.target.value })
              }
              placeholder="e.g. Acme Inc."
              required
            />
          </div>

          <div className="group rounded-xl border border-border bg-white/68 p-1.5 transition-all duration-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
            <label className="block px-2 pt-2 text-xs font-semibold uppercase tracking-wider text-secondary">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={5}
              className="min-h-[120px] w-full resize-y bg-transparent px-3 pb-2 text-primary focus:outline-none"
              placeholder="Provide a detailed job description..."
              required
            />
          </div>

          <div className="group rounded-xl border border-border bg-white/68 p-1.5 transition-all duration-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
            <label className="block px-2 pt-2 text-xs font-semibold uppercase tracking-wider text-secondary">
              Requirements
            </label>
            <textarea
              value={formData.requirements}
              onChange={(e) =>
                setFormData({ ...formData, requirements: e.target.value })
              }
              rows={4}
              className="min-h-[120px] w-full resize-y bg-transparent px-3 pb-2 text-primary focus:outline-none"
              placeholder="List the key skills and requirements, separated by commas..."
              required
            />
          </div>

          <Input
            label="Location"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            placeholder="e.g. New York, NY or Remote"
            required
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            <Input
              label="Minimum Salary (Optional)"
              type="number"
              value={formData.salaryMin}
              onChange={(e) =>
                setFormData({ ...formData, salaryMin: e.target.value })
              }
              placeholder="e.g. 50000"
            />
            <Input
              label="Maximum Salary (Optional)"
              type="number"
              value={formData.salaryMax}
              onChange={(e) =>
                setFormData({ ...formData, salaryMax: e.target.value })
              }
              placeholder="e.g. 80000"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            <Select
              label="Experience Level"
              value={formData.experienceLevel}
              onChange={(e) =>
                setFormData({ ...formData, experienceLevel: e.target.value })
              }
              options={[
                { value: "entry", label: "Entry" },
                { value: "junior", label: "Junior" },
                { value: "mid", label: "Mid" },
                { value: "senior", label: "Senior" },
                { value: "lead", label: "Lead" },
              ]}
            />
            <Select
              label="Job Type"
              value={formData.jobType}
              onChange={(e) =>
                setFormData({ ...formData, jobType: e.target.value })
              }
              options={[
                { value: "full_time", label: "Full Time" },
                { value: "part_time", label: "Part Time" },
                { value: "internship", label: "Internship" },
                { value: "contract", label: "Contract" },
              ]}
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              options={[
                { value: "active", label: "Active" },
                { value: "closed", label: "Closed" },
              ]}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              className="w-full sm:w-auto"
            >
              Post Job
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
