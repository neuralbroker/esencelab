'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import EsencelabLogo from '@/components/EsencelabLogo';

const shellClass =
  'rounded-[34px] border border-[#ececec] bg-white/62 shadow-[0_30px_80px_-54px_rgba(17,17,17,0.32)] backdrop-blur-[18px]';
const panelClass =
  'rounded-[30px] border border-[#ececec] bg-white/68 p-7 shadow-[0_18px_44px_-34px_rgba(17,17,17,0.22)] sm:p-9';
const chipClass =
  'inline-flex rounded-full border border-[#ececec] bg-white/72 px-3 py-1.5 text-[0.76rem] font-semibold uppercase tracking-[0.22em] text-[#757575]';
const inputClass =
  'mt-2 w-full rounded-[18px] border border-[#ececec] bg-white px-5 py-3.5 text-base text-[#111111] outline-none transition placeholder:text-[#b3b8c3] focus:border-[#d8d8d8] focus:ring-2 focus:ring-[#e9e9e9]';

const pageFallback = (
  <div className="flex min-h-screen items-center justify-center bg-[#f4f4f2]">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-black/15 border-t-[#111111]" />
  </div>
);

const getAuthError = (error: any) => {
  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.message;

  if (status === 401) return 'Invalid email or password.';
  if (!error?.response) return 'Unable to connect. Please try again later.';
  return serverMessage || 'Login failed. Please try again.';
};

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/dashboard';

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(nextPath);
    }
  }, [authLoading, isAuthenticated, nextPath, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setError('Email and password are required.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await login({ email: normalizedEmail, password: normalizedPassword });
      router.replace(nextPath);
    } catch (err: any) {
      setError(getAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isAuthenticated) {
    return pageFallback;
  }

  return (
    <div className="min-h-screen bg-[#f4f4f2] text-[#111111]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(210,210,210,0.42),transparent_34%),radial-gradient(circle_at_100%_0%,rgba(245,245,245,0.94),transparent_34%),linear-gradient(180deg,#efefed_0%,#f5f5f3_55%,#f8f8f6_100%)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1040px] flex-col px-4 py-5 sm:px-6 sm:py-7 lg:px-0 lg:py-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex">
            <EsencelabLogo textClassName="tracking-[0.18em]" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-[#ececec] bg-white/72 px-5 py-2.5 text-[0.98rem] font-semibold text-[#111111] transition hover:bg-white"
          >
            Back to home
          </Link>
        </header>

        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className={`${shellClass} grid gap-4 overflow-hidden p-3 sm:p-5 lg:grid-cols-[1fr_1.12fr]`}
        >
          <section className={`${panelClass} flex min-h-[320px] flex-col justify-start sm:min-h-[430px]`}>
            <span className={chipClass}>Sign in</span>
            <h1 className="mt-6 max-w-[330px] text-[2.35rem] font-semibold leading-[0.98] tracking-[-0.06em] text-[#111111] sm:mt-7 sm:text-[3.7rem]">
              Welcome back.
            </h1>
            <p className="mt-4 max-w-[380px] text-[0.98rem] leading-[1.55] text-[#5f5f5f] sm:text-[1.02rem]">
              Access your Esencelab dashboard, resume analysis, and role-fit workflows.
            </p>
          </section>

          <section className={`${panelClass} min-h-[320px] sm:min-h-[430px]`}>
            <h2 className="text-[1.9rem] font-semibold tracking-[-0.05em] text-[#111111] sm:text-[2.1rem]">
              Account login
            </h2>
            <p className="mt-2 text-[1.02rem] text-[#5f5f5f]">
              Enter your credentials to continue.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              {error && (
                <div className="rounded-[18px] border border-[#ececec] bg-white px-4 py-3 text-sm text-[#565656]">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="login-email" className="text-[0.98rem] font-semibold text-[#444444]">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="login-password" className="text-[0.98rem] font-semibold text-[#444444]">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  autoComplete="current-password"
                  required
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] bg-[#111111] px-6 py-3.5 text-[1.02rem] font-semibold text-white transition hover:bg-[#1d1d1d] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? 'Signing in...' : 'Continue'}
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <p className="mt-5 text-[0.98rem] text-[#505050]">
              New to Esencelab?{' '}
              <Link href="/register" className="font-semibold text-[#111111]">
                Create an account
              </Link>
            </p>
          </section>
        </motion.main>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={pageFallback}>
      <LoginPageContent />
    </Suspense>
  );
}
