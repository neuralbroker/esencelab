'use client';

/**
 * New job creation page.
 *
 * Recruiters and admins use this page to create structured job posts that the
 * ranking and candidate-matching features can work with later.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Loading from '@/components/Loading';
import { Briefcase } from 'lucide-react';
import { useRoleAccess } from '@/lib/useRoleAccess';

export default function NewJobPage() {
  const router = useRouter();
  const { hasAllowedRole, isCheckingAccess } = useRoleAccess({ allowedRoles: ['employer', 'admin'] });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    requirements: '',
    location: '',
    salaryMin: '',
    salaryMax: '',
    experienceLevel: 'mid',
    jobType: 'full_time',
    status: 'active',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/jobs', {
        ...formData,
        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : null,
        salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : null,
      });
      router.push('/jobs');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingAccess) {
    return <Loading text="Checking job posting access..." />;
  }

  if (!hasAllowedRole) return null;

  return (
    <div className="layout-container section-spacing max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary mb-2 flex items-center">
          <Briefcase className="w-8 h-8 mr-3 text-accent" />
          Post a New Job
        </h1>
        <p className="text-base text-secondary">
          Create a clear and compelling job description to attract top talent.
        </p>
      </div>

      <Card hoverable={false} className="p-6 md:p-10 border border-border">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Job Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Software Engineer"
              required
            />
            <Input
              label="Company Name"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="e.g. Acme Inc."
              required
            />
          </div>

          <div className="space-y-1.5 bg-background p-1.5 rounded-xl border border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all duration-200 group">
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider px-2 pt-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              className="w-full bg-transparent px-3 pb-2 text-primary focus:outline-none resize-y min-h-[100px]"
              placeholder="Provide a detailed job description..."
              required
            />
          </div>

          <div className="space-y-1.5 bg-background p-1.5 rounded-xl border border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all duration-200 group">
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider px-2 pt-2">Requirements</label>
            <textarea
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              rows={4}
              className="w-full bg-transparent px-3 pb-2 text-primary focus:outline-none resize-y min-h-[100px]"
              placeholder="List the key skills and requirements..."
            />
          </div>

          <Input
            label="Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g. New York, NY or Remote"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Minimum Salary (Optional)"
              type="number"
              value={formData.salaryMin}
              onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
              placeholder="e.g. 50000"
            />
            <Input
              label="Maximum Salary (Optional)"
              type="number"
              value={formData.salaryMax}
              onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
              placeholder="e.g. 80000"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Experience Level"
              value={formData.experienceLevel}
              onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
              options={[
                { value: 'entry', label: 'Entry' },
                { value: 'junior', label: 'Junior' },
                { value: 'mid', label: 'Mid' },
                { value: 'senior', label: 'Senior' },
                { value: 'lead', label: 'Lead' },
              ]}
            />
            <Select
              label="Job Type"
              value={formData.jobType}
              onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
              options={[
                { value: 'full_time', label: 'Full Time' },
                { value: 'part_time', label: 'Part Time' },
                { value: 'internship', label: 'Internship' },
                { value: 'contract', label: 'Contract' },
              ]}
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'closed', label: 'Closed' },
              ]}
            />
          </div>

          <div className="pt-6 border-t border-border flex items-center gap-4 justify-end">
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Post Job
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
