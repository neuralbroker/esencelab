'use client';

/**
 * Login page.
 *
 * This page signs users in and routes successful logins into the correct
 * dashboard flow.
 */
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import EsencelabLogo from '@/components/EsencelabLogo';
import {
  AUTH_ACCESS_ORDER,
  AUTH_ACCESS_OPTIONS,
  getAuthAccessHref,
  isProvisionedAccessRole,
  normalizeAuthAccessRole,
} from '@/lib/authAccess';
import { sanitizeNextPath, withNextPath } from '@/lib/routeAccess';

const panelClass =
  'rounded-[30px] border border-white/72 bg-white/72 shadow-[0_26px_58px_-46px_rgba(24,24,24,0.45)] backdrop-blur-md';
const ghostButtonClass =
  'rounded-full border border-white/72 bg-white/64 px-4 py-2 text-sm font-semibold text-[#111111] transition hover:bg-white/78';
const inputClass =
  'w-full rounded-2xl border border-white/78 bg-white/74 px-4 py-3 text-base text-[#111111] outline-none transition focus:border-[#4b4b4b] focus:ring-2 focus:ring-[#4b4b4b]/20';

const getAuthError = (error: any) => {
  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.message;

  if (status === 401) return 'Invalid credentials. Please check your email and password.';
  if (!error?.response) return 'Cannot reach backend API. Start backend on http://localhost:3001.';
  return serverMessage || 'Login failed. Please try again.';
};

const pageFallback = (
  <div className="flex min-h-screen items-center justify-center bg-[#f2f2f2]">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-black/20 border-t-primary" />
  </div>
);

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedRole = normalizeAuthAccessRole(searchParams.get('role'));
  const selectedAccess = AUTH_ACCESS_OPTIONS[selectedRole];
  const nextPath = sanitizeNextPath(searchParams.get('next'));

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(nextPath || '/dashboard');
    }
  }, [authLoading, isAuthenticated, nextPath, router]);

  useEffect(() => {
    setError('');
  }, [selectedRole]);

  const runLogin = async (nextEmail: string, nextPassword: string) => {
    const normalizedEmail = nextEmail.trim().toLowerCase();
    const normalizedPassword = nextPassword.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setError('Email and password are required.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await login({ email: normalizedEmail, password: normalizedPassword });
      router.replace(nextPath || '/dashboard');
    } catch (err: any) {
      setError(getAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await runLogin(email, password);
  };

  if (authLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f2f2]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-black/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f2f2] text-[#111111]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(200,200,200,0.33),transparent_38%),radial-gradient(circle_at_100%_5%,rgba(245,245,245,0.88),transparent_32%),linear-gradient(180deg,#f2f2f2_0%,#f5f5f5_52%,#fafafa_100%)]" />

      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-4 pt-8 sm:px-6">
        <Link href="/" className="inline-flex">
          <EsencelabLogo />
        </Link>
        <Link href="/" className={ghostButtonClass}>
          Back to home
        </Link>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 mx-auto mt-6 grid w-full max-w-5xl gap-4 px-4 pb-12 sm:px-6 lg:grid-cols-[0.95fr,1.05fr]"
      >
        <section className={`${panelClass} p-8 sm:p-10`}>
          <span className="inline-flex rounded-full border border-white/72 bg-white/64 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#4a4a4a]">
            Role-based sign in
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#111111] sm:text-5xl">
            One sign-in. Three workspaces.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#4a4a4a]/88">
            Students, employers, and admins all use the same email/password form. Your account role
            decides which dashboard opens after sign-in.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {AUTH_ACCESS_ORDER.map((role) => {
              const option = AUTH_ACCESS_OPTIONS[role];
              const isSelected = role === selectedRole;

              return (
                <Link
                  key={role}
                  href={withNextPath(getAuthAccessHref('/login', role), nextPath)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    isSelected
                      ? 'border-[#111111] bg-white/88 shadow-[0_18px_34px_-28px_rgba(20,20,20,0.72)]'
                      : 'border-white/72 bg-white/66 hover:bg-white/80'
                  }`}
                >
                  <p className="text-sm font-semibold text-[#111111]">{option.label}</p>
                  <p className="mt-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#4a4a4a]/74">
                    {option.accessMode}
                  </p>
                </Link>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-white/72 bg-white/68 p-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[#4a4a4a]/74">
              Selected access
            </p>
            <p className="mt-2 text-lg font-semibold text-[#111111]">{selectedAccess.label}</p>
            <p className="mt-2 text-sm leading-relaxed text-[#4a4a4a]/88">
              {selectedAccess.loginDescription}
            </p>
          </div>
        </section>

        <section className={`${panelClass} p-8 sm:p-10`}>
          <h2 className="text-2xl font-semibold tracking-tight text-[#111111]">Account login</h2>
          <p className="mt-2 text-sm text-[#4a4a4a]/88">
            There is no separate employer or admin login URL. Use your existing credentials and we
            will route you into the correct workspace automatically.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-800">
                {error}
              </div>
            )}

            {isProvisionedAccessRole(selectedRole) && (
              <div className="rounded-xl border border-[#111111]/10 bg-[#111111]/[0.04] px-4 py-3 text-sm text-[#303030]">
                {selectedAccess.label} accounts are provisioned first, then signed in here with the
                same form.
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-[#4a4a4a]/88">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-[#4a4a4a]/88">
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#111111] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? 'Signing in...' : 'Continue'}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-sm text-[#4a4a4a]/88">
            <p>
              {selectedRole === 'student'
                ? 'Need a new student account? Public signup is available.'
                : `${selectedAccess.label} access is not created on the public signup page.`}
            </p>
            <Link
              href={withNextPath(getAuthAccessHref('/register', selectedRole), nextPath)}
              className="font-semibold text-[#111111] transition hover:text-[#111111]"
            >
              {selectedRole === 'student'
                ? 'Create a student account'
                : `See ${selectedAccess.label.toLowerCase()} access rules`}
            </Link>
          </div>
        </section>
      </motion.main>
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

