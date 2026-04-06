'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Menu, Sparkles, X } from 'lucide-react';
import { motion } from 'framer-motion';
import EsencelabLogo from '@/components/EsencelabLogo';
import { useAuth } from '@/contexts/AuthContext';

const workflowSteps = [
  {
    label: 'Step 1',
    title: 'Upload and parse',
    description: 'Upload resume and extract key details.',
  },
  {
    label: 'Step 2',
    title: 'Analyze and match',
    description: 'Run role matching and identify gaps.',
  },
  {
    label: 'Step 3',
    title: 'Track and improve',
    description: 'Follow learning roadmap and apply to jobs.',
  },
];

const statCards = [
  { label: 'Parsed resumes', value: '412+', width: '78%' },
  { label: 'Average role match', value: '89%', width: '89%' },
  { label: 'Shortlist speed gain', value: '3x', width: '68%' },
];

const shellClass =
  'rounded-[40px] border border-white/80 bg-white/62 shadow-[0_34px_90px_-52px_rgba(24,24,24,0.42)] backdrop-blur-[18px]';
const chipClass =
  'inline-flex items-center gap-2 rounded-full border border-[#ececec] bg-white/70 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#161616]';
const lightButtonClass =
  'inline-flex items-center justify-center rounded-full border border-[#ececec] bg-white/70 px-8 py-3 text-base font-medium text-[#161616] transition hover:bg-white';
const darkButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#111111] px-8 py-3 text-base font-semibold text-white transition hover:bg-[#1f1f1f]';

export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const year = new Date().getFullYear();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f4f2]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-black/15 border-t-[#111111]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f4f2] text-[#111111]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(210,210,210,0.42),transparent_34%),radial-gradient(circle_at_100%_0%,rgba(245,245,245,0.94),transparent_34%),linear-gradient(180deg,#efefed_0%,#f5f5f3_55%,#f8f8f6_100%)]" />

      <main className="relative z-10 mx-auto flex w-full max-w-[1380px] flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section id="features" className={`${shellClass} px-4 pb-6 pt-4 sm:px-9 sm:pb-9 sm:pt-7 lg:px-12 lg:pb-10`}>
          <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="inline-flex">
                <EsencelabLogo textClassName="tracking-[0.18em]" />
              </Link>
              <button
                type="button"
                onClick={() => setIsMenuOpen((current) => !current)}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[#ececec] bg-white/72 text-[#111111] transition hover:bg-white lg:hidden"
                aria-label="Toggle navigation menu"
              >
                {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>

            <nav className="hidden items-center justify-center gap-12 text-base font-medium text-[#181818] lg:flex">
              <a href="#features" className="transition hover:opacity-70">
                Features
              </a>
              <a href="#workflow" className="transition hover:opacity-70">
                Workflow
              </a>
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <Link href="/login" className="px-3 py-2 text-base font-semibold text-[#111111] transition hover:opacity-70">
                Login
              </Link>
              <Link href="/register" className={`${darkButtonClass} px-6 py-2.5 text-base`}>
                Start now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </header>

          {isMenuOpen && (
            <div className="mt-2 space-y-2 rounded-[24px] border border-[#ececec] bg-white/78 p-3 lg:hidden">
              <a href="#features" className="block rounded-xl px-4 py-3 text-sm font-medium text-[#181818] transition hover:bg-white">
                Features
              </a>
              <a href="#workflow" className="block rounded-xl px-4 py-3 text-sm font-medium text-[#181818] transition hover:bg-white">
                Workflow
              </a>
              <Link href="/login" className="block rounded-xl px-4 py-3 text-sm font-medium text-[#181818] transition hover:bg-white">
                Login
              </Link>
              <Link href="/register" className={`${darkButtonClass} w-full px-6 py-3 text-sm`}>
                Start now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-auto flex max-w-[760px] flex-col items-center px-1 pb-5 pt-8 text-center sm:px-2 sm:pt-14 lg:pb-10 lg:pt-16"
          >
            <span className={chipClass}>
              <Sparkles className="h-3.5 w-3.5" />
              AI Career Platform
            </span>

            <h1 className="mt-6 max-w-[700px] text-[2.35rem] font-semibold leading-[0.98] tracking-[-0.06em] text-[#111111] min-[420px]:text-[2.6rem] sm:text-[4.1rem] lg:text-[4.7rem]">
              Esencelab{' '}
              <span className="font-serif text-[0.9em] italic tracking-[-0.05em]">
                Career Intelligence
              </span>
            </h1>

            <p className="mt-5 max-w-[700px] text-base font-normal leading-[1.55] text-[#666666] sm:text-[1.5rem] sm:leading-[1.38] lg:text-[1.7rem]">
              Built for resume parsing, skill-gap analysis, and candidate ranking.
            </p>
            <p className="mt-4 text-sm font-medium uppercase tracking-[0.18em] text-[#666666] sm:text-base">
              From SNGCET, for SNGCET.
            </p>

            <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-center sm:gap-4">
              <Link href="/register" className={`${darkButtonClass} w-full sm:w-auto`}>
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login?next=%2Fdashboard" className={`${lightButtonClass} w-full sm:w-auto`}>
                Explore dashboard
              </Link>
            </div>
          </motion.div>

          <div className="grid gap-4 lg:grid-cols-3">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="rounded-[26px] border border-[#ececec] bg-white/66 p-5 shadow-[0_14px_30px_-24px_rgba(17,17,17,0.28)] sm:p-6"
              >
                <p className="text-[0.78rem] font-semibold uppercase tracking-[0.22em] text-[#8a8a8a]">
                  {card.label}
                </p>
                <p className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-[#202020]">
                  {card.value}
                </p>
                <div className="mt-5 h-2 w-full rounded-full bg-[#e8e8e8]">
                  <div
                    className="h-full rounded-full bg-[#a9a9a9]"
                    style={{ width: card.width }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className={`${shellClass} px-5 py-7 sm:px-9 lg:px-12 lg:py-9`}>
          <div className="mx-auto max-w-[1180px]">
            <h2 className="text-[2.35rem] font-semibold tracking-[-0.05em] text-[#111111] sm:text-[3rem]">
              How it works
            </h2>
            <div className="mt-7 grid gap-4 lg:grid-cols-3">
              {workflowSteps.map((step) => (
                <div
                  key={step.label}
                  className="rounded-[24px] border border-[#ececec] bg-white/66 px-5 py-5 shadow-[0_12px_28px_-24px_rgba(17,17,17,0.22)]"
                >
                  <p className="text-[0.76rem] font-semibold uppercase tracking-[0.22em] text-[#959595]">
                    {step.label}
                  </p>
                  <h3 className="mt-2.5 text-[1.65rem] font-semibold tracking-[-0.04em] text-[#1f1f1f]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[0.98rem] text-[#616161]">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${shellClass} px-5 py-9 text-center sm:px-9 lg:px-12 lg:py-12`}>
          <div className="mx-auto max-w-[760px]">
            <h2 className="text-[2.35rem] font-semibold tracking-[-0.05em] text-[#111111] sm:text-[3rem]">
              Built for real hiring outcomes.
            </h2>
            <p className="mt-4 text-base text-[#5f5f5f] sm:text-[1.35rem] sm:leading-[1.4] lg:text-[1.5rem]">
              Turn resumes into clear insights, role-fit scores, and faster hiring decisions.
            </p>
            <p className="mt-4 text-sm italic text-[#666666] sm:text-base">
              &quot;A clearer path from curiosity to career.&quot;
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register" className={darkButtonClass}>
                Create account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className={lightButtonClass}>
                Sign in
              </Link>
            </div>
          </div>
        </section>

        <footer className={`${shellClass} px-5 py-9 text-center sm:px-9 lg:px-12 lg:py-12`}>
          <div className="mx-auto max-w-[820px]">
            <EsencelabLogo className="justify-center" textClassName="tracking-[0.18em]" />
            <p className="mt-4 text-base text-[#5f5f5f]">
              AI Resume and Career Intelligence Platform
            </p>
            <div className="mt-6 border-t border-[#e6e6e6] pt-5 text-sm text-[#555555]">
              (c) {year} Esencelab. All rights reserved.
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
