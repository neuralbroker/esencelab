'use client';

/**
 * Student resume page.
 *
 * This page handles resume upload, replacement, parsing results, and the
 * latest stored resume insights for the signed-in student.
 */
import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, FileText, Loader2, UploadCloud, X, Trash2 } from 'lucide-react';
import { Resume } from '@/types';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import Loading from '@/components/Loading';
import { Skeleton } from '@/components/Skeleton';
import {
  deleteResume,
  getReadableErrorMessage,
  getResume,
  uploadResume,
} from '@/lib/dashboardApi';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoleAccess } from '@/lib/useRoleAccess';

type FeedbackTone = 'success' | 'error' | 'info';

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

export default function ResumeUploadPage() {
  const { hasAllowedRole, isCheckingAccess } = useRoleAccess({ allowedRoles: ['student'] });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resume, setResume] = useState<Resume | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [loading, setLoading] = useState(true);

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

  const validatePdf = useCallback((candidate: File) => {
    const isPdf =
      candidate.type === 'application/pdf' || candidate.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) return 'Invalid file type. Please upload a PDF.';
    if (candidate.size > 5 * 1024 * 1024) return 'File too large. Maximum size is 5MB.';
    return null;
  }, []);

  const setSelectedFile = useCallback((candidate: File | null) => {
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
  }, [validatePdf]);

  const handleDrag = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === 'dragenter' || event.type === 'dragover') setDragActive(true);
    if (event.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    setSelectedFile(event.dataTransfer.files?.[0] || null);
  }, [setSelectedFile]);

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
          text: 'Your profile has been analyzed successfully.',
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

  if (isCheckingAccess) {
    return <Loading text="Checking resume workspace..." />;
  }

  if (!hasAllowedRole) return null;

  const feedbackClass =
    feedback?.tone === 'success'
      ? 'border-gray-300 bg-gray-100 text-gray-800'
      : feedback?.tone === 'error'
        ? 'border-gray-300 bg-gray-100 text-gray-800'
        : 'border-accent-soft text-accent';

  if (loading) {
    return (
      <div className="layout-container section-spacing space-y-8 max-w-4xl mx-auto">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="layout-container section-spacing space-y-16 max-w-5xl mx-auto relative min-h-screen">

      {/* College Crest Watermark */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] z-0 mix-blend-multiply">
        <svg viewBox="0 0 400 400" className="w-[800px] h-[800px]" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M200 40 L320 100 L320 260 L200 360 L80 260 L80 100 Z" stroke="currentColor" strokeWidth="4" />
          <path d="M200 40 L200 360" stroke="currentColor" strokeWidth="4" />
          <path d="M80 100 L320 100" stroke="currentColor" strokeWidth="4" />
          <circle cx="200" cy="200" r="60" stroke="currentColor" strokeWidth="4" />
          <path d="M170 180 L230 180 M200 150 L200 210" stroke="currentColor" strokeWidth="4" />
        </svg>
      </div>

      <div className="relative z-10 space-y-4 text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-primary">Architectural Blueprint</h1>
        <p className="text-lg font-sans font-light text-secondary">A highly structured analysis of your technical foundation.</p>
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`rounded-2xl border-[0.5px] px-6 py-4 text-sm font-medium font-sans flex items-center gap-3 shadow-sm relative z-10 max-w-2xl mx-auto ${feedbackClass}`}
          >
            {feedback.tone === 'error' ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            {feedback.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <div
          className={`glass-panel rounded-[2.5rem] p-12 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[250px] relative overflow-hidden group ${dragActive ? 'border-accent bg-accent/5' : 'border-[0.5px] border-border hover:bg-white/60'
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          <input
            type="file"
            accept=".pdf"
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            className="hidden"
            id="file-upload"
          />

          {file ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center space-y-6 relative z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-black/20">
                <FileText className="h-8 w-8" />
              </div>
              <div className="text-center">
                <p className="font-serif font-bold text-primary text-2xl">{file.name}</p>
                <p className="text-xs font-sans font-bold uppercase tracking-widest text-secondary mt-2">{(file.size / 1024).toFixed(1)} KB Artifact</p>
              </div>
              <div className="flex gap-4 mt-6">
                <Button
                  variant="outline"
                  className="rounded-full px-8 h-12 font-sans font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  <X className="mr-2 h-4 w-4" /> Discard
                </Button>
                <Button
                  className="rounded-full px-8 h-12 font-serif text-lg bg-primary text-white hover:bg-black/90 shadow-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpload();
                  }}
                  isLoading={uploading}
                  disabled={uploading}
                >
                  <UploadCloud className="mr-2 h-5 w-5" /> Compile Matrix
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center relative z-10">
              <div className="w-20 h-20 bg-accent/5 text-accent border-[0.5px] border-accent/20 rounded-full flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <UploadCloud className="mx-auto h-8 w-8" />
              </div>
              <p className="mb-3 text-2xl font-serif text-primary">
                Ingest Artifact Blueprint
              </p>
              <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-secondary mb-8">Strictly PDF - Max 5MB</p>
              <Button className="rounded-full px-10 h-12 font-sans font-medium bg-white text-primary border-[0.5px] border-border shadow-sm pointer-events-none">Initialize Parsing Sequence</Button>
            </div>
          )}
        </div>

        {uploading && (
          <div className="mt-12 space-y-6 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-4 text-sm font-sans font-bold text-accent uppercase tracking-widest">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Deconstructing Vector Space...</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-border">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {resume && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 pt-16"
        >
          {/* Golden Timeline Line */}
          <div className="absolute left-[39px] md:left-[50%] top-24 bottom-0 w-[1px] bg-accent/40 shadow-[0_0_10px_rgba(172,172,172,0.3)] hidden sm:block" />

          <div className="space-y-16">

            {/* Header Node */}
            <div className="flex flex-col md:flex-row items-center justify-between glass-panel p-8 rounded-full relative z-10 max-w-3xl mx-auto">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                  <CheckCircle className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <span className="font-serif font-bold text-primary text-xl block">Blueprint Active</span>
                  <span className="text-[10px] font-sans uppercase tracking-widest text-secondary font-bold">Data Successfully Mapped</span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleDelete} className="text-gray-600 border-gray-300 hover:text-gray-800 hover:bg-gray-100 rounded-full h-10 px-6 mt-4 md:mt-0 font-sans font-medium">
                <Trash2 className="mr-2 w-4 h-4" /> Purge
              </Button>
            </div>

            {/* Content Nodes */}
            <div className="relative z-10 max-w-4xl mx-auto space-y-12">

              {resume.parsedData && (
                <div className="glass-panel p-10 rounded-[2.5rem] relative">
                  <div className="absolute -left-[53px] md:left-1/2 md:-translate-x-[26px] top-1/2 -translate-y-1/2 w-4 h-4 bg-primary border-2 border-accent rounded-full z-20 hidden sm:block" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                      <h4 className="mb-3 text-[10px] font-sans font-bold uppercase tracking-widest text-secondary">Identity Vector</h4>
                      <p className="font-serif text-3xl font-bold text-primary">{resume.parsedData.name || 'Unknown'}</p>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <h4 className="mb-2 text-[10px] font-sans font-bold uppercase tracking-widest text-secondary">Contact Protocol</h4>
                        <p className="font-sans text-lg text-primary">{resume.parsedData.email || 'N/A'}</p>
                        <p className="font-sans text-primary">{resume.parsedData.phone || 'N/A'}</p>
                      </div>
                    </div>
                    {resume.parsedData.summary && (
                      <div className="md:col-span-2 pt-6 border-t-[0.5px] border-border">
                        <h4 className="mb-4 text-[10px] font-sans font-bold uppercase tracking-widest text-secondary">Objective Summary</h4>
                        <p className="font-sans font-light text-secondary leading-relaxed text-lg">{resume.parsedData.summary}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {resume.skills && resume.skills.length > 0 && (
                <div className="glass-panel p-10 rounded-[2.5rem] relative">
                  <div className="absolute -left-[53px] md:left-1/2 md:-translate-x-[26px] top-1/2 -translate-y-1/2 w-4 h-4 bg-black border-2 border-white rounded-full z-20 shadow-[0_0_15px_rgba(255,255,255,0.8)] hidden sm:block" />

                  <h4 className="mb-8 text-2xl font-serif text-primary">Skill Distribution Nodes</h4>
                  <div className="flex flex-wrap gap-4">
                    {resume.skills.map((skill, index) => (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        key={index}
                        className="px-5 py-2.5 rounded-none font-sans font-bold text-xs uppercase tracking-widest border border-primary bg-primary text-white shadow-xl"
                      >
                        {skill}
                      </motion.div>
                    ))}
                    {/* Dummy Missing Skill styling for effect */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      className="px-5 py-2.5 rounded-none font-sans font-bold text-xs uppercase tracking-widest border border-accent/40 bg-transparent text-accent shadow-[0_0_15px_rgba(172,172,172,0.2)]"
                    >
                      SYSTEM ARCHITECTURE (missing)
                    </motion.div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}



