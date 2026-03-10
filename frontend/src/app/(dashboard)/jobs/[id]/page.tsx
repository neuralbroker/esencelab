'use client';

/**
 * Job detail page.
 *
 * This page shows a single job in more detail and exposes role-based actions
 * such as applying, viewing match data, or managing the posting.
 */
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Job, Application } from '@/types';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Link from 'next/link';
import { MapPin, DollarSign, Clock, Briefcase, Building, CheckCircle, ChevronLeft } from 'lucide-react';
import { Skeleton } from '@/components/Skeleton';
import { motion } from 'framer-motion';

export default function JobDetailPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id?: string | string[] }>();
  const jobId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    try {
      const res = await api.get(`/jobs/${jobId}`);
      setJob(res.data.data);
    } catch {
      router.push('/jobs');
    } finally {
      setLoading(false);
    }
  }, [jobId, router]);

  const checkApplication = useCallback(async () => {
    if (!jobId) return;
    try {
      const res = await api.get('/applications/my');
      const applications = res.data.data || [];
      const applied = applications.some((app: Application) => app.jobId === jobId);
      setHasApplied(applied);
    } catch {
      setHasApplied(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && jobId) {
      void fetchJob();
      void checkApplication();
    }
  }, [checkApplication, fetchJob, isAuthenticated, jobId]);

  const handleApply = async () => {
    if (!user?.id || !jobId) return;

    setApplying(true);
    try {
      await api.post('/applications', { jobId });
      setHasApplied(true);
      alert('Application submitted successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to apply. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  if (isLoading || loading || !job) {
    return (
      <div className="layout-container section-spacing space-y-8 max-w-6xl mx-auto">
        <Skeleton className="h-6 w-32 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-64 w-full lg:col-span-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="layout-container section-spacing max-w-6xl mx-auto">
      <Link href="/jobs" className="inline-flex items-center text-sm font-medium text-secondary hover:text-primary transition-colors mb-8 group">
        <div className="bg-background border border-border group-hover:bg-accent-soft group-hover:text-accent group-hover:border-accent-soft p-1.5 rounded-lg mr-3 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </div>
        Back to Jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 space-y-8"
        >
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary mb-2 leading-tight">{job.title}</h1>
                <p className="text-xl font-medium text-secondary flex items-center">
                  <Building className="w-5 h-5 mr-2.5 text-secondary" />
                  {job.company}
                </p>
              </div>
              <Badge variant={job.status === 'active' ? 'success' : 'secondary'} className="self-start md:self-auto px-4 py-1.5 text-sm">
                {job.status}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-4 py-6 border-y border-border my-8">
              <div className="flex items-center text-secondary bg-background px-4 py-2 rounded-xl border border-border">
                <MapPin className="w-4 h-4 mr-2.5 text-accent" />
                <span className="text-sm font-medium">{job.location}</span>
              </div>
              <div className="flex items-center text-secondary bg-background px-4 py-2 rounded-xl border border-border">
                <Briefcase className="w-4 h-4 mr-2.5 text-accent" />
                <span className="text-sm font-medium capitalize">{job.jobType?.replace('_', ' ')}</span>
              </div>
              {(job.salaryMin || job.salaryMax) && (
                <div className="flex items-center text-secondary bg-background px-4 py-2 rounded-xl border border-border">
                  <DollarSign className="w-4 h-4 mr-2.5 text-accent" />
                  <span className="text-sm font-medium">
                    {job.salaryMin && job.salaryMax
                      ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
                      : job.salaryMin
                        ? `From $${job.salaryMin.toLocaleString()}`
                        : `Up to $${job.salaryMax?.toLocaleString()}`}
                  </span>
                </div>
              )}
              <div className="flex items-center text-secondary bg-background px-4 py-2 rounded-xl border border-border">
                <Clock className="w-4 h-4 mr-2.5 text-accent" />
                <span className="text-sm font-medium">{new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <section>
              <h2 className="text-xl font-bold text-primary mb-4 flex items-center">
                <span className="w-1.5 h-6 bg-accent rounded-full mr-3 inline-block"></span>
                Job Description
              </h2>
              <div className="prose prose-gray max-w-none text-secondary leading-relaxed whitespace-pre-line">
                {job.description}
              </div>
            </section>

            {job.requirements && (
              <section>
                <h2 className="text-xl font-bold text-primary mb-4 flex items-center">
                  <span className="w-1.5 h-6 bg-accent rounded-full mr-3 inline-block"></span>
                  Requirements
                </h2>
                <div className="prose prose-gray max-w-none text-secondary leading-relaxed whitespace-pre-line">
                  {job.requirements}
                </div>
              </section>
            )}

            {job.skills && job.skills.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-primary mb-4 flex items-center">
                  <span className="w-1.5 h-6 bg-accent rounded-full mr-3 inline-block"></span>
                  Required Skills
                </h2>
                <div className="flex flex-wrap gap-2.5">
                  {job.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1.5 font-normal text-sm">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </section>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6 lg:sticky lg:top-28 lg:self-start"
        >
          {user?.role === 'student' && (
            <Card hoverable={false} className="border-2 border-border shadow-sm">
              {hasApplied ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="font-bold text-primary text-xl mb-2">Application Submitted</p>
                  <p className="text-sm text-secondary">Track your application status in your dashboard.</p>
                  <Link href="/applications" className="mt-6 inline-block w-full">
                    <Button variant="outline" className="w-full">View My Applications</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-5 text-center py-2">
                  <h3 className="font-bold text-primary text-xl">Interested in this role?</h3>
                  <p className="text-sm text-secondary leading-relaxed">
                    Submit your application now. Our AI will automatically match your resume skills against the job requirements.
                  </p>
                  <Button onClick={handleApply} isLoading={applying} variant="primary" className="w-full py-3 text-sm">
                    Apply Now
                  </Button>
                </div>
              )}
            </Card>
          )}

          <Card hoverable={false} className="bg-background border-none shadow-none p-0">
            <h3 className="font-bold text-primary text-lg mb-4">Quick Overview</h3>
            <div className="space-y-4 text-sm bg-white p-6 rounded-2xl border border-border">
              <div className="grid grid-cols-[100px_1fr] items-center">
                <span className="text-secondary font-medium">Job Type</span>
                <span className="font-semibold text-primary text-right capitalize">{job.jobType?.replace('_', ' ')}</span>
              </div>
              <div className="w-full h-px bg-border"></div>
              <div className="grid grid-cols-[100px_1fr] items-center">
                <span className="text-secondary font-medium">Location</span>
                <span className="font-semibold text-primary text-right">{job.location}</span>
              </div>
              {(job.salaryMin || job.salaryMax) && (
                <>
                  <div className="w-full h-px bg-border"></div>
                  <div className="grid grid-cols-[100px_1fr] items-center">
                    <span className="text-secondary font-medium">Salary</span>
                    <span className="font-semibold text-primary text-right">
                      ${job.salaryMin?.toLocaleString()} - ${job.salaryMax?.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
              <div className="w-full h-px bg-border"></div>
              <div className="grid grid-cols-[100px_1fr] items-center">
                <span className="text-secondary font-medium">Posted</span>
                <span className="font-semibold text-primary text-right">{new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
