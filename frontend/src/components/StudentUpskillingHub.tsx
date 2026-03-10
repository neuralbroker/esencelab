'use client';

/**
 * Student upskilling workspace.
 *
 * This component groups roadmap progress, learning plans, AI coach output,
 * recommendations, and interview prep into one student-focused panel.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  Bot,
  BookmarkPlus,
  CheckCircle2,
  Compass,
  LineChart,
  Lightbulb,
  Loader2,
  RefreshCcw,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import { CircularProgress, ProgressBar } from '@/components/Progress';
import { Skeleton } from '@/components/Skeleton';
import {
  CareerOverview,
  LearningPlan,
  Resume,
  StudentAICoachResponse,
  StudentRecommendations,
  StudentResource,
} from '@/types';
import {
  askStudentAICoach,
  clearRecommendationCache,
  getCareerOverview,
  getLearningPlan,
  getReadableErrorMessage,
  getResume,
  regenerateLearningPlan,
  saveJobForLater,
  updateRoadmapSkill,
  uploadResume,
} from '@/lib/dashboardApi';
import {
  getRoleStarterResources,
  getSkillGapResources,
  getTopResourceRecommendation,
} from '@/lib/studentResources';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

interface StudentUpskillingHubProps {
  recommendations: StudentRecommendations | null;
  onRefresh: () => Promise<void>;
}

type FeedbackTone = 'success' | 'error' | 'info';
type RoadmapStatus = 'completed' | 'in_progress' | 'missing';

interface FeedbackState {
  tone: FeedbackTone;
  text: string;
}

const scoreToPercent = (score: number) => {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, score <= 1 ? Math.round(score * 100) : Math.round(score)));
};

const oneLine = (text: string | undefined, max = 98) => {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return 'Recommended based on your current resume and skills.';
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}...`;
};

const shortDate = (value: string | Date) =>
  new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const validatePdf = (candidate: File) => {
  const isPdf = candidate.type === 'application/pdf' || candidate.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) return 'Invalid PDF. Please upload a valid resume PDF file.';
  if (candidate.size > 5 * 1024 * 1024) return 'File is too large. Maximum allowed size is 5MB.';
  return null;
};

const aiCoachFeatures: Array<{
  value: 'skill_gap' | 'resume_improvement' | 'interview_prep' | 'project_ideas' | 'study_plan';
  label: string;
}> = [
  { value: 'skill_gap', label: 'Skill gap coach' },
  { value: 'resume_improvement', label: 'Resume upgrade' },
  { value: 'interview_prep', label: 'Interview prep' },
  { value: 'project_ideas', label: 'Project ideas' },
  { value: 'study_plan', label: 'Study plan' },
];

export default function StudentUpskillingHub({
  recommendations,
  onRefresh,
}: StudentUpskillingHubProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [overview, setOverview] = useState<CareerOverview | null>(null);
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null);
  const [learningDuration, setLearningDuration] = useState<30 | 60>(30);
  const [loadingLearningPlan, setLoadingLearningPlan] = useState(false);
  const [regeneratingPlan, setRegeneratingPlan] = useState(false);
  const [updatingSkill, setUpdatingSkill] = useState<string | null>(null);
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  const [aiFeature, setAiFeature] = useState<
    'skill_gap' | 'resume_improvement' | 'interview_prep' | 'project_ideas' | 'study_plan'
  >('skill_gap');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCoachResponse, setAiCoachResponse] = useState<StudentAICoachResponse | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const resumeData = await getResume();
      setResume(resumeData);

      if (resumeData) {
        const overviewData = await getCareerOverview();
        setOverview(overviewData);
      } else {
        setOverview(null);
        setLearningPlan(null);
      }
    } catch (error: any) {
      setFeedback({
        tone: 'error',
        text: getReadableErrorMessage(error, 'Unable to load dashboard data.'),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLearningPlanForDuration = useCallback(
    async (duration: 30 | 60, forceRegenerate = false) => {
      if (!overview?.roleId || !resume) return false;

      if (forceRegenerate) {
        setRegeneratingPlan(true);
      } else {
        setLoadingLearningPlan(true);
      }

      try {
        const planData = forceRegenerate
          ? await regenerateLearningPlan(overview.roleId, duration)
          : await getLearningPlan(overview.roleId, duration);
        setLearningPlan(planData);
        return true;
      } catch (error: any) {
        setFeedback({
          tone: 'error',
          text: getReadableErrorMessage(error, 'Unable to load learning plan.'),
        });
        return false;
      } finally {
        setLoadingLearningPlan(false);
        setRegeneratingPlan(false);
      }
    },
    [overview?.roleId, resume]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!resume?.id || !overview?.roleId) {
      setLearningPlan(null);
      return;
    }
    void loadLearningPlanForDuration(learningDuration, false);
  }, [learningDuration, loadLearningPlanForDuration, overview?.roleId, resume?.id]);

  const topRecommendedJobs = useMemo(() => {
    return (recommendations?.recommendedJobs || []).slice(0, 3);
  }, [recommendations?.recommendedJobs]);

  const topMissingSkills = useMemo(() => {
    const recommendationSkills = (recommendations?.missingSkills || []).slice(0, 8);
    if (recommendationSkills.length > 0) return recommendationSkills;
    return (overview?.missingSkills || []).slice(0, 8);
  }, [overview?.missingSkills, recommendations?.missingSkills]);

  const roleStarterResources = useMemo(() => {
    if (!overview?.roleId) return [] as StudentResource[];
    return getRoleStarterResources(overview.roleId, 4);
  }, [overview?.roleId]);

  const skillGapResources = useMemo(() => {
    if (!overview?.roleId) return [] as StudentResource[];
    return getSkillGapResources(overview.roleId, topMissingSkills, 8);
  }, [overview?.roleId, topMissingSkills]);

  const topResourceRecommendation = useMemo(() => {
    if (!overview?.roleId) return null;
    return getTopResourceRecommendation(overview.roleId, topMissingSkills);
  }, [overview?.roleId, topMissingSkills]);

  const readiness = useMemo(() => {
    if (overview?.latestScore) return scoreToPercent(overview.latestScore.score);
    if (topRecommendedJobs.length > 0) {
      const avg =
        topRecommendedJobs.reduce((sum, entry) => sum + scoreToPercent(entry.matchScore), 0) /
        topRecommendedJobs.length;
      return Math.round(avg);
    }
    return 25;
  }, [overview?.latestScore, topRecommendedJobs]);

  const targetRole = useMemo(() => {
    return overview?.role?.name || topRecommendedJobs[0]?.job?.title || 'your selected role';
  }, [overview?.role?.name, topRecommendedJobs]);

  const roadmapByLevel = useMemo(() => {
    const grouped: Record<string, Array<{ skill: string; status: RoadmapStatus; level?: string }>> = {
      beginner: [],
      intermediate: [],
      advanced: [],
      other: [],
    };
    (overview?.roadmap || []).forEach((item) => {
      const level = item.level || 'other';
      if (!grouped[level]) grouped[level] = [];
      grouped[level].push(item);
    });
    return grouped;
  }, [overview?.roadmap]);

  const scoreSections = useMemo(() => {
    const sectionScores = overview?.latestScore?.sectionScores;
    if (!sectionScores) return [] as Array<{ key: string; label: string; value: number }>;

    return [
      {
        key: 'skillsCompleteness',
        label: 'Skills completeness',
        value: scoreToPercent(Number(sectionScores.skillsCompleteness ?? sectionScores.skills ?? 0)),
      },
      {
        key: 'experienceRelevance',
        label: 'Experience relevance',
        value: scoreToPercent(Number(sectionScores.experienceRelevance ?? sectionScores.experience ?? 0)),
      },
      {
        key: 'projectStrength',
        label: 'Project quality',
        value: scoreToPercent(Number(sectionScores.projectStrength ?? sectionScores.projects ?? 0)),
      },
      {
        key: 'formattingConsistency',
        label: 'Resume structure',
        value: scoreToPercent(Number(sectionScores.formattingConsistency ?? sectionScores.education ?? 0)),
      },
    ];
  }, [overview?.latestScore?.sectionScores]);

  const scoreTrend = useMemo(() => {
    const historyScores = (overview?.scoreHistory || []).map((entry) => scoreToPercent(Number(entry.score || 0)));
    if (historyScores.length === 0) return null;

    const width = 340;
    const height = 120;
    const padding = 10;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;
    const maxIndex = Math.max(historyScores.length - 1, 1);

    const points = historyScores.map((score, index) => {
      const x = padding + (index / maxIndex) * usableWidth;
      const y = padding + (1 - score / 100) * usableHeight;
      return {
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2)),
      };
    });

    const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');
    const area = `${padding},${height - padding} ${polyline} ${width - padding},${height - padding}`;

    return { width, height, points, polyline, area };
  }, [overview?.scoreHistory]);

  const skillCompletionPercent = useMemo(() => {
    if (!overview?.progress?.totalSkills) return 0;
    return Math.round((overview.progress.skillsCompleted / overview.progress.totalSkills) * 100);
  }, [overview?.progress?.skillsCompleted, overview?.progress?.totalSkills]);

  const skillInProgressPercent = useMemo(() => {
    if (!overview?.progress?.totalSkills) return 0;
    return Math.round((overview.progress.skillsInProgress / overview.progress.totalSkills) * 100);
  }, [overview?.progress?.skillsInProgress, overview?.progress?.totalSkills]);

  const trackedApplicationCount = useMemo(() => {
    const counts = overview?.applicationStatusCounts;
    if (!counts) return 0;
    return counts.saved + counts.applied + counts.interviewing + counts.offer + counts.rejected;
  }, [overview?.applicationStatusCounts]);
  const firstScoreEntry = overview?.scoreHistory?.[0] || null;
  const lastScoreEntry =
    overview?.scoreHistory?.[overview.scoreHistory.length - 1] || null;

  const nextStepCards = useMemo(() => {
    const cards: Array<{
      id: string;
      eyebrow: string;
      title: string;
      detail: string;
      href?: string;
      external?: boolean;
      cta: string;
    }> = [];

    if (topMissingSkills[0]) {
      cards.push({
        id: 'gap',
        eyebrow: 'Close this gap first',
        title: topMissingSkills[0],
        detail: `This skill appears in your current roadmap and role-fit gaps. Marking it in progress will improve the rest of your plan.`,
        cta: 'Update roadmap below',
      });
    }

    if (topResourceRecommendation) {
      cards.push({
        id: 'resource',
        eyebrow: 'Study this next',
        title: topResourceRecommendation.title,
        detail: topResourceRecommendation.whyItHelps,
        href: topResourceRecommendation.url,
        external: true,
        cta: 'Open resource',
      });
    }

    if (topRecommendedJobs[0]) {
      cards.push({
        id: 'job',
        eyebrow: 'Best current opportunity',
        title: topRecommendedJobs[0].job.title,
        detail: `${scoreToPercent(topRecommendedJobs[0].matchScore)}% match at ${topRecommendedJobs[0].job.company}.`,
        href: `/jobs/${topRecommendedJobs[0].job.id}`,
        cta: 'View job',
      });
    }

    return cards.slice(0, 3);
  }, [topMissingSkills, topRecommendedJobs, topResourceRecommendation]);

  const handleRoadmapStatusCycle = async (skillName: string, current: RoadmapStatus) => {
    if (!overview || updatingSkill) return;
    const nextStatus: RoadmapStatus =
      current === 'missing' ? 'in_progress' : current === 'in_progress' ? 'completed' : 'missing';

    setUpdatingSkill(skillName);
    try {
      const result = await updateRoadmapSkill({
        roleId: overview.roleId,
        skillName,
        status: nextStatus,
      });
      setOverview((prev) => (prev ? { ...prev, roadmap: result.roadmap } : prev));
    } catch (error: any) {
      setFeedback({
        tone: 'error',
        text: getReadableErrorMessage(error, 'Unable to update roadmap skill right now.'),
      });
    } finally {
      setUpdatingSkill(null);
    }
  };

  const processResumeUpload = async (candidate: File | null) => {
    if (!candidate || uploading) return;
    const validationError = validatePdf(candidate);
    if (validationError) {
      setFeedback({ tone: 'error', text: validationError });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setFeedback({ tone: 'info', text: 'Analyzing your resume...' });

    try {
      const parsedResume = await uploadResume(candidate, setUploadProgress);
      setResume(parsedResume);
      if (user?.id) clearRecommendationCache(user.id);
      await Promise.all([onRefresh(), loadData()]);
      setFeedback({
        tone: 'success',
        text: 'Your profile has been analyzed successfully.',
      });
    } catch (error: any) {
      setFeedback({
        tone: 'error',
        text: getReadableErrorMessage(error, 'Unable to analyze your resume right now.'),
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRegenerateLearningPlan = async () => {
    const isUpdated = await loadLearningPlanForDuration(learningDuration, true);
    if (isUpdated) {
      setFeedback({
        tone: 'success',
        text: `${learningDuration}-day learning plan regenerated.`,
      });
    }
  };

  const handleSaveJob = async (jobId: string) => {
    if (savingJobId) return;
    setSavingJobId(jobId);
    try {
      await saveJobForLater(jobId);
      const updatedOverview = await getCareerOverview();
      setOverview(updatedOverview);
      setFeedback({ tone: 'success', text: 'Job saved to your application tracker.' });
    } catch (error: any) {
      setFeedback({
        tone: 'error',
        text: getReadableErrorMessage(error, 'Unable to save this job right now.'),
      });
    } finally {
      setSavingJobId(null);
    }
  };

  const handleRunAICoach = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    try {
      const result = await askStudentAICoach({
        feature: aiFeature,
        prompt: aiPrompt,
      });
      setAiCoachResponse(result);
      setFeedback({
        tone: 'success',
        text:
          result.provider === 'groq'
            ? 'AI coach response generated.'
            : 'AI fallback guidance generated.',
      });
    } catch (error: any) {
      setFeedback({
        tone: 'error',
        text: getReadableErrorMessage(error, 'Unable to generate AI guidance right now.'),
      });
    } finally {
      setAiLoading(false);
    }
  };

  const feedbackClass =
    feedback?.tone === 'success'
      ? 'border-gray-300 bg-gray-100 text-gray-800'
      : feedback?.tone === 'error'
        ? 'border-gray-300 bg-gray-100 text-gray-800'
        : 'border-accent-soft text-accent';

  if (loading) {
    return (
      <div className="space-y-8 layout-container section-spacing">
        <Skeleton className="h-24 w-full max-w-2xl" />
        <Skeleton className="h-64 w-full" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="layout-container section-spacing flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-serif font-semibold tracking-tight text-primary mb-3">
              Upload Your Resume
            </h2>
            <p className="text-base text-secondary">Upload a PDF to generate career insights and role matching.</p>
          </div>

          <Card
            hoverable={false}
            className="border-dashed border-2 bg-transparent hover:bg-white/40 transition-colors p-12 flex flex-col items-center justify-center text-center cursor-pointer"
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            {uploading ? (
              <div className="w-full max-w-sm space-y-4">
                <div className="flex items-center justify-center gap-3 text-sm text-secondary">
                  <Loader2 className="h-5 w-5 animate-spin text-accent" />
                  <span>Analyzing your resume...</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-accent-soft text-accent rounded-full flex items-center justify-center mb-6">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-primary mb-2">Drag and drop your resume here</h3>
                <p className="text-sm text-secondary mb-6">PDF files up to 5MB</p>
                <Button variant="primary">Browse Files</Button>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(event) => {
                void processResumeUpload(event.target.files?.[0] || null);
                event.currentTarget.value = '';
              }}
            />
          </Card>

          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mt-6 rounded-xl border px-4 py-3 text-sm flex items-center gap-3 ${feedbackClass}`}
              >
                {feedback.tone === 'error' ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                {feedback.text}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="layout-container section-spacing space-y-12">
      <section className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-primary leading-tight">
          Career Control Center
        </h1>
        <p className="text-base text-secondary max-w-3xl">
          {recommendations?.summary ||
            `Track your readiness, close skill gaps, and target better roles as a ${targetRole} candidate.`}
        </p>
      </section>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`rounded-2xl border-[0.5px] px-6 py-4 text-sm font-medium font-sans flex items-center gap-3 shadow-sm ${feedbackClass}`}
          >
            {feedback.tone === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            {feedback.text}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card hoverable={false} className="p-5 space-y-2">
          <p className="text-xs uppercase tracking-[0.12em] text-secondary">Career readiness</p>
          <p className="text-3xl font-semibold text-primary">{readiness}%</p>
        </Card>
        <Card hoverable={false} className="p-5 space-y-2">
          <p className="text-xs uppercase tracking-[0.12em] text-secondary">Resume improvement</p>
          <p className="text-3xl font-semibold text-primary">+{overview?.progress?.resumeImprovement || 0}%</p>
        </Card>
        <Card hoverable={false} className="p-5 space-y-2">
          <p className="text-xs uppercase tracking-[0.12em] text-secondary">Skills completed</p>
          <p className="text-3xl font-semibold text-primary">
            {overview?.progress?.skillsCompleted || 0}/{overview?.progress?.totalSkills || 0}
          </p>
        </Card>
        <Card hoverable={false} className="p-5 space-y-2">
          <p className="text-xs uppercase tracking-[0.12em] text-secondary">Applications tracked</p>
          <p className="text-3xl font-semibold text-primary">{trackedApplicationCount}</p>
        </Card>
      </section>

      <section>
        <div className="glass-panel flex flex-col md:flex-row items-center justify-between gap-12 p-8 md:p-12 rounded-[2.5rem]">
          <div className="space-y-5 max-w-lg text-center md:text-left flex-1">
            <h2 className="text-3xl font-serif text-primary">Resume Strength Score</h2>
            <p className="text-base text-secondary">
              Your resume is <span className="font-semibold text-primary">{readiness}% optimized</span> for the{' '}
              <span className="font-semibold text-primary">{targetRole}</span> role.
            </p>
            {uploading ? (
              <div className="flex items-center md:justify-start justify-center gap-3 text-sm font-medium text-accent">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Updating profile insights...</span>
              </div>
            ) : (
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="h-11 px-7 rounded-full text-base bg-primary text-white hover:bg-black/80 transition-all"
              >
                Update Resume
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(event) => {
                void processResumeUpload(event.target.files?.[0] || null);
                event.currentTarget.value = '';
              }}
            />
          </div>
          <div className="flex-shrink-0 relative">
            <div className="absolute inset-0 bg-accent/10 blur-[50px] rounded-full" />
            <div className="p-4 rounded-full border-[0.5px] border-border bg-white/50 relative z-10 shadow-2xl shadow-black/5">
              <CircularProgress value={readiness} max={100} size={180} strokeWidth={8} />
            </div>
          </div>
        </div>
      </section>

      {overview?.latestScore && (
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <h2 className="text-2xl font-serif text-primary">Resume Score Breakdown</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
            <Card hoverable={false} className="p-6 space-y-5">
              {scoreSections.map((section) => (
                <div key={section.key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary">{section.label}</span>
                    <span className="font-semibold text-primary">{section.value}%</span>
                  </div>
                  <ProgressBar
                    value={section.value}
                    className="h-2 bg-white"
                    barClassName={section.value >= 75 ? 'bg-[#111111]' : section.value >= 55 ? 'bg-[#4b4b4b]' : 'bg-[#a3a3a3]'}
                  />
                </div>
              ))}
            </Card>
            <Card hoverable={false} className="p-6">
              <p className="text-xs uppercase tracking-[0.12em] text-secondary mb-3">Improve next</p>
              <ul className="space-y-2 text-sm text-secondary">
                {(overview.latestScore.suggestions || []).slice(0, 4).map((item) => (
                  <li key={item} className="rounded-lg border border-border bg-white/70 px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>
      )}

      <section className="space-y-6">
        <h2 className="text-2xl font-serif text-primary">Skill Gap Summary</h2>
        <div className="flex flex-wrap gap-3">
          {topMissingSkills.length > 0 ? (
            topMissingSkills.map((skill) => (
              <div
                key={skill}
                className="px-4 py-2 rounded-xl border-[0.5px] border-accent/20 bg-accent/5 text-accent text-xs font-semibold uppercase tracking-widest"
              >
                {skill}
              </div>
            ))
          ) : (
            <p className="text-sm text-secondary bg-white/50 border-[0.5px] border-border py-4 px-6 rounded-2xl w-full">
              Great progress. Your profile already covers most role requirements.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <Card hoverable={false} className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif text-primary">Progress Tracking</h2>
            <Badge variant="secondary">
              <LineChart className="mr-1 h-3 w-3" /> Score history
            </Badge>
          </div>

          {scoreTrend && (overview?.scoreHistory || []).length > 0 ? (
            <>
              <div className="rounded-2xl border border-border bg-white/60 p-3">
                <svg viewBox={`0 0 ${scoreTrend.width} ${scoreTrend.height}`} className="h-32 w-full" role="img" aria-label="Resume score trend">
                  <polyline points={scoreTrend.area} fill="rgba(17,17,17,0.16)" stroke="none" />
                  <polyline
                    points={scoreTrend.polyline}
                    fill="none"
                    stroke="rgba(17,17,17,1)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {scoreTrend.points.map((point, index) => (
                    <circle key={`${point.x}-${point.y}-${index}`} cx={point.x} cy={point.y} r="2.5" fill="rgba(17,17,17,1)" />
                  ))}
                </svg>
              </div>
              <div className="flex items-center justify-between text-xs text-secondary">
                <span>{firstScoreEntry ? shortDate(firstScoreEntry.createdAt) : '-'}</span>
                <span>{lastScoreEntry ? shortDate(lastScoreEntry.createdAt) : '-'}</span>
              </div>
              <p className="text-sm text-secondary">
                You improved <span className="font-semibold text-primary">{overview?.progress?.resumeImprovement || 0}%</span> in this period.
              </p>
            </>
          ) : (
            <p className="text-sm text-secondary">Upload and update your resume to start tracking score history.</p>
          )}
        </Card>

        <Card hoverable={false} className="p-6 space-y-5">
          <h2 className="text-xl font-serif text-primary">Module Snapshot</h2>
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm text-secondary">
                <span>Skill completion</span>
                <span>{skillCompletionPercent}%</span>
              </div>
              <ProgressBar value={skillCompletionPercent} className="h-2" barClassName="bg-[#111111]" />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm text-secondary">
                <span>Skills in progress</span>
                <span>{skillInProgressPercent}%</span>
              </div>
              <ProgressBar value={skillInProgressPercent} className="h-2" barClassName="bg-[#4b4b4b]" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white/60 p-4 text-sm text-secondary space-y-1">
            <p>Saved: {overview?.applicationStatusCounts?.saved || 0}</p>
            <p>Applied: {overview?.applicationStatusCounts?.applied || 0}</p>
            <p>Interviewing: {overview?.applicationStatusCounts?.interviewing || 0}</p>
            <p>Offer: {overview?.applicationStatusCounts?.offer || 0}</p>
            <p>Rejected: {overview?.applicationStatusCounts?.rejected || 0}</p>
          </div>

          <Link href="/applications" className="inline-flex items-center text-sm font-semibold text-accent hover:underline">
            Open application tracker <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </Card>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-serif text-primary">Skill Roadmap Checklist</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
            <Card key={level} hoverable={false} className="p-5 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-secondary">{level}</h3>
              {(roadmapByLevel[level] || []).length > 0 ? (
                <div className="space-y-2">
                  {(roadmapByLevel[level] || []).map((item) => (
                    <button
                      key={`${level}-${item.skill}`}
                      onClick={() => void handleRoadmapStatusCycle(item.skill, item.status)}
                      disabled={updatingSkill === item.skill}
                      className="w-full rounded-xl border border-border bg-white/70 px-3 py-2 text-left text-sm transition hover:bg-white disabled:opacity-60"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="line-clamp-1">{item.skill}</span>
                        <Badge
                          variant={
                            item.status === 'completed'
                              ? 'success'
                              : item.status === 'in_progress'
                                ? 'warning'
                                : 'secondary'
                          }
                        >
                          {item.status}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-secondary">No skills mapped in this stage.</p>
              )}
            </Card>
          ))}
        </div>
      </section>

      {nextStepCards.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-accent" />
            <h2 className="text-2xl font-serif text-primary">What To Do Next</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {nextStepCards.map((card) => (
              <Card key={card.id} hoverable={false} className="p-5 space-y-3">
                <p className="text-xs uppercase tracking-[0.12em] text-secondary">{card.eyebrow}</p>
                <h3 className="text-lg font-semibold text-primary">{card.title}</h3>
                <p className="text-sm text-secondary">{card.detail}</p>
                {card.href ? (
                  card.external ? (
                    <a
                      href={card.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-semibold text-accent hover:underline"
                    >
                      {card.cta} <ArrowUpRight className="ml-1 h-4 w-4" />
                    </a>
                  ) : (
                    <Link href={card.href} className="inline-flex items-center text-sm font-semibold text-accent hover:underline">
                      {card.cta} <ArrowUpRight className="ml-1 h-4 w-4" />
                    </Link>
                  )
                ) : (
                  <span className="inline-flex items-center text-sm font-semibold text-accent">
                    {card.cta}
                  </span>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-serif text-primary">Learning Plan</h2>
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-border bg-white/70 p-1">
              <button
                type="button"
                onClick={() => setLearningDuration(30)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  learningDuration === 30 ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
                }`}
              >
                30-Day
              </button>
              <button
                type="button"
                onClick={() => setLearningDuration(60)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  learningDuration === 60 ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
                }`}
              >
                60-Day
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              isLoading={regeneratingPlan}
              onClick={() => void handleRegenerateLearningPlan()}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
          </div>
        </div>

        {loadingLearningPlan ? (
          <Card hoverable={false} className="p-6 text-sm text-secondary">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading learning plan...
            </div>
          </Card>
        ) : learningPlan?.planData?.weeks?.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {learningPlan.planData.weeks
              .slice(0, learningDuration === 60 ? 8 : 4)
              .map((week) => (
                <Card key={week.week} hoverable={false} className="p-5 space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-secondary">Week {week.week}</p>
                    <h3 className="text-lg font-semibold text-primary">{week.title}</h3>
                  </div>
                  <ul className="space-y-1 text-sm text-secondary">
                    {week.goals.slice(0, 3).map((goal) => (
                      <li key={goal} className="line-clamp-2">
                        {goal}
                      </li>
                    ))}
                  </ul>
                  {week.resources?.length > 0 && (
                    <a
                      href={week.resources[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex text-sm font-semibold text-accent hover:underline"
                    >
                      Resource: {week.resources[0].title}
                    </a>
                  )}
                </Card>
              ))}
          </div>
        ) : (
          <Card hoverable={false} className="p-6 text-sm text-secondary">
            Learning plan will appear after roadmap generation.
          </Card>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-accent" />
          <h2 className="text-2xl font-serif text-primary">AI Career Coach</h2>
        </div>
        <Card hoverable={false} className="p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-[220px,1fr]">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-secondary">Feature</label>
              <select
                value={aiFeature}
                onChange={(event) =>
                  setAiFeature(
                    event.target.value as
                      | 'skill_gap'
                      | 'resume_improvement'
                      | 'interview_prep'
                      | 'project_ideas'
                      | 'study_plan'
                  )
                }
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
              >
                {aiCoachFeatures.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-secondary">Prompt (optional)</label>
              <input
                value={aiPrompt}
                onChange={(event) => setAiPrompt(event.target.value)}
                placeholder="Example: Help me plan next 2 weeks for backend interviews."
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button isLoading={aiLoading} onClick={() => void handleRunAICoach()} className="rounded-full">
              Generate guidance
            </Button>
            {aiCoachResponse && (
              <Badge variant="secondary">
                Provider: {aiCoachResponse.provider}
                {aiCoachResponse.model ? ` (${aiCoachResponse.model})` : ''}
              </Badge>
            )}
          </div>

          {aiCoachResponse && (
            <div className="space-y-4 rounded-2xl border border-border bg-white/70 p-4">
              <h3 className="text-lg font-semibold text-primary">{aiCoachResponse.title}</h3>
              <p className="text-sm text-secondary">{aiCoachResponse.summary}</p>
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-secondary">Action Items</p>
                <ul className="space-y-2">
                  {aiCoachResponse.actionItems.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-secondary">
                      <Lightbulb className="mt-0.5 h-4 w-4 text-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {aiCoachResponse.followUpQuestions.length > 0 && (
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.12em] text-secondary">Follow-up</p>
                  <div className="flex flex-wrap gap-2">
                    {aiCoachResponse.followUpQuestions.map((question) => (
                      <span
                        key={question}
                        className="rounded-full border border-border bg-white px-3 py-1 text-xs text-secondary"
                      >
                        {question}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" />
            <h2 className="text-2xl font-serif text-primary">Student Resource Library</h2>
          </div>
          <Badge variant="secondary">Curated free resources from official and trusted sources</Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <Card hoverable={false} className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-secondary">Best matches for your gaps</p>
                <h3 className="text-xl font-serif text-primary">Start with these resources</h3>
              </div>
              <Link href="/courses" className="text-sm font-semibold text-accent hover:underline">
                Open courses page
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {skillGapResources.length > 0 ? (
                skillGapResources.map((resource) => (
                  <div key={resource.id} className="rounded-2xl border border-border bg-white/70 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-semibold text-primary">{resource.title}</h4>
                        <p className="text-xs uppercase tracking-[0.12em] text-secondary">{resource.provider}</p>
                      </div>
                      <Badge variant="secondary">{resource.level.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-sm text-secondary">{resource.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {resource.skills.slice(0, 4).map((skill) => (
                        <span
                          key={`${resource.id}-${skill}`}
                          className="rounded-full border border-border bg-white px-2.5 py-1 text-[11px] text-secondary"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-secondary">
                      <span className="font-semibold text-primary">Why this helps:</span> {resource.whyItHelps}
                    </p>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-semibold text-accent hover:underline"
                    >
                      Open resource <ArrowUpRight className="ml-1 h-4 w-4" />
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-sm text-secondary">No extra resources are needed right now. Your gaps are already narrow.</p>
              )}
            </div>
          </Card>

          <Card hoverable={false} className="p-6 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-secondary">Role starter pack</p>
              <h3 className="text-xl font-serif text-primary">Trusted resources for {targetRole}</h3>
            </div>

            <div className="space-y-3">
              {roleStarterResources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl border border-border bg-white/70 p-4 transition hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-primary">{resource.title}</h4>
                      <p className="mt-1 text-sm text-secondary">{resource.provider}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-accent" />
                  </div>
                  <p className="mt-2 text-sm text-secondary">{resource.whyItHelps}</p>
                </a>
              ))}
            </div>

            {overview?.role?.suggestedTools?.length ? (
              <div className="rounded-2xl border border-border bg-white/60 p-4">
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-secondary">Tools to install or practice</p>
                <div className="flex flex-wrap gap-2">
                  {overview.role.suggestedTools.map((tool) => (
                    <span key={tool} className="rounded-full border border-border bg-white px-2.5 py-1 text-[11px] text-secondary">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-serif text-primary">Top Job Recommendations</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {topRecommendedJobs.length > 0 ? (
            topRecommendedJobs.map((entry) => {
              const match = scoreToPercent(entry.matchScore);
              const requiredSkills =
                entry.requiredSkills && entry.requiredSkills.length > 0
                  ? entry.requiredSkills
                  : Array.isArray(entry.job.skills)
                    ? entry.job.skills
                    : [];

              return (
                <div
                  key={entry.job.id}
                  className="p-6 rounded-3xl border-[0.5px] border-border bg-white/50 hover:bg-white transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 flex flex-col group"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-primary line-clamp-1 mb-1 group-hover:text-accent transition-colors">
                        {entry.job.title}
                      </h3>
                      <p className="text-sm text-secondary uppercase tracking-widest font-semibold">
                        {entry.job.company}
                      </p>
                    </div>
                    <Badge variant={match > 75 ? 'success' : match > 50 ? 'warning' : 'secondary'}>
                      {match}% Match
                    </Badge>
                  </div>

                  <p className="text-sm font-light text-secondary mb-4 line-clamp-3 leading-relaxed">
                    {oneLine(entry.job.description, 160)}
                  </p>

                  {requiredSkills.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-2 text-[11px] uppercase tracking-[0.12em] text-secondary">Required</p>
                      <div className="flex flex-wrap gap-2">
                        {requiredSkills.slice(0, 4).map((skill) => (
                          <span key={`${entry.job.id}-required-${skill}`} className="rounded-full border border-border bg-white/80 px-2.5 py-1 text-[11px] text-secondary">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {entry.missingSkills?.length > 0 && (
                    <div className="mb-5">
                      <p className="mb-2 text-[11px] uppercase tracking-[0.12em] text-secondary">Missing</p>
                      <div className="flex flex-wrap gap-2">
                        {entry.missingSkills.slice(0, 3).map((skill) => (
                          <span key={`${entry.job.id}-missing-${skill}`} className="rounded-full border border-gray-300 bg-gray-100 px-2.5 py-1 text-[11px] text-gray-800">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto grid gap-2">
                    <Link href={`/jobs/${entry.job.id}`}>
                      <Button variant="outline" size="sm" className="w-full rounded-xl">
                        View Job
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full rounded-xl"
                      disabled={savingJobId === entry.job.id}
                      onClick={() => void handleSaveJob(entry.job.id)}
                    >
                      {savingJobId === entry.job.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <BookmarkPlus className="mr-2 h-4 w-4" /> Save for later
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="md:col-span-2 lg:col-span-3 glass-panel p-8 rounded-3xl text-center">
              <p className="text-base font-light text-secondary">
                No job matches found yet. Upload a stronger resume and update roadmap skills to improve matching.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

