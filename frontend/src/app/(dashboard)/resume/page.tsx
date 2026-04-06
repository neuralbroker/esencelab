'use client';

/**
 * Student resume page.
 *
 * This page handles resume upload, replacement, parsing results, and the
 * latest stored resume insights for the signed-in student.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  Compass,
  CheckCircle,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Resume } from '@/types';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import BeginnerCareerStarter, { BeginnerBlueprint } from '@/components/BeginnerCareerStarter';
import Loading from '@/components/Loading';
import { Skeleton } from '@/components/Skeleton';
import {
  deleteResume,
  getReadableErrorMessage,
  getResume,
  uploadResume,
} from '@/lib/dashboardApi';
import { useRoleAccess } from '@/lib/useRoleAccess';

type FeedbackTone = 'success' | 'error' | 'info';
type EntryMode = 'upload' | 'discover';

interface FeedbackState {
  tone: FeedbackTone;
  text: string;
}

const isResumeEffectivelyEmpty = (resume: Resume) => {
  const hasSkills = (resume.skills || []).length > 0;
  const hasSummary = Boolean(resume.parsedData?.summary);
  const hasEducation = (resume.parsedData?.education || []).length > 0;
  const hasExperience = (resume.parsedData?.experience || []).length > 0;
  return !hasSkills && !hasSummary && !hasEducation && !hasExperience;
};

const formatExperienceItem = (item: Record<string, any>) => {
  const role = item.role || item.title || item.position;
  const company = item.company || item.organization || item.employer;
  const period = item.duration || item.period || [item.startDate, item.endDate].filter(Boolean).join(' - ');
  const summary = item.description || item.summary || item.details;
  return {
    title: [role, company].filter(Boolean).join(' at ') || 'Experience entry',
    meta: period || null,
    summary: summary || null,
  };
};

const formatEducationItem = (item: Record<string, any>) => {
  const degree = item.degree || item.course || item.program;
  const school = item.institution || item.school || item.college;
  const period = item.year || item.graduationYear || item.duration;
  return {
    title: [degree, school].filter(Boolean).join(' - ') || 'Education entry',
    meta: period || null,
  };
};

export default function ResumeUploadPage() {
  const searchParams = useSearchParams();
  const { hasAllowedRole, isCheckingAccess } = useRoleAccess({ allowedRoles: ['student'] });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resume, setResume] = useState<Resume | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [loading, setLoading] = useState(true);
  const [entryMode, setEntryMode] = useState<EntryMode>('upload');
  const [selectedBeginnerTrack, setSelectedBeginnerTrack] = useState<BeginnerBlueprint | null>(null);

  const fetchResume = useCallback(async () => {
    try {
      const data = await getResume();
      setResume(data);
    } catch (error: any) {
      setFeedback({
        tone: 'error',
        text: getReadableErrorMessage(error, 'Failed to load resume data.'),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasAllowedRole) return;
    void fetchResume();
  }, [fetchResume, hasAllowedRole]);

  useEffect(() => {
    if (resume) return;
    setEntryMode(searchParams.get('mode') === 'discover' ? 'discover' : 'upload');
  }, [resume, searchParams]);

  const validatePdf = useCallback((candidate: File) => {
    const isPdf =
      candidate.type === 'application/pdf' || candidate.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) return 'Invalid file type. Please upload a PDF.';
    if (candidate.size > 5 * 1024 * 1024) return 'File too large. Maximum size is 5MB.';
    return null;
  }, []);

  const setSelectedFile = useCallback(
    (candidate: File | null) => {
      if (!candidate) {
        setFile(null);
        return;
      }
      const validationError = validatePdf(candidate);
      if (validationError) {
        setFeedback({ tone: 'error', text: validationError });
        return;
      }
      setFeedback(null);
      setFile(candidate);
    },
    [validatePdf]
  );

  const handleDrag = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === 'dragenter' || event.type === 'dragover') setDragActive(true);
    if (event.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setDragActive(false);
      setSelectedFile(event.dataTransfer.files?.[0] || null);
    },
    [setSelectedFile]
  );

  const handleUpload = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setUploadProgress(0);
    setFeedback({ tone: 'info', text: 'Analyzing your resume...' });

    try {
      const parsedResume = await uploadResume(file, setUploadProgress);
      setResume(parsedResume);
      setFile(null);
      if (isResumeEffectivelyEmpty(parsedResume)) {
        setFeedback({
          tone: 'error',
          text: 'Resume uploaded, but content appears empty. Please upload a text-based PDF.',
        });
      } else {
        setFeedback({
          tone: 'success',
          text: 'Your resume has been parsed successfully.',
        });
      }
    } catch (error: any) {
      setFeedback({
        tone: 'error',
        text: getReadableErrorMessage(error, 'Failed to upload resume.'),
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!resume) return;
    if (!confirm('Are you sure you want to delete your resume?')) return;
    try {
      await deleteResume(resume.id);
      setResume(null);
      setFile(null);
      setFeedback({ tone: 'success', text: 'Resume deleted successfully.' });
    } catch (error: any) {
      setFeedback({
        tone: 'error',
        text: getReadableErrorMessage(error, 'Failed to delete resume.'),
      });
    }
  };

  const resumeSnapshot = useMemo(() => {
    const parsed = resume?.parsedData;
    const education = (parsed?.education || []).map(formatEducationItem);
    const experience = (parsed?.experience || []).map(formatExperienceItem);
    return {
      skills: resume?.skills || [],
      summary: parsed?.summary || '',
      name: parsed?.name || '',
      email: parsed?.email || '',
      phone: parsed?.phone || '',
      education,
      experience,
    };
  }, [resume]);

  if (isCheckingAccess) {
    return <Loading text="Checking resume workspace..." />;
  }

  if (!hasAllowedRole) return null;

  if (loading) {
    return (
      <div className="layout-container section-spacing space-y-8 max-w-6xl mx-auto">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-72 w-full" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const feedbackClass =
    feedback?.tone === 'success'
      ? 'border-gray-300 bg-gray-100 text-gray-800'
      : feedback?.tone === 'error'
        ? 'border-gray-300 bg-gray-100 text-gray-800'
        : 'border-accent-soft bg-white text-accent';

  const hasParsedContent = resume && !isResumeEffectivelyEmpty(resume);

  return (
    <div className="layout-container section-spacing space-y-8 max-w-6xl mx-auto">
      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr] xl:items-stretch">
        <Card hoverable={false} className="p-8 md:p-10">
          <div className="space-y-6">
            <div className="space-y-3">
              <Badge variant="secondary" className="w-fit">
                Resume workspace
              </Badge>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary md:text-4xl">
                  {resume
                    ? 'Upload your resume and review the extracted profile.'
                    : selectedBeginnerTrack
                      ? `Build your first resume for ${selectedBeginnerTrack.name}.`
                      : 'Choose your starting point for placement preparation.'}
                </h1>
                <p className="mt-3 max-w-2xl text-base text-secondary">
                  {resume
                    ? 'This is the source for your career recommendations, role match insights, and recruiter visibility. Use a clean text-based PDF for the best results.'
                    : selectedBeginnerTrack
                      ? `Your path is saved as ${selectedBeginnerTrack.name}. Create a one-page starter resume around this track, then upload it here to continue with the normal Esencelab flow.`
                      : 'If you already have a resume, upload it normally. If you are just starting out, discover a likely-fit domain first and build your first resume with the right structure.'}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
                  Resume status
                </p>
                <p className="mt-2 text-lg font-semibold text-primary">
                  {resume ? 'Uploaded' : 'Not uploaded'}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
                  Skills found
                </p>
                <p className="mt-2 text-lg font-semibold text-primary">
                  {resumeSnapshot.skills.length}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
                  Experience entries
                </p>
                <p className="mt-2 text-lg font-semibold text-primary">
                  {resumeSnapshot.experience.length}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card hoverable={false} className="p-8">
          {resume ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">Before you upload</h2>
              <div className="space-y-3 text-sm text-secondary">
                <p>Use PDF format only.</p>
                <p>Keep the file under 5 MB.</p>
                <p>Prefer selectable text over scanned image PDFs.</p>
                <p>Include skills, education, and project or internship details.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-primary">How would you like to start?</h2>
                <p className="mt-2 text-sm text-secondary">
                  Keep the existing upload flow if you already have a resume. Use the beginner path only if you are still figuring out your domain.
                </p>
              </div>
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => setEntryMode('upload')}
                  className={`rounded-2xl border p-4 text-left transition ${
                    entryMode === 'upload'
                      ? 'border-primary bg-white shadow-sm'
                      : 'border-border bg-white/70 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <UploadCloud className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold text-primary">I already have a resume</p>
                      <p className="mt-1 text-sm text-secondary">
                        Upload your PDF and continue with the existing Esencelab workflow.
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('discover')}
                  className={`rounded-2xl border p-4 text-left transition ${
                    entryMode === 'discover'
                      ? 'border-primary bg-white shadow-sm'
                      : 'border-border bg-white/70 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Compass className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold text-primary">I am new and need direction</p>
                      <p className="mt-1 text-sm text-secondary">
                        Discover a likely domain, then build a fresher-friendly resume around that path.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </Card>
      </section>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`rounded-2xl border px-5 py-4 text-sm font-medium shadow-sm ${feedbackClass}`}
          >
            <div className="flex items-center gap-3">
              {feedback.tone === 'error' ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
              <span>{feedback.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!resume && entryMode === 'discover' && (
        <BeginnerCareerStarter
          onUseUploadFlow={() => setEntryMode('upload')}
          onSavedTrack={({ message, track }) => {
            setSelectedBeginnerTrack(track);
            setEntryMode('upload');
            setFeedback({ tone: 'success', text: message });
          }}
          onError={(text) => setFeedback({ tone: 'error', text })}
        />
      )}

      <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <Card hoverable={false} className="p-8">
          <div
            className={`rounded-3xl border border-dashed p-8 text-center transition-all ${
              dragActive
                ? 'border-primary bg-white'
                : 'border-border bg-white/60 hover:border-primary/50 hover:bg-white'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              id="file-upload"
              type="file"
              accept=".pdf"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              className="hidden"
            />

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-white">
              <UploadCloud className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-primary">Upload a resume PDF</h2>
            <p className="mt-2 text-sm text-secondary">
              Drag and drop your file here, or browse from your device.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={() => document.getElementById('file-upload')?.click()}>
                Choose file
              </Button>
              {file && (
                <Button variant="outline" onClick={() => setFile(null)}>
                  <X className="mr-2 h-4 w-4" />
                  Clear selection
                </Button>
              )}
              {resume && (
                <Button variant="ghost" onClick={handleDelete} className="text-gray-700 hover:bg-gray-100">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete resume
                </Button>
              )}
            </div>

            {file && (
              <div className="mt-6 rounded-2xl border border-border bg-white p-4 text-left">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl border border-border bg-gray-50 p-2">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-primary">{file.name}</p>
                      <p className="text-sm text-secondary">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleUpload} disabled={uploading} isLoading={uploading}>
                    Upload and analyze
                  </Button>
                </div>
              </div>
            )}

            {uploading && (
              <div className="mt-6 space-y-3 text-left">
                <div className="flex items-center gap-2 text-sm text-secondary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Parsing resume...
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card hoverable={false} className="p-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-primary">
              {resume ? 'Current profile snapshot' : 'Starter resume guidance'}
            </h2>
            {!resume ? (
              selectedBeginnerTrack ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-white/70 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
                          Saved beginner path
                        </p>
                        <p className="mt-2 text-lg font-semibold text-primary">
                          {selectedBeginnerTrack.name}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-secondary">
                          {selectedBeginnerTrack.fitSummary}
                        </p>
                      </div>
                      <Badge variant="secondary">Path saved</Badge>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border bg-white/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
                      Skills to include or start learning
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedBeginnerTrack.starterSkills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-primary"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border bg-white/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
                      First resume checklist
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-secondary">
                      {selectedBeginnerTrack.resumeSections.map((section) => (
                        <li key={section}>{section}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/roadmaps?focus=${selectedBeginnerTrack.id}`}>
                      <Button variant="outline">Open recommended roadmaps</Button>
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedBeginnerTrack(null);
                        setEntryMode('discover');
                      }}
                    >
                      Change path
                    </Button>
                  </div>
                </div>
              ) : entryMode === 'discover' ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-white/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
                      What your first resume should include
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-secondary">
                      <li>One clean page with education, skills, projects, and links.</li>
                      <li>Projects should highlight your contribution, tools, and the result.</li>
                      <li>Only list technologies you can explain clearly.</li>
                      <li>Upload your first version here once it is ready.</li>
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-border bg-white/70 p-4 text-sm leading-6 text-secondary">
                    The normal Esencelab resume-analysis flow will continue exactly as usual after you upload your first draft.
                  </div>
                </div>
              ) : (
                <p className="text-sm text-secondary">
                  No resume uploaded yet. Once you upload one, this page will show your
                  parsed contact details, summary, skills, and extracted experience.
                </p>
              )
            ) : hasParsedContent ? (
              <>
                <div className="rounded-2xl border border-border bg-white/70 p-4">
                  <p className="text-lg font-semibold text-primary">
                    {resumeSnapshot.name || 'Unnamed candidate'}
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-secondary">
                    {resumeSnapshot.email && <p>{resumeSnapshot.email}</p>}
                    {resumeSnapshot.phone && <p>{resumeSnapshot.phone}</p>}
                    {!resumeSnapshot.email && !resumeSnapshot.phone && <p>Contact details not found.</p>}
                  </div>
                </div>

                {resumeSnapshot.summary && (
                  <div className="rounded-2xl border border-border bg-white/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
                      Professional summary
                    </p>
                    <p className="mt-2 text-sm leading-6 text-secondary">
                      {resumeSnapshot.summary}
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-border bg-white/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
                    Skills detected
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {resumeSnapshot.skills.length > 0 ? (
                      resumeSnapshot.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-primary"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-secondary">No skills detected yet.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-secondary">
                The resume was uploaded, but the parser could not extract enough structured
                text. Try a cleaner PDF export and upload again.
              </p>
            )}
          </div>
        </Card>
      </section>

      {resume && (
        <section className="grid gap-6 lg:grid-cols-2">
          <Card hoverable={false} className="p-6">
            <h2 className="text-xl font-semibold text-primary">Education</h2>
            {resumeSnapshot.education.length > 0 ? (
              <div className="mt-4 space-y-3">
                {resumeSnapshot.education.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="rounded-2xl border border-border bg-white/70 p-4">
                    <p className="font-medium text-primary">{item.title}</p>
                    {item.meta && <p className="mt-1 text-sm text-secondary">{item.meta}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-secondary">No education entries were extracted.</p>
            )}
          </Card>

          <Card hoverable={false} className="p-6">
            <h2 className="text-xl font-semibold text-primary">Experience</h2>
            {resumeSnapshot.experience.length > 0 ? (
              <div className="mt-4 space-y-3">
                {resumeSnapshot.experience.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="rounded-2xl border border-border bg-white/70 p-4">
                    <p className="font-medium text-primary">{item.title}</p>
                    {item.meta && <p className="mt-1 text-sm text-secondary">{item.meta}</p>}
                    {item.summary && (
                      <p className="mt-2 text-sm leading-6 text-secondary">{item.summary}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-secondary">No experience entries were extracted.</p>
            )}
          </Card>
        </section>
      )}
    </div>
  );
}
