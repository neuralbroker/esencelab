'use client';

/**
 * Registration page.
 *
 * Public signup is student-focused, so this page collects the required
 * account fields and delegates the actual auth work to the shared provider.
 */
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
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

const onboardingPoints = [
  'Upload and parse resumes quickly',
  'Check role-fit and missing skills',
  'Track roadmap progress and applications',
];

const panelClass =
  'rounded-[30px] border border-white/72 bg-white/72 shadow-[0_26px_58px_-46px_rgba(24,24,24,0.45)] backdrop-blur-md';
const ghostButtonClass =
  'rounded-full border border-white/72 bg-white/64 px-4 py-2 text-sm font-semibold text-[#111111] transition hover:bg-white/78';
const inputClass =
  'w-full rounded-2xl border border-white/78 bg-white/74 px-4 py-3 text-base text-[#111111] outline-none transition focus:border-[#4b4b4b] focus:ring-2 focus:ring-[#4b4b4b]/20';

const pageFallback = (
  <div className="flex min-h-screen items-center justify-center bg-[#f2f2f2]">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-black/20 border-t-primary" />
  </div>
);

function RegisterPageContent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedRole = normalizeAuthAccessRole(searchParams.get('role'));
  const selectedAccess = AUTH_ACCESS_OPTIONS[selectedRole];
  const isProvisionedRole = isProvisionedAccessRole(selectedRole);
  const nextPath = sanitizeNextPath(searchParams.get('next'));

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(nextPath || '/dashboard');
    }
  }, [authLoading, isAuthenticated, nextPath, router]);

  useEffect(() => {
    setError('');
  }, [selectedRole]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isProvisionedRole) {
      setError(`${selectedAccess.label} accounts must be provisioned before sign-in.`);
      return;
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!trimmedName || !normalizedEmail || !normalizedPassword) {
      setError('All fields are required.');
      return;
    }

    if (normalizedPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (normalizedPassword !== confirmPassword.trim()) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await register({
        name: trimmedName,
        email: normalizedEmail,
        password: normalizedPassword,
        role: 'student',
      });
      router.replace(nextPath || '/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
            Student-only signup
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#111111] sm:text-5xl">
            Choose the right entry point.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#4a4a4a]/88">
            Students create accounts here. Employer and admin access use the same sign-in page after
            the account has been provisioned.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {AUTH_ACCESS_ORDER.map((role) => {
              const option = AUTH_ACCESS_OPTIONS[role];
              const isSelected = role === selectedRole;

              return (
                <Link
                  key={role}
                  href={withNextPath(getAuthAccessHref('/register', role), nextPath)}
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
              {selectedAccess.registerDescription}
            </p>
          </div>

          <ul className="mt-7 space-y-2 text-sm text-[#4a4a4a]/88">
            {onboardingPoints.map((point) => (
              <li key={point} className="flex items-start gap-2">
                <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-[#111111]" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${panelClass} p-8 sm:p-10`}>
          <h2 className="text-2xl font-semibold tracking-tight text-[#111111]">
            {isProvisionedRole ? `${selectedAccess.label} access is provisioned` : 'Create student account'}
          </h2>
          <p className="mt-2 text-sm text-[#4a4a4a]/88">
            {isProvisionedRole
              ? 'This page explains access for provisioned roles. It does not create employer or admin accounts.'
              : 'Public signup creates a student workspace and routes straight into the student dashboard.'}
          </p>

          {isProvisionedRole ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-[#111111]/10 bg-[#111111]/[0.04] p-5">
                <p className="text-sm font-semibold text-[#111111]">{selectedAccess.label} accounts are not public.</p>
                <p className="mt-2 text-sm leading-relaxed text-[#4a4a4a]/88">
                  {selectedAccess.registerDescription} Once your account exists, use the shared login page to
                  access the correct workspace automatically.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={withNextPath(getAuthAccessHref('/login', selectedRole), nextPath)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#111111] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2a2a]"
                >
                  Sign in with existing {selectedAccess.label.toLowerCase()} access
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={withNextPath(getAuthAccessHref('/register', 'student'), nextPath)}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/72 bg-white/64 px-6 py-3 text-sm font-semibold text-[#111111] transition hover:bg-white/78"
                >
                  Switch to student signup
                </Link>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {error && (
                  <div className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-800">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="register-name" className="mb-2 block text-sm font-medium text-[#4a4a4a]/88">
                    Full name
                  </label>
                  <input
                    id="register-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="register-email" className="mb-2 block text-sm font-medium text-[#4a4a4a]/88">
                    Email
                  </label>
                  <input
                    id="register-email"
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
                  <label htmlFor="register-password" className="mb-2 block text-sm font-medium text-[#4a4a4a]/88">
                    Password
                  </label>
                  <input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="********"
                    autoComplete="new-password"
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="register-confirm" className="mb-2 block text-sm font-medium text-[#4a4a4a]/88">
                    Confirm password
                  </label>
                  <input
                    id="register-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="********"
                    autoComplete="new-password"
                    required
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#111111] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? 'Creating account...' : 'Create student account'}
                  {!isLoading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              <div className="mt-6 text-sm text-[#4a4a4a]/88">
                Already have an account?{' '}
                <Link
                  href={withNextPath(getAuthAccessHref('/login', 'student'), nextPath)}
                  className="font-semibold text-[#111111] transition hover:text-[#111111]"
                >
                  Sign in
                </Link>
              </div>
            </>
          )}
        </section>
      </motion.main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={pageFallback}>
      <RegisterPageContent />
    </Suspense>
  );
}

