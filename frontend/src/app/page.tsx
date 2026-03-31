'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import EsencelabLogo from '@/components/EsencelabLogo';

const panelClass =
  'rounded-[30px] border border-white/72 bg-white/72 shadow-[0_26px_58px_-46px_rgba(24,24,24,0.45)] backdrop-blur-md';
const ghostButtonClass =
  'rounded-full border border-white/72 bg-white/64 px-4 py-2 text-sm font-semibold text-[#111111] transition hover:bg-white/78';
const primaryButtonClass =
  'inline-flex items-center gap-1.5 rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2a2a2a]';
const secondaryButtonClass =
  'rounded-full border border-white/72 bg-white/64 px-4 py-2 text-sm font-semibold text-[#111111] transition hover:bg-white/78';

export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const year = new Date().getFullYear();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-black/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f2f2] text-[#111111]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(200,200,200,0.33),transparent_38%),radial-gradient(circle_at_100%_5%,rgba(245,245,245,0.88),transparent_32%),linear-gradient(180deg,#f2f2f2_0%,#f5f5f5_52%,#fafafa_100%)]" />

      <main className="relative z-10 mx-auto w-full max-w-[1320px] px-4 pb-16 pt-6 sm:px-8 sm:pt-8">
        <section className="relative overflow-hidden rounded-[36px] border border-white/75 bg-white/50 shadow-[0_42px_84px_-58px_rgba(28,28,28,0.58)]">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(234,234,234,0.82)_0%,rgba(244,244,244,0.72)_46%,rgba(250,250,250,0.8)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[44%] bg-[linear-gradient(180deg,rgba(220,220,220,0.34)_0%,rgba(255,255,255,0)_100%)]" />

          <div className="relative flex min-h-[500px] flex-col">
            <header className="mx-auto flex w-full max-w-[1160px] items-center justify-between gap-4 px-5 pt-5 sm:px-8 sm:pt-7">
              <Link href="/" className="inline-flex">
                <EsencelabLogo />
              </Link>

              <div className="flex items-center gap-2">
                <Link href="/login?role=student" className={ghostButtonClass}>
                  Student Login
                </Link>
                <Link href="/login?role=employer" className={ghostButtonClass}>
                  Recruiter Login
                </Link>
                <Link href="/register" className={primaryButtonClass}>
                  Sign Up
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </header>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mx-auto mt-16 w-full max-w-[760px] px-5 text-center sm:px-0"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/72 bg-white/64 px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#111111]">
                <Sparkles className="h-3.5 w-3.5" />
                AI Career Platform
              </span>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.02] tracking-tight text-[#111111] sm:text-6xl">
                Esencelab
                <span className="font-serif italic text-[#111111]"> Career Intelligence</span>
              </h1>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#111111] px-7 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_-26px_rgba(30,30,30,0.8)] transition hover:bg-[#2a2a2a]"
                >
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login?role=student"
                  className="inline-flex items-center justify-center rounded-full border border-white/72 bg-white/64 px-7 py-3 text-sm font-semibold text-[#111111] transition hover:bg-white/78"
                >
                  Login
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-[1320px] px-4 pb-10 sm:px-8 sm:pb-12">
        <div className={`rounded-[28px] p-7 sm:p-9 ${panelClass}`}>
          <div className="flex flex-col items-center justify-center text-center">
            <EsencelabLogo
              className="gap-2"
              iconClassName="h-8 w-8"
              textClassName="text-xs tracking-[0.18em] text-[#4a4a4a]/82"
            />
            <p className="mt-3 max-w-md text-sm text-[#4a4a4a]/84">
              AI Resume and Career Intelligence Platform
            </p>
          </div>
          <div className="mt-5 border-t border-white/72 pt-4 text-center text-xs text-[#4a4a4a]/84">
            (c) {year} Esencelab. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

