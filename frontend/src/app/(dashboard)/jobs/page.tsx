'use client';

/**
 * Jobs list page.
 *
 * Students browse opportunities here, while recruiters and admins use the
 * same page to manage jobs they own or oversee.
 */
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Job } from '@/types';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Link from 'next/link';
import { Briefcase, MapPin, DollarSign, Clock, Search, Trash2 } from 'lucide-react';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { Skeleton } from '@/components/Skeleton';
import { motion } from 'framer-motion';
import { getReadableErrorMessage } from '@/lib/dashboardApi';

export default function JobsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobType, setJobType] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [location, setLocation] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionJobId, setActionJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchJobs = useCallback(async () => {
    const isManager = user?.role === 'employer' || user?.role === 'admin';
    try {
      setActionError(null);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (jobType) params.append('jobType', jobType);
      if (statusFilter) params.append('status', statusFilter);
      if (location) params.append('location', location);
      if (isManager && !statusFilter) params.append('status', 'all');
      if (user?.role === 'employer') params.append('my', 'true');

      const res = await api.get(`/jobs?${params.toString()}`);
      setJobs(res.data.data?.jobs || []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [jobType, location, searchTerm, statusFilter, user?.role]);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchJobs();
    }
  }, [fetchJobs, isAuthenticated]);

  const handleToggleStatus = async (job: Job) => {
    const nextStatus = job.status === 'active' ? 'closed' : 'active';
    setActionJobId(job.id);
    setActionError(null);
    try {
      await api.put(`/jobs/${job.id}`, { status: nextStatus });
      await fetchJobs();
    } catch (error: any) {
      setActionError(getReadableErrorMessage(error, 'Failed to update job status.'));
    } finally {
      setActionJobId(null);
    }
  };

  const handleDeleteJob = async (job: Job) => {
    const confirmed = window.confirm(`Delete "${job.title}" at ${job.company}?`);
    if (!confirmed) return;
    setActionJobId(job.id);
    setActionError(null);
    try {
      await api.delete(`/jobs/${job.id}`);
      await fetchJobs();
    } catch (error: any) {
      setActionError(getReadableErrorMessage(error, 'Failed to delete job.'));
    } finally {
      setActionJobId(null);
    }
  };

  const getJobTypeBadge = (type: string) => {
    const variants: Record<string, 'success' | 'warning' | 'primary' | 'secondary'> = {
      'full_time': 'primary',
      'part_time': 'success',
      'internship': 'warning',
      'contract': 'secondary',
    };
    return <Badge variant={variants[type] || 'secondary'}>{type.replace('_', ' ')}</Badge>;
  };

  if (isLoading || loading) {
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
    <div className="layout-container section-spacing space-y-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary mb-2">Job Listings</h1>
          <p className="text-base text-secondary">Find your dream job or hire top talent.</p>
        </div>
        {(user?.role === 'employer' || user?.role === 'admin') && (
          <Link href="/jobs/new">
            <Button variant="primary">Post New Job</Button>
          </Link>
        )}
      </div>

      {actionError && (
        <Card hoverable={false} className="border border-gray-300 bg-gray-100 p-4 text-sm text-gray-800">
          {actionError}
        </Card>
      )}

      <Card hoverable={false} className="p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2 relative pt-2">
            <label className="absolute left-4 transition-all duration-200 pointer-events-none text-xs px-1 bg-background text-secondary z-10 -top-1">
              Search Jobs
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary w-4 h-4 z-10" />
              <input
                type="text"
                placeholder="Keywords, role, or company"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-border bg-transparent pl-11 pr-4 py-3.5 text-primary text-base transition-colors focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
              />
            </div>
          </div>
          <Select
            label="Job Type"
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            options={[
              { value: '', label: 'All Types' },
              { value: 'full_time', label: 'Full Time' },
              { value: 'part_time', label: 'Part Time' },
              { value: 'internship', label: 'Internship' },
              { value: 'contract', label: 'Contract' },
            ]}
          />
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'closed', label: 'Closed' },
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
          }}
        >
          {jobs.map((job) => (
            <motion.div key={job.id} variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}>
              <Card hoverable className="flex flex-col h-full p-6">
                <div className="flex items-start justify-between mb-4">
                  <Badge variant={job.status === 'active' ? 'success' : 'secondary'} className="px-3">
                    {job.status}
                  </Badge>
                  {getJobTypeBadge(job.jobType)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-primary mb-1 line-clamp-1" title={job.title}>{job.title}</h3>
                  <p className="text-secondary font-medium mb-5">{job.company}</p>
                </div>
                <div className="space-y-3 text-sm text-secondary mb-8 flex-grow">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-3 flex-shrink-0" />
                    <span className="line-clamp-1" title={job.location}>{job.location}</span>
                  </div>
                  {(job.salaryMin || job.salaryMax) && (
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-3 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {job.salaryMin && job.salaryMax
                          ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
                          : job.salaryMin
                            ? `From $${job.salaryMin.toLocaleString()}`
                            : `Up to $${job.salaryMax?.toLocaleString()}`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-3 flex-shrink-0" />
                    <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="mt-auto">
                  <Link href={`/jobs/${job.id}`}>
                    <Button variant="outline" className="w-full justify-center">View Details</Button>
                  </Link>
                  {(user?.role === 'admin' || (user?.role === 'employer' && job.employerId === user.id)) && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatus(job)}
                        isLoading={actionJobId === job.id}
                        className="w-full justify-center"
                      >
                        {job.status === 'active' ? 'Close' : 'Reopen'}
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
        <Card hoverable={false} className="text-center py-16 flex flex-col items-center">
          <div className="w-16 h-16 bg-accent-soft rounded-full flex items-center justify-center mb-6">
            <Briefcase className="w-8 h-8 text-accent" />
          </div>
          <h3 className="text-xl font-medium text-primary mb-2">No jobs found</h3>
          <p className="text-secondary">Try adjusting your search criteria or explore other categories.</p>
        </Card>
      )}
    </div>
  );
}

