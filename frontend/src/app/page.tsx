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
  ShieldCheck,
  Target,
  Users,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import EsencelabLogo from "@/components/EsencelabLogo";
import { useAuth } from "@/contexts/AuthContext";

type Icon = ComponentType<{ className?: string }>;

const navItems = [
  { label: "Product", href: "#product" },
  { label: "Workflow", href: "#workflow" },
  { label: "Roles", href: "#roles" },
  { label: "Trust", href: "#trust" },
];

const productPoints = [
  "Parse resumes into structured profiles",
  "Compare skills with roles and job requirements",
  "Give students clear next steps",
  "Help recruiters review candidates with context",
  "Give admins visibility across the placement process",
];

const workflowSteps = [
  {
    step: "01",
    title: "Upload the resume",
    description:
      "Students add a resume. Esencelab extracts the useful details and turns them into a profile.",
  },
  {
    step: "02",
    title: "Find the gaps",
    description:
      "Skills are compared with target roles and posted jobs so the student can see what needs work.",
  },
  {
    step: "03",
    title: "Move forward",
    description:
      "Students follow a plan, recruiters review better candidate summaries, and admins track progress.",
  },
];

const roleCards: Array<{
  title: string;
  description: string;
  icon: Icon;
  bullets: string[];
}> = [
  {
    title: "Students",
    description:
      "Know where you stand, what to improve, and how to prepare for the roles you want.",
    icon: GraduationCap,
    bullets: ["Resume parsing", "Skill gaps", "Learning plans"],
  },
  {
    title: "Recruiters",
    description:
      "Post jobs, review applicants, and understand why a candidate may be a good fit.",
    icon: Briefcase,
    bullets: ["Job posting", "Candidate ranking", "Match details"],
  },
  {
    title: "Admins",
    description:
      "Manage users, resumes, applications, moderation, and platform health from one place.",
    icon: ShieldCheck,
    bullets: ["User management", "Resume review", "Audit visibility"],
  },
];

const proofCards: Array<{
  label: string;
  value: string;
  description: string;
  icon: Icon;
}> = [
  {
    label: "Workspaces",
    value: "3",
    description: "Separate views for students, recruiters, and admins.",
    icon: Users,
  },
  {
    label: "Planning",
    value: "30/60",
    description: "Short learning plans that turn gaps into weekly work.",
    icon: Target,
  },
  {
    label: "Data",
    value: "1",
    description:
      "A connected record of resumes, skills, jobs, and applications.",
    icon: BarChart3,
  },
];

const trustItems = [
  "Next.js frontend, Express backend, and FastAPI AI service.",
  "Supabase/Postgres support for production data.",
  "Protected backend-to-AI service calls with fallback behavior.",
];

const faqs = [
  {
    question: "Is Esencelab only for students?",
    answer:
      "No. Students use it to prepare, recruiters use it to review candidates, and admins use it to manage the placement process.",
  },
  {
    question: "Is it just a resume parser?",
    answer:
      "No. Resume parsing starts the workflow. The product also handles skill gaps, learning plans, job matching, applications, and admin review.",
  },
];

const resumeSignals: Array<[string, number]> = [
  ["Node.js", 92],
  ["SQL", 86],
  ["REST APIs", 78],
];

const primaryButtonClass =
  "group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#111111] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#242424] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2";
const secondaryButtonClass =
  "inline-flex min-h-[48px] items-center justify-center rounded-full border border-black/10 bg-white/72 px-6 py-3 text-sm font-semibold text-[#161616] transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2";
const panelClass =
  "rounded-[2rem] border border-white/70 bg-white/70 shadow-[0_24px_70px_-58px_rgba(15,15,15,0.58)] backdrop-blur-xl";
const mutedTextClass = "text-[#626262]";
const eyebrowClass =
  "text-xs font-bold uppercase tracking-[0.22em] text-[#707070]";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const softFloat = {
  y: [0, -8, 0],
  transition: {
    duration: 6,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
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
      <div className="pointer-events-none fixed inset-0 opacity-[0.22] [background-image:linear-gradient(to_right,rgba(20,20,20,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(20,20,20,0.055)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
      <motion.div
        className="pointer-events-none fixed left-[7%] top-[18%] h-28 w-28 rounded-full bg-white/50 blur-2xl"
        animate={{ x: [0, 18, 0], y: [0, -12, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none fixed bottom-[12%] right-[10%] h-36 w-36 rounded-full bg-[#d8d6cf]/40 blur-3xl"
        animate={{ x: [0, -16, 0], y: [0, 14, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      <header className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-6 lg:px-8">
        <div
          className={`mx-auto max-w-7xl border border-white/75 bg-white/78 px-4 py-3 shadow-[0_24px_70px_-50px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-[border-radius] sm:px-5 ${
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
                Start now
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setIsMenuOpen((current: boolean) => !current)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-black/10 bg-white/82 text-[#111111] transition hover:bg-white lg:hidden"
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
              className="mt-3 space-y-2 rounded-[1.5rem] border border-black/10 bg-white/90 p-3 lg:hidden"
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
                  Start now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pb-8 pt-28 sm:px-6 lg:px-8 lg:pb-10 lg:pt-32">
        <section className={`${panelClass} overflow-hidden`}>
          <div className="grid items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:px-10 lg:py-12">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ duration: 0.42 }}
              className="max-w-3xl"
            >
              <p className={eyebrowClass}>Placement, made clearer</p>

              <h1 className="mt-5 max-w-4xl text-[3.1rem] font-semibold leading-[0.95] tracking-[-0.075em] text-[#101010] sm:text-[4.7rem] lg:text-[5.8rem]">
                Help students get ready. Help recruiters choose faster.
              </h1>

              <p
                className={`mt-6 max-w-2xl text-lg leading-8 ${mutedTextClass} sm:text-xl sm:leading-9`}
              >
                Esencelab brings resumes, skills, learning plans, jobs, and
                applications into one clear workflow for placement teams.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className={primaryButtonClass}>
                  Create account
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/login?next=%2Fdashboard"
                  className={secondaryButtonClass}
                >
                  Open dashboard
                </Link>
              </div>

              <div className="mt-8 grid gap-3 border-t border-black/10 pt-6 text-sm font-medium text-[#4f4f4f] sm:grid-cols-3">
                {["Resume parsing", "Skill gaps", "Candidate ranking"].map(
                  (item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#171717]" />
                      {item}
                    </div>
                  ),
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.45 }}
              className="relative"
            >
              <motion.div
                animate={softFloat}
                className="rounded-[2rem] border border-black/10 bg-[#111111] p-2 shadow-[0_42px_100px_-56px_rgba(0,0,0,0.85)]"
              >
                <div className="rounded-[1.55rem] border border-white/10 bg-[#f8f7f2] p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777]">
                        Role match
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
                        <FileText className="h-4 w-4" />
                        Resume signals
                      </div>
                      <div className="mt-4 space-y-3">
                        {resumeSignals.map(([skill, score]) => (
                          <div key={skill}>
                            <div className="mb-1 flex items-center justify-between text-xs text-[#696969]">
                              <span>{skill}</span>
                              <span>{score}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-[#eceae4]">
                              <motion.div
                                className="h-full rounded-full bg-[#111111]"
                                initial={{ width: 0 }}
                                animate={{ width: `${score}%` }}
                                transition={{ delay: 0.35, duration: 0.8 }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-black/10 bg-white p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#1f1f1f]">
                        <Target className="h-4 w-4" />
                        Next steps
                      </div>
                      <div className="mt-4 space-y-2">
                        {[
                          "Add Docker project evidence",
                          "Practice API design",
                          "Finish testing module",
                        ].map((task) => (
                          <div
                            key={task}
                            className="rounded-2xl bg-[#f4f3ef] px-3 py-2 text-sm text-[#4b4b4b]"
                          >
                            {task}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-3xl border border-black/10 bg-white p-4">
                    <p className="text-sm font-semibold text-[#111111]">
                      Recruiter view
                    </p>
                    <p className="mt-1 text-sm text-[#696969]">
                      Applicants are easier to review when match score, skills,
                      and missing areas are shown together.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section
          className="grid gap-4 md:grid-cols-3"
          aria-label="Product summary"
        >
          {proofCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <motion.article
                key={card.label}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={`${panelClass} p-5 sm:p-6`}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#555555]">
                    {card.label}
                  </p>
                  <IconComponent className="h-5 w-5 text-[#111111]" />
                </div>
                <p className="mt-4 text-5xl font-semibold tracking-[-0.08em] text-[#111111]">
                  {card.value}
                </p>
                <p className={`mt-3 text-sm leading-6 ${mutedTextClass}`}>
                  {card.description}
                </p>
              </motion.article>
            );
          })}
        </section>

        <section
          id="product"
          className={`${panelClass} scroll-mt-28 px-5 py-8 sm:px-8 lg:px-10 lg:py-12`}
        >
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
            <div>
              <p className={eyebrowClass}>Product</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#111111] sm:text-5xl">
                One place for the work that happens before and after placement.
              </h2>
            </div>
            <div className="grid gap-3">
              {productPoints.map((point) => (
                <motion.div
                  key={point}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.18 }}
                  className="flex gap-3 rounded-3xl border border-black/10 bg-white/74 p-4 text-sm font-medium leading-6 text-[#3e3e3e]"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#111111]" />
                  {point}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="workflow"
          className={`${panelClass} scroll-mt-28 px-5 py-8 sm:px-8 lg:px-10 lg:py-12`}
        >
          <div className="mx-auto max-w-3xl text-center">
            <p className={eyebrowClass}>Workflow</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#111111] sm:text-5xl">
              A clearer path from resume to shortlist.
            </h2>
          </div>
          <div className="mt-9 grid gap-4 lg:grid-cols-3">
            {workflowSteps.map((step) => (
              <motion.article
                key={step.step}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="rounded-[1.75rem] border border-black/10 bg-white/76 p-6"
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
              </motion.article>
            ))}
          </div>
        </section>

        <section
          id="roles"
          className={`${panelClass} scroll-mt-28 px-5 py-8 sm:px-8 lg:px-10 lg:py-12`}
        >
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className={eyebrowClass}>Roles</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#111111] sm:text-5xl">
                Each team gets the view it needs.
              </h2>
            </div>
            <p className={`max-w-xl text-base leading-7 ${mutedTextClass}`}>
              The same data supports three different jobs: student preparation,
              recruiter review, and admin oversight.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {roleCards.map((card) => {
              const IconComponent = card.icon;
              return (
                <motion.article
                  key={card.title}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-[1.75rem] border border-black/10 bg-white/72 p-5 transition hover:bg-white sm:p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111111] text-white">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
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
                </motion.article>
              );
            })}
          </div>
        </section>

        <section
          id="trust"
          className="grid scroll-mt-28 gap-5 lg:grid-cols-[0.92fr_1.08fr]"
        >
          <div className={`${panelClass} px-5 py-8 sm:px-8 lg:px-10`}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111111] text-white">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-[#111111] sm:text-5xl">
              Built for real use, not just a demo flow.
            </h2>
            <p className={`mt-5 text-base leading-7 ${mutedTextClass}`}>
              The app is split into frontend, backend, AI service, and database
              layers so each part has a clear job.
            </p>
          </div>

          <div className={`${panelClass} p-5 sm:p-6`}>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#6a6a6a]">
              Basics covered
            </p>
            <div className="mt-5 space-y-3">
              {trustItems.map((item) => (
                <motion.div
                  key={item}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.18 }}
                  className="flex gap-3 rounded-3xl border border-black/10 bg-white/74 p-4 text-sm leading-6 text-[#454545]"
                >
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#111111]" />
                  {item}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section
          className={`${panelClass} px-5 py-8 sm:px-8 lg:px-10 lg:py-12`}
        >
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
            <div>
              <p className={eyebrowClass}>FAQ</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#111111] sm:text-5xl">
                Simple answers.
              </h2>
            </div>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <motion.article
                  key={faq.question}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-[1.5rem] border border-black/10 bg-white/74 p-5"
                >
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-[#111111]">
                    {faq.question}
                  </h3>
                  <p className={`mt-2 text-sm leading-6 ${mutedTextClass}`}>
                    {faq.answer}
                  </p>
                </motion.article>
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
              Start with one student profile.
            </h2>
            <p className="mt-5 text-base leading-7 text-white/70 sm:text-lg">
              Then connect preparation, matching, applications, and review in
              the same place.
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

        <footer className={`${panelClass} px-5 py-7 sm:px-8`}>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <EsencelabLogo textClassName="tracking-[0.18em]" />
              <p className={`mt-3 text-sm ${mutedTextClass}`}>
                A clearer placement workflow for students, recruiters, and
                admins.
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
