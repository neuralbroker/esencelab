"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  FileText,
  GraduationCap,
  Lock,
  Menu,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import EsencelabLogo from "@/components/EsencelabLogo";
import { useAuth } from "@/contexts/AuthContext";

type Icon = ComponentType<{ className?: string }>;

const navItems = [
  { label: "Problem", href: "#problem" },
  { label: "Product", href: "#product" },
  { label: "Workflow", href: "#workflow" },
  { label: "Trust", href: "#trust" },
];

const thesisCards = [
  {
    title: "Students do not know what to fix next.",
    description:
      "A resume may list skills, projects, and education, but it rarely tells a student which gaps block the next role.",
  },
  {
    title: "Recruiters screen too much unstructured evidence.",
    description:
      "Raw PDFs and scattered application notes make shortlisting slower than it should be.",
  },
  {
    title: "Admins cannot see the whole placement system.",
    description:
      "User activity, resume quality, applications, moderation, and system health need one control surface.",
  },
];

const productLoops = [
  "Resume becomes a structured candidate profile",
  "Skills are compared with target roles and job requirements",
  "Students receive roadmaps, learning plans, and interview practice",
  "Recruiters review ranked applicants with match evidence",
  "Admins monitor users, resumes, applications, audits, and platform health",
];

const roleCards: Array<{
  title: string;
  label: string;
  icon: Icon;
  description: string;
  bullets: string[];
}> = [
  {
    title: "Student workspace",
    label: "Career readiness",
    icon: GraduationCap,
    description:
      "A guided place to upload resumes, understand skill gaps, follow learning plans, and track applications.",
    bullets: ["Resume parsing", "Skill-gap roadmaps", "30/60-day plans"],
  },
  {
    title: "Recruiter workspace",
    label: "Shortlisting",
    icon: Briefcase,
    description:
      "A faster way to post jobs, evaluate applicants, and understand why a candidate matches a role.",
    bullets: ["Job posting", "Candidate ranking", "Match breakdowns"],
  },
  {
    title: "Admin workspace",
    label: "Operations",
    icon: ShieldCheck,
    description:
      "A control plane for users, resumes, course data, moderation, audit logs, and platform health.",
    bullets: ["User management", "Resume moderation", "System monitoring"],
  },
];

const resumeSignals: Array<[string, number]> = [
  ["Node.js", 92],
  ["SQL", 86],
  ["REST APIs", 78],
];

const workflowSteps = [
  {
    step: "01",
    title: "Capture readiness",
    description:
      "Students upload resumes. The AI service extracts structured skills, education, experience, and projects.",
  },
  {
    step: "02",
    title: "Reveal the gaps",
    description:
      "The backend compares profiles with roles and jobs, then turns gaps into concrete guidance.",
  },
  {
    step: "03",
    title: "Move people forward",
    description:
      "Students improve, recruiters shortlist with evidence, and admins see the placement engine clearly.",
  },
];

const signalCards: Array<{
  title: string;
  value: string;
  description: string;
  icon: Icon;
}> = [
  {
    title: "Workspaces",
    value: "3",
    description:
      "Student, recruiter, and admin experiences share one connected loop.",
    icon: Users,
  },
  {
    title: "Plans",
    value: "30/60",
    description: "Learning plans translate gaps into near-term execution.",
    icon: Rocket,
  },
  {
    title: "Data graph",
    value: "1",
    description:
      "Resumes, skills, jobs, applications, courses, and audits stay linked.",
    icon: BarChart3,
  },
];

const trustItems = [
  "Next.js frontend, Express API, FastAPI AI service, and Supabase/Postgres production persistence.",
  "Internal backend-to-AI token support for protected parsing, matching, and assistant calls.",
  "Production safety checks for JWT secrets, CORS origins, data provider mode, and bootstrap users.",
  "Fallback behavior keeps core guidance and matching usable when an external AI provider is unavailable.",
];

const faqs = [
  {
    question: "What does Esencelab do?",
    answer:
      "A placement operating system that helps institutions understand student readiness, help students improve, and help recruiters shortlist with evidence.",
  },
  {
    question: "Is this only a resume parser?",
    answer:
      "No. Resume parsing is the first step. The product connects parsed profiles to role matching, roadmaps, learning plans, applications, recruiter ranking, and admin monitoring.",
  },
  {
    question: "Can it run locally without Supabase?",
    answer:
      "Yes. Local development can use memory mode. Production should use Supabase/Postgres for persistent data.",
  },
  {
    question: "What happens if Groq or another AI provider is down?",
    answer:
      "The backend and AI service include deterministic fallback behavior so career guidance and matching flows can still degrade gracefully.",
  },
];

const primaryButtonClass =
  "group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md bg-[#ff5a1f] px-6 py-3 text-sm font-bold text-white shadow-[0_18px_38px_-26px_rgba(255,90,31,0.95)] transition hover:-translate-y-0.5 hover:bg-[#e64f1b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5a1f] focus-visible:ring-offset-2";
const secondaryButtonClass =
  "inline-flex min-h-[48px] items-center justify-center rounded-md border border-[#d8d0c3] bg-white px-6 py-3 text-sm font-bold text-[#1b1b1b] transition hover:-translate-y-0.5 hover:border-[#bfb4a4] hover:bg-[#fffaf2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1b1b1b] focus-visible:ring-offset-2";
const sectionClass =
  "rounded-[1.4rem] border border-[#ded5c8] bg-[#fffaf2] shadow-[0_22px_54px_-46px_rgba(34,29,22,0.5)]";
const eyebrowClass =
  "text-xs font-bold uppercase tracking-[0.24em] text-[#8d4a20]";
const mutedTextClass = "text-[#5f5b52]";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const year = new Date().getFullYear();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5efe3]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#2b241b]/15 border-t-[#ff5a1f]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5efe3] text-[#17130f] antialiased">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.86),transparent_30%),radial-gradient(circle_at_94%_8%,rgba(255,90,31,0.12),transparent_28%),linear-gradient(180deg,#f7f0e4_0%,#fff8ee_48%,#f2eadc_100%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.28] [background-image:linear-gradient(to_right,rgba(49,39,29,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(49,39,29,0.08)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />

      <header className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-6 lg:px-8">
        <div
          className={`mx-auto max-w-7xl border border-[#ddd3c3] bg-[#fffaf2]/92 px-4 py-3 shadow-[0_18px_46px_-36px_rgba(34,29,22,0.65)] backdrop-blur-2xl transition-[border-radius] sm:px-5 ${
            isMenuOpen ? "rounded-2xl" : "rounded-full"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex shrink-0"
              aria-label="Esencelab home"
            >
              <EsencelabLogo
                iconClassName="border-[#e5d9c8] bg-white"
                textClassName="tracking-[0.18em]"
              />
            </Link>

            <nav
              className="hidden items-center gap-7 text-sm font-bold text-[#4f463a] lg:flex"
              aria-label="Primary navigation"
            >
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-[#ff5a1f]"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <Link
                href="/login"
                className="px-3 py-2 text-sm font-bold text-[#2b241b] transition hover:text-[#ff5a1f]"
              >
                Login
              </Link>
              <Link
                href="/register"
                className={`${primaryButtonClass} min-h-[42px] px-5 py-2`}
              >
                Start now
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setIsMenuOpen((current: boolean) => !current)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[#d8d0c3] bg-white text-[#17130f] transition hover:bg-[#fff5e8] lg:hidden"
              aria-label="Toggle navigation menu"
              aria-controls="mobile-navigation"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>

          {isMenuOpen && (
            <div
              id="mobile-navigation"
              className="mt-3 space-y-2 rounded-xl border border-[#e4d8c7] bg-white p-3 lg:hidden"
            >
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-lg px-4 py-3 text-sm font-bold text-[#2b241b] transition hover:bg-[#fff4e6]"
                >
                  {item.label}
                </a>
              ))}
              <div className="grid gap-2 pt-2 sm:grid-cols-2">
                <Link href="/login" className={secondaryButtonClass}>
                  Login
                </Link>
                <Link href="/register" className={primaryButtonClass}>
                  Start now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 pb-8 pt-28 sm:px-6 lg:px-8 lg:pb-10 lg:pt-32">
        <section className={`${sectionClass} overflow-hidden`}>
          <div className="grid gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1.04fr_0.96fr] lg:px-10 lg:py-12">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ duration: 0.42 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e3d5c3] bg-white px-3.5 py-2 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[#7c431f]">
                <Sparkles className="h-3.5 w-3.5" />
                Placement intelligence, not resume storage
              </div>

              <h1 className="mt-7 max-w-4xl text-[3.3rem] font-bold leading-[0.94] tracking-[-0.075em] text-[#17130f] sm:text-[5.2rem] lg:text-[6.6rem]">
                Make every student easier to place.
              </h1>

              <p
                className={`mt-6 max-w-2xl text-lg leading-8 ${mutedTextClass} sm:text-xl sm:leading-9`}
              >
                Esencelab turns resumes, skills, learning plans, jobs, and
                applications into one operating loop for placement teams.
                Students know what to improve. Recruiters know who fits. Admins
                know what is happening.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className={primaryButtonClass}>
                  Create student account
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/login?next=%2Fdashboard"
                  className={secondaryButtonClass}
                >
                  Open dashboard
                </Link>
              </div>

              <div className="mt-8 grid gap-3 border-t border-[#e2d6c7] pt-6 text-sm font-semibold text-[#51483d] sm:grid-cols-3">
                {[
                  "Resume to profile",
                  "Profile to roadmap",
                  "Applicant to shortlist",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#ff5a1f]" />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.45 }}
              className="relative"
            >
              <div className="rounded-[1.35rem] border border-[#d8cbbb] bg-[#17130f] p-2 shadow-[0_40px_92px_-56px_rgba(23,19,15,0.9)]">
                <div className="rounded-[1rem] bg-[#fffaf2] p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3 border-b border-[#e0d4c4] pb-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8f8170]">
                        Candidate graph
                      </p>
                      <h2 className="mt-1 text-2xl font-bold tracking-[-0.04em]">
                        Backend Developer
                      </h2>
                    </div>
                    <div className="rounded-md bg-[#ff5a1f] px-4 py-2 text-sm font-bold text-white">
                      84% fit
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-[#e4d9ca] bg-white p-4">
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <FileText className="h-4 w-4 text-[#ff5a1f]" />
                        Resume signals
                      </div>
                      <div className="mt-4 space-y-3">
                        {resumeSignals.map(([skill, score]) => (
                          <div key={skill}>
                            <div className="mb-1 flex items-center justify-between text-xs text-[#6d6254]">
                              <span>{skill}</span>
                              <span>{score}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-[#efe4d5]">
                              <div
                                className="h-full rounded-full bg-[#17130f]"
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#e4d9ca] bg-white p-4">
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <Target className="h-4 w-4 text-[#ff5a1f]" />
                        Next best actions
                      </div>
                      <div className="mt-4 space-y-2">
                        {[
                          "Add Docker project evidence",
                          "Practice API design interview",
                          "Finish testing roadmap week",
                        ].map((task) => (
                          <div
                            key={task}
                            className="rounded-lg bg-[#f6eddf] px-3 py-2 text-sm text-[#4f463a]"
                          >
                            {task}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-[#e4d9ca] bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-bold">Recruiter shortlist</p>
                        <p className="text-sm text-[#6d6254]">
                          Ranked by match, resume strength, and missing-skill
                          impact.
                        </p>
                      </div>
                      <div className="flex -space-x-2">
                        {["AS", "HK", "JP"].map((initials) => (
                          <span
                            key={initials}
                            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#17130f] text-xs font-bold text-white"
                          >
                            {initials}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section
          className="grid gap-4 md:grid-cols-3"
          aria-label="Product proof"
        >
          {signalCards.map((signal) => {
            const IconComponent = signal.icon;
            return (
              <article
                key={signal.title}
                className={`${sectionClass} p-5 sm:p-6`}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#8f8170]">
                    {signal.title}
                  </p>
                  <IconComponent className="h-5 w-5 text-[#ff5a1f]" />
                </div>
                <p className="mt-4 text-5xl font-bold tracking-[-0.08em]">
                  {signal.value}
                </p>
                <p className={`mt-3 text-sm leading-6 ${mutedTextClass}`}>
                  {signal.description}
                </p>
              </article>
            );
          })}
        </section>

        <section
          id="problem"
          className={`${sectionClass} scroll-mt-28 px-5 py-8 sm:px-8 lg:px-10 lg:py-12`}
        >
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
            <div>
              <p className={eyebrowClass}>The problem</p>
              <h2 className="mt-3 text-4xl font-bold tracking-[-0.06em] sm:text-5xl">
                Placement teams are operating with disconnected signals.
              </h2>
              <p className={`mt-5 text-base leading-7 ${mutedTextClass}`}>
                The product exists because career readiness is not one event. It
                is a loop that starts before a resume is uploaded and continues
                through applications, shortlists, and operational oversight.
              </p>
            </div>
            <div className="grid gap-3">
              {thesisCards.map((card) => (
                <article
                  key={card.title}
                  className="rounded-xl border border-[#e2d5c6] bg-white p-5"
                >
                  <h3 className="text-xl font-bold tracking-[-0.04em]">
                    {card.title}
                  </h3>
                  <p className={`mt-2 text-sm leading-6 ${mutedTextClass}`}>
                    {card.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="product"
          className={`${sectionClass} scroll-mt-28 px-5 py-8 sm:px-8 lg:px-10 lg:py-12`}
        >
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className={eyebrowClass}>The product</p>
              <h2 className="mt-3 text-4xl font-bold tracking-[-0.06em] sm:text-5xl">
                One placement loop for every stakeholder.
              </h2>
            </div>
            <p className={`max-w-xl text-base leading-7 ${mutedTextClass}`}>
              Esencelab connects the people and data that usually sit in
              separate tools: students, recruiters, admins, resumes, jobs,
              applications, learning plans, and audit logs.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {roleCards.map((card) => {
              const IconComponent = card.icon;
              return (
                <article
                  key={card.title}
                  className="rounded-xl border border-[#e1d5c6] bg-white p-5 transition hover:-translate-y-1 hover:shadow-[0_18px_42px_-34px_rgba(34,29,22,0.5)] sm:p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#17130f] text-white">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-[#8f8170]">
                    {card.label}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold tracking-[-0.045em]">
                    {card.title}
                  </h3>
                  <p className={`mt-3 text-sm leading-6 ${mutedTextClass}`}>
                    {card.description}
                  </p>
                  <ul className="mt-5 space-y-2">
                    {card.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-center gap-2 text-sm font-semibold text-[#40382f]"
                      >
                        <CheckCircle2 className="h-4 w-4 text-[#ff5a1f]" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className={`${sectionClass} px-5 py-8 sm:px-8 lg:px-10`}>
            <p className={eyebrowClass}>Why it matters</p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.06em] sm:text-5xl">
              A resume is only useful when it changes what happens next.
            </h2>
            <p className={`mt-5 text-base leading-7 ${mutedTextClass}`}>
              Esencelab treats the resume as the start of the placement loop,
              not the destination. From there, the system connects readiness,
              matching, learning, hiring, and institutional visibility.
            </p>
          </div>

          <div className={`${sectionClass} p-5 sm:p-6`}>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#8f8170]">
              Core loop
            </p>
            <div className="mt-5 space-y-3">
              {productLoops.map((item, index) => (
                <div
                  key={item}
                  className="grid grid-cols-[2.5rem_1fr] items-start gap-3 rounded-xl border border-[#e2d5c6] bg-white p-4"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#ff5a1f] text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm font-semibold leading-6 text-[#3f362c]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="workflow"
          className={`${sectionClass} scroll-mt-28 px-5 py-8 sm:px-8 lg:px-10 lg:py-12`}
        >
          <div className="mx-auto max-w-3xl text-center">
            <p className={eyebrowClass}>Workflow</p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.06em] sm:text-5xl">
              From uploaded resume to measurable placement momentum.
            </h2>
          </div>
          <div className="mt-9 grid gap-4 lg:grid-cols-3">
            {workflowSteps.map((step) => (
              <article
                key={step.step}
                className="rounded-xl border border-[#e2d5c6] bg-white p-6"
              >
                <div className="text-5xl font-bold tracking-[-0.09em] text-[#f2c5aa]">
                  {step.step}
                </div>
                <h3 className="mt-4 text-2xl font-bold tracking-[-0.045em]">
                  {step.title}
                </h3>
                <p className={`mt-3 text-sm leading-6 ${mutedTextClass}`}>
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="trust"
          className="grid scroll-mt-28 gap-5 lg:grid-cols-[0.92fr_1.08fr]"
        >
          <div className={`${sectionClass} px-5 py-8 sm:px-8 lg:px-10`}>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#17130f] text-white">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-4xl font-bold tracking-[-0.06em] sm:text-5xl">
              Built like infrastructure, not a one-off placement dashboard.
            </h2>
            <p className={`mt-5 text-base leading-7 ${mutedTextClass}`}>
              The architecture separates frontend, backend, AI service, and
              persistence so each part can scale and be operated independently.
            </p>
          </div>

          <div className={`${sectionClass} p-5 sm:p-6`}>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#8f8170]">
              Technical trust
            </p>
            <div className="mt-5 space-y-3">
              {trustItems.map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-xl border border-[#e2d5c6] bg-white p-4 text-sm leading-6 text-[#4f463a]"
                >
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#ff5a1f]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className={`${sectionClass} px-5 py-8 sm:px-8 lg:px-10 lg:py-12`}
        >
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className={eyebrowClass}>FAQ</p>
              <h2 className="mt-3 text-4xl font-bold tracking-[-0.06em] sm:text-5xl">
                Clear answers before a team adopts it.
              </h2>
            </div>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <article
                  key={faq.question}
                  className="rounded-xl border border-[#e2d5c6] bg-white p-5"
                >
                  <h3 className="text-lg font-bold tracking-[-0.03em]">
                    {faq.question}
                  </h3>
                  <p className={`mt-2 text-sm leading-6 ${mutedTextClass}`}>
                    {faq.answer}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.4rem] bg-[#17130f] px-5 py-10 text-center text-white shadow-[0_34px_100px_-62px_rgba(23,19,15,0.9)] sm:px-8 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-3xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#ff5a1f] text-white">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-4xl font-bold tracking-[-0.06em] sm:text-5xl">
              Build the placement engine around the student, not the
              spreadsheet.
            </h2>
            <p className="mt-5 text-base leading-7 text-white/72 sm:text-lg">
              Start with one student profile. Then connect learning, matching,
              applications, recruiters, and admins into the same loop.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md bg-[#ff5a1f] px-7 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#e64f1b]"
              >
                Get started
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-[48px] items-center justify-center rounded-md border border-white/20 px-7 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>

        <footer className={`${sectionClass} px-5 py-7 sm:px-8`}>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <EsencelabLogo
                iconClassName="border-[#e5d9c8] bg-white"
                textClassName="tracking-[0.18em]"
              />
              <p className={`mt-3 text-sm ${mutedTextClass}`}>
                Make every student easier to place.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm font-bold text-[#4f463a]">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-[#ff5a1f]"
                >
                  {item.label}
                </a>
              ))}
            </div>
            <p className="text-sm text-[#70665a]">© {year} Esencelab</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
