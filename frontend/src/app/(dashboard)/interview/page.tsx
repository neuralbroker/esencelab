"use client";

/**
 * Mock interview page.
 *
 * This page shows generated interview questions and practice support for
 * students preparing for technical and behavioral rounds.
 */
import { FormEvent, useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Loading from "@/components/Loading";
import { AlertCircle, CheckCircle2, Loader2, Mic, Video } from "lucide-react";
import {
  getCareerRoles,
  getMockInterview,
  getMockInterviewSessions,
  getReadableErrorMessage,
  saveInterviewSession,
} from "@/lib/dashboardApi";
import { CareerRole, MockInterviewPack } from "@/types";
import { useRoleAccess } from "@/lib/useRoleAccess";

interface InterviewSession {
  id: string;
  roleId: string;
  question: string;
  answer: string;
  rating: number;
  createdAt: string;
}

export default function MockInterviewPage() {
  const { user, hasAllowedRole, isCheckingAccess } = useRoleAccess({
    allowedRoles: ["student"],
  });

  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<CareerRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [pack, setPack] = useState<MockInterviewPack | null>(null);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);

  const [practiceMode, setPracticeMode] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [rating, setRating] = useState(3);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasAllowedRole) return;

    const bootstrap = async () => {
      setLoading(true);
      setError(null);
      try {
        const [roleData, sessionData] = await Promise.all([
          getCareerRoles(),
          getMockInterviewSessions(),
        ]);
        setRoles(roleData);
        setSessions(sessionData || []);
        if (roleData.length > 0) {
          setSelectedRoleId(roleData[0].id);
        }
      } catch (err: any) {
        setError(
          getReadableErrorMessage(err, "Failed to load interview data."),
        );
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [hasAllowedRole]);

  useEffect(() => {
    if (!selectedRoleId) return;

    const loadPack = async () => {
      try {
        const data = await getMockInterview(selectedRoleId);
        setPack(data);
        const firstQuestion =
          data.technical?.[0]?.question || data.behavioral?.[0]?.question || "";
        setQuestion(firstQuestion);
      } catch (err: any) {
        setError(
          getReadableErrorMessage(err, "Failed to generate interview pack."),
        );
      }
    };

    void loadPack();
  }, [selectedRoleId]);

  const allQuestions = useMemo(() => {
    if (!pack)
      return [] as Array<{ question: string; suggestedAnswer: string }>;
    return [...(pack.technical || []), ...(pack.behavioral || [])];
  }, [pack]);

  const submitSession = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedRoleId || !question.trim() || !answer.trim() || saving) return;

    setSaving(true);
    setError(null);
    setFeedback(null);
    try {
      const record = await saveInterviewSession({
        roleId: selectedRoleId,
        question: question.trim(),
        answer: answer.trim(),
        rating,
      });
      setSessions((prev) => [record, ...prev].slice(0, 30));
      setAnswer("");
      setFeedback(
        "Practice response saved. Keep iterating for stronger answers.",
      );
    } catch (err: any) {
      setError(
        getReadableErrorMessage(err, "Failed to save practice response."),
      );
    } finally {
      setSaving(false);
    }
  };

  if (isCheckingAccess) {
    return <Loading text="Checking interview workspace..." />;
  }

  if (loading) {
    return (
      <div className="layout-container section-spacing">
        <div className="flex items-center gap-3 text-secondary">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading mock interview workspace...
        </div>
      </div>
    );
  }

  if (!hasAllowedRole || !user) return null;

  return (
    <div className="layout-container section-spacing mx-auto max-w-6xl space-y-8">
      <section className="max-w-3xl space-y-2">
        <h1 className="break-words text-3xl font-bold tracking-tight text-primary md:text-4xl">
          Mock Interview Assistant
        </h1>
        <p className="text-secondary">
          Practice technical and behavioral responses with role-specific
          prompts, then log your strongest answers.
        </p>
      </section>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0 break-words">{error}</span>
        </div>
      )}
      {feedback && (
        <div className="flex items-start gap-2 rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0 break-words">{feedback}</span>
        </div>
      )}

      <Card hoverable={false} className="p-4 sm:p-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr),auto,auto] md:items-end">
          <div className="min-w-0">
            <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-secondary">
              Target Role
            </label>
            <select
              value={selectedRoleId}
              onChange={(event) => setSelectedRoleId(event.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-border bg-white/70 px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <div className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-white/60 px-4 text-sm text-secondary md:justify-center">
            <Video className="h-4 w-4 shrink-0" /> Camera check
          </div>
          <button
            type="button"
            className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-semibold transition-colors ${practiceMode ? "bg-primary text-white" : "border border-border bg-white text-primary"}`}
            onClick={() => setPracticeMode((prev) => !prev)}
          >
            Practice Mode: {practiceMode ? "On" : "Off"}
          </button>
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Card hoverable={false} className="p-4 sm:p-6">
          <h2 className="mb-4 text-xl font-semibold text-primary">
            Technical Questions
          </h2>
          <div className="space-y-3">
            {(pack?.technical || []).map((item) => (
              <details
                key={item.question}
                className="rounded-lg border border-border bg-white/70 p-3"
              >
                <summary className="cursor-pointer break-words text-sm font-medium text-primary">
                  {item.question}
                </summary>
                {practiceMode && (
                  <p className="mt-2 break-words text-sm leading-6 text-secondary">
                    {item.suggestedAnswer}
                  </p>
                )}
              </details>
            ))}
          </div>
        </Card>

        <Card hoverable={false} className="p-4 sm:p-6">
          <h2 className="mb-4 text-xl font-semibold text-primary">
            Behavioral Questions
          </h2>
          <div className="space-y-3">
            {(pack?.behavioral || []).map((item) => (
              <details
                key={item.question}
                className="rounded-lg border border-border bg-white/70 p-3"
              >
                <summary className="cursor-pointer break-words text-sm font-medium text-primary">
                  {item.question}
                </summary>
                {practiceMode && (
                  <p className="mt-2 break-words text-sm leading-6 text-secondary">
                    {item.suggestedAnswer}
                  </p>
                )}
              </details>
            ))}
          </div>
        </Card>
      </section>

      <Card hoverable={false} className="p-4 sm:p-6">
        <h2 className="mb-4 text-xl font-semibold text-primary">
          Log Practice Response
        </h2>
        <form className="space-y-4" onSubmit={submitSession}>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-secondary">
              Question
            </label>
            <select
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-border bg-white/70 px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {allQuestions.map((item) => (
                <option key={item.question} value={item.question}>
                  {item.question}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-secondary">
              Your Answer
            </label>
            <textarea
              rows={4}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              className="min-h-[120px] w-full rounded-xl border border-border bg-white/70 px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Write how you would answer this in an interview..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-secondary">
              Self Rating
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={rating}
              onChange={(event) => setRating(Number(event.target.value))}
              className="w-full"
            />
            <p className="mt-1 text-xs text-secondary">
              Current rating: {rating}/5
            </p>
          </div>
          <Button
            type="submit"
            className="w-full px-6 sm:w-auto"
            isLoading={saving}
          >
            <Mic className="mr-2 h-4 w-4" />
            Save Response
          </Button>
        </form>
      </Card>

      <Card hoverable={false} className="p-4 sm:p-6">
        <h2 className="mb-4 text-xl font-semibold text-primary">
          Recent Practice History
        </h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-secondary">No practice attempts yet.</p>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 10).map((session) => (
              <div
                key={session.id}
                className="rounded-lg border border-border bg-white/70 p-3"
              >
                <p className="break-words text-sm font-medium text-primary">
                  {session.question}
                </p>
                <p className="mt-1 line-clamp-2 break-words text-sm text-secondary">
                  {session.answer}
                </p>
                <p className="mt-2 text-xs text-secondary">
                  Rating: {session.rating}/5 |{" "}
                  {new Date(session.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
