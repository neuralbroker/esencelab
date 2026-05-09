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
  LineChart,
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
  { label: "Platform", href: "#platform" },
  { label: "Workflow", href: "#workflow" },
  { label: "Security", href: "#security" },
  { label: "FAQ", href: "#faq" },
];

const proofMetrics = [
  {
    value: "3",
    label: "role-based workspaces",
    description:
      "Student, recruiter, and admin experiences share one talent intelligence loop.",
  },
  {
    value: "30/60",
    label: "day growth plans",
    description:
      "Career roadmaps turn resume gaps into weekly learning execution.",
  },
  {
    value: "1",
    label: "structured candidate graph",
    description:
      "Resume, skills, applications, courses, and audit data stay connected.",
  },
];

const roleCards: Array<{
  title: string;
  eyebrow: string;
  description: string;
  icon: Icon;
  bullets: string[];
}> = [
  {
    title: "Students",
    eyebrow: "Career readiness",
    description:
      "Upload a resume, understand role fit, close skill gaps, and track applications without scattered tools.",
    icon: GraduationCap,
    bullets: ["Resume parsing", "Skill-gap roadmap", "Mock interview prep"],
  },
  {
    title: "Recruiters",
    eyebrow: "Shortlist faster",
    description:
      "Post jobs, rank applicants by match quality, and review structured candidate evidence instead of raw PDFs.",
    icon: Briefcase,
    bullets: ["Candidate ranking", "Match breakdowns", "Applicant analytics"],
  },
  {
    title: "Admins",
    eyebrow: "Operational control",
    description:
      "Monitor platform health, user activity, resume moderation, and audit logs from one trusted control plane.",
    icon: ShieldCheck,
    bullets: ["User management", "Resume moderation", "System monitoring"],
  },
];

const platformFeatures: Array<{
  title: string;
  description: string;
  icon: Icon;
}> = [
  {
    title: "Resume intelligence",
    description:
      "Parse PDFs into structured skills, education, projects, experience, and readiness indicators.",
    icon: FileText,
  },
  {
    title: "Role-fit scoring",
    description:
      "Compare candidate profiles with job requirements and surface matched and missing skills clearly.",
    icon: Target,
  },
  {
    title: "Growth engine",
    description:
      "Generate roadmaps, learning plans, resource suggestions, and interview practice loops.",
    icon: Rocket,
  },
  {
    title: "Recruiter analytics",
    description:
      "Understand applicant pools, average match quality, missing skills, and job-level performance.",
    icon: BarChart3,
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Capture the profile",
    description:
      "Students upload resumes and the AI service turns them into structured candidate records.",
  },
  {
    step: "02",
    title: "Score role alignment",
    description:
      "The backend compares skills, job requirements, and application context to calculate actionable fit.",
  },
  {
    step: "03",
    title: "Move people forward",
    description:
      "Students get roadmaps, recruiters get ranked applicants, and admins get operational visibility.",
  },
];

const securityPillars = [
  "Production safety checks for JWT, internal service tokens, CORS, and data provider mode.",
  "Backend-to-AI internal token support keeps resume parsing and match calls protected.",
  "Supabase-first persistence model gives the startup a clear production source of truth.",
];

const faqs = [
  {
    question: "Who is Esencelab built for?",
    answer:
      "It is built for student placement workflows where students, recruiters, and admins need one connected career and hiring intelligence platform.",
  },
  {
    question: "Does it require an external database locally?",
    answer:
      "No. Local development can use memory mode. Production should use Supabase so data persists across deployments.",
  },
  {
    question: "What happens if the AI provider is unavailable?",
    answer:
      "The AI service and backend include fallback behavior so core career guidance and matching flows can degrade gracefully.",
  },
  {
    question: "Is the platform ready to scale?",
    answer:
      "The repository now includes CI, security policy, deployment docs, runbooks, and a scaling roadmap. The next milestone is splitting the largest backend and AI modules into service/router layers.",
  },
];

const primaryButtonClass =
  "group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#111111] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(0,0,0,0.75)] transition hover:-translate-y-0.5 hover:bg-[#242424] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 sm:px-7";
const secondaryButtonClass =
  "inline-flex min-h-[48px] items-center justify-center rounded-full border border-black/10 bg-white/72 px-6 py-3 text-sm font-semibold text-[#171717] shadow-[0_12px_30px_-26px_rgba(0,0,0,0.6)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 sm:px-7";
const glassPanelClass =
  "rounded-[2rem] border border-white/70 bg-white/72 shadow-[0_32px_90px_-60px_rgba(15,15,15,0.7)] backdrop-blur-xl";
const mutedTextClass = "text-[#626262]";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
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
      <div className="flex min-h-screen items-center justify-center bg-[#f6f5f1]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-black/15 border-t-[#111111]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6f5f1] text-[#101010] antialiased">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(255,255,255,0.95),transparent_30%),radial-gradient(circle_at_88%_4%,rgba(214,214,206,0.7),transparent_30%),linear-gradient(180deg,#f6f5f1_0%,#fbfaf7_48%,#f3f1ea_100%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.32] [background-image:linear-gradient(to_right,rgba(20,20,20,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(20,20,20,0.055)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />

      <header className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-6 lg:px-8">
        <div
          className={`mx-auto max-w-7xl border border-white/75 bg-white/74 px-4 py-3 shadow-[0_24px_70px_-50px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-[border-radius] sm:px-5 ${
            isMenuOpen ? "rounded-[2rem]" : "rounded-full"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex shrink-0"
              aria-label="Esencelab home"
            >
              <EsencelabLogo textClassName="tracking-[0.18em]" />
            </Link>

            <nav
              className="hidden items-center gap-7 text-sm font-semibold text-[#3c3c3c] lg:flex"
              aria-label="Primary navigation"
            >
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-[#111111]"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <Link
                href="/login"
                className="px-3 py-2 text-sm font-semibold text-[#181818] transition hover:text-black/70"
              >
                Login
              </Link>
              <Link
                href="/register"
                className={`${primaryButtonClass} min-h-[42px] px-5 py-2`}
              >
                Start free
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setIsMenuOpen((current: boolean) => !current)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-black/10 bg-white/80 text-[#111111] transition hover:bg-white lg:hidden"
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
              className="mt-3 space-y-2 rounded-[1.5rem] border border-black/10 bg-white/88 p-3 lg:hidden"
            >
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-sm font-semibold text-[#222222] transition hover:bg-[#f4f4f0]"
                >
                  {item.label}
                </a>
              ))}
              <div className="grid gap-2 pt-2 sm:grid-cols-2">
                <Link href="/login" className={secondaryButtonClass}>
                  Login
                </Link>
                <Link href="/register" className={primaryButtonClass}>
                  Start free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-28 sm:px-6 lg:px-8 lg:pb-10 lg:pt-32">
        <section
          className={`${glassPanelClass} overflow-hidden px-5 py-8 sm:px-8 lg:px-10 lg:py-12`}
        >
          <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ duration: 0.45 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/78 px-3.5 py-2 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[#202020] shadow-[0_12px_30px_-26px_rgba(0,0,0,0.6)]">
                <Sparkles className="h-3.5 w-3.5" />
                AI career intelligence for placement teams
              </div>

              <h1 className="mt-7 max-w-4xl text-[3.25rem] font-semibold leading-[0.92] tracking-[-0.075em] text-[#101010] sm:text-[5rem] lg:text-[6.15rem]">
                Turn resumes into startup-grade talent intelligence.
              </h1>

              <p
                className={`mt-6 max-w-2xl text-lg leading-8 ${mutedTextClass} sm:text-xl sm:leading-9`}
              >
                Esencelab helps students become role-ready, recruiters shortlist
                faster, and admins operate a placement engine with clear data
                instead of scattered spreadsheets.
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
                  View dashboard
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium text-[#4f4f4f]">
                {[
                  "Resume parsing",
                  "Skill-gap roadmaps",
                  "Recruiter ranking",
                ].map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full bg-white/72 px-3.5 py-2 ring-1 ring-black/10"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#171717]" />
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.48 }}
              className="relative"
            >
              <div className="absolute -inset-8 rounded-[3rem] bg-[radial-gradient(circle_at_30%_20%,rgba(17,17,17,0.16),transparent_34%),radial-gradient(circle_at_78%_12%,rgba(255,255,255,0.9),transparent_32%)] blur-2xl" />
              <div className="relative rounded-[2rem] border border-black/10 bg-[#111111] p-2 shadow-[0_42px_100px_-54px_rgba(0,0,0,0.85)]">
                <div className="rounded-[1.55rem] border border-white/10 bg-[#f8f7f2] p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777]">
                        Live role match
                      </p>
                      <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#111111]">
                        Backend Developer
                      </h2>
                    </div>
                    <div className="rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-white">
                      84%
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl border border-black/10 bg-white p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#1f1f1f]">
                        <FileText className="h-4 w-4" /> Resume signal
                      </div>
                      <div className="mt-4 space-y-3">
                        {["Node.js", "SQL", "REST APIs"].map((skill, index) => (
                          <div key={skill}>
                            <div className="mb-1 flex items-center justify-between text-xs text-[#696969]">
                              <span>{skill}</span>
                              <span>{[92, 86, 78][index]}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-[#eceae4]">
                              <div
                                className="h-full rounded-full bg-[#111111]"
                                style={{ width: `${[92, 86, 78][index]}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-black/10 bg-white p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#1f1f1f]">
                        <LineChart className="h-4 w-4" /> Next actions
                      </div>
                      <div className="mt-4 space-y-2">
                        {[
                          "Improve Docker evidence",
                          "Add testing project",
                          "Practice API design",
                        ].map((task) => (
                          <div
                            key={task}
                            className="flex items-start gap-2 rounded-2xl bg-[#f4f3ef] px-3 py-2 text-sm text-[#4b4b4b]"
                          >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#111111]" />
                            {task}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-3xl border border-black/10 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#111111]">
                          Recruiter shortlist queue
                        </p>
                        <p className="text-sm text-[#696969]">
                          Ranked by role fit, resume strength, and missing-skill
                          impact.
                        </p>
                      </div>
                      <div className="flex -space-x-2">
                        {["AS", "HK", "JP"].map((initials) => (
                          <span
                            key={initials}
                            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#111111] text-xs font-bold text-white"
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
          aria-label="Platform proof"
          className="grid gap-4 md:grid-cols-3"
        >
          {proofMetrics.map((metric) => (
            <div key={metric.label} className={`${glassPanelClass} p-5 sm:p-6`}>
              <p className="text-4xl font-semibold tracking-[-0.06em] text-[#111111]">
                {metric.value}
              </p>
              <p className="mt-2 text-sm font-bold uppercase tracking-[0.18em] text-[#555555]">
                {metric.label}
              </p>
              <p className={`mt-3 text-sm leading-6 ${mutedTextClass}`}>
                {metric.description}
              </p>
            </div>
          ))}
        </section>

        <section
          id="platform"
          className={`${glassPanelClass} scroll-mt-28 px-5 py-8 sm:px-8 lg:px-10 lg:py-12`}
        >
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#6a6a6a]">
                Platform
              </p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#111111] sm:text-5xl">
                One product, three high-leverage workflows.
              </h2>
            </div>
            <p className={`max-w-xl text-base leading-7 ${mutedTextClass}`}>
              Esencelab connects resume insights, role matching, learning paths,
              and hiring operations so every stakeholder works from the same
              source of truth.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {roleCards.map((card) => {
              const IconComponent = card.icon;
              return (
                <article
                  key={card.title}
                  className="rounded-[1.75rem] border border-black/10 bg-white/72 p-5 shadow-[0_18px_50px_-42px_rgba(0,0,0,0.55)] transition hover:-translate-y-1 hover:bg-white sm:p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111111] text-white">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-[#777777]">
                    {card.eyebrow}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
                    {card.title}
                  </h3>
                  <p className={`mt-3 text-sm leading-6 ${mutedTextClass}`}>
                    {card.description}
                  </p>
                  <ul className="mt-5 space-y-2">
                    {card.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-center gap-2 text-sm font-medium text-[#343434]"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <div className={`${glassPanelClass} px-5 py-8 sm:px-8 lg:px-10`}>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#6a6a6a]">
              Product advantage
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#111111] sm:text-5xl">
              Everything placement teams need to act with confidence.
            </h2>
            <p className={`mt-5 text-base leading-7 ${mutedTextClass}`}>
              Each workflow turns unstructured career data into focused next
              steps, giving students practical guidance and recruiters cleaner
              evidence for every shortlist decision.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {platformFeatures.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <article
                  key={feature.title}
                  className={`${glassPanelClass} p-5 sm:p-6`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#111111] text-white">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold tracking-[-0.04em] text-[#111111]">
                    {feature.title}
                  </h3>
                  <p className={`mt-3 text-sm leading-6 ${mutedTextClass}`}>
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section
          id="workflow"
          className={`${glassPanelClass} scroll-mt-28 px-5 py-8 sm:px-8 lg:px-10 lg:py-12`}
        >
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#6a6a6a]">
              Workflow
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#111111] sm:text-5xl">
              From resume upload to measurable career momentum.
            </h2>
          </div>
          <div className="mt-9 grid gap-4 lg:grid-cols-3">
            {workflowSteps.map((step) => (
              <article
                key={step.step}
                className="relative rounded-[1.75rem] border border-black/10 bg-white/76 p-6"
              >
                <div className="text-5xl font-semibold tracking-[-0.08em] text-[#d6d2c8]">
                  {step.step}
                </div>
                <h3 className="mt-4 text-2xl font-semibold tracking-[-0.045em] text-[#111111]">
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
          id="security"
          className="grid scroll-mt-28 gap-6 lg:grid-cols-[1fr_0.9fr]"
        >
          <div className={`${glassPanelClass} px-5 py-8 sm:px-8 lg:px-10`}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111111] text-white">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-[#111111] sm:text-5xl">
              Built with startup-grade operational discipline.
            </h2>
            <p
              className={`mt-5 max-w-2xl text-base leading-7 ${mutedTextClass}`}
            >
              Clean deployment boundaries, production safety checks, runbooks,
              audits, and CI make the codebase easier to scale as a real product
              team.
            </p>
          </div>

          <div className={`${glassPanelClass} p-5 sm:p-6`}>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#6a6a6a]">
              Trust checklist
            </p>
            <div className="mt-5 space-y-3">
              {securityPillars.map((pillar) => (
                <div
                  key={pillar}
                  className="flex gap-3 rounded-3xl border border-black/10 bg-white/74 p-4 text-sm leading-6 text-[#454545]"
                >
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#111111]" />
                  {pillar}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="faq"
          className={`${glassPanelClass} scroll-mt-28 px-5 py-8 sm:px-8 lg:px-10 lg:py-12`}
        >
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#6a6a6a]">
                FAQ
              </p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#111111] sm:text-5xl">
                Clear answers before your team signs up.
              </h2>
            </div>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <article
                  key={faq.question}
                  className="rounded-[1.5rem] border border-black/10 bg-white/74 p-5"
                >
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-[#111111]">
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

        <section className="overflow-hidden rounded-[2.25rem] bg-[#111111] px-5 py-10 text-center text-white shadow-[0_34px_100px_-58px_rgba(0,0,0,0.9)] sm:px-8 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-3xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#111111]">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
              Ready to build a smarter career and hiring engine?
            </h2>
            <p className="mt-5 text-base leading-7 text-white/70 sm:text-lg">
              Start with a student account, then bring recruiters and admins
              into the same intelligence loop.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-[#111111] transition hover:-translate-y-0.5 hover:bg-[#f2f2f2]"
              >
                Get started
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/20 px-7 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>

        <footer className={`${glassPanelClass} px-5 py-7 sm:px-8`}>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <EsencelabLogo textClassName="tracking-[0.18em]" />
              <p className={`mt-3 text-sm ${mutedTextClass}`}>
                AI resume, career, and hiring intelligence platform.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm font-semibold text-[#3d3d3d]">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-black"
                >
                  {item.label}
                </a>
              ))}
            </div>
            <p className="text-sm text-[#686868]">© {year} Esencelab</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
