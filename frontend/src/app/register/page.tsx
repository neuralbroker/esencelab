"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import EsencelabLogo from "@/components/EsencelabLogo";

const shellClass = "app-glass-shell";
const panelClass = "app-glass-panel";
const chipClass = "app-chip";
const inputClass = "app-input";

const pageFallback = (
  <div className="app-page-surface flex min-h-screen items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-black/15 border-t-[#111111]" />
  </div>
);

function RegisterPageContent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!trimmedName || !normalizedEmail || !normalizedPassword) {
      setError("All fields are required.");
      return;
    }

    if (normalizedPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (normalizedPassword !== confirmPassword.trim()) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await register({
        name: trimmedName,
        email: normalizedEmail,
        password: normalizedPassword,
        role: "student",
      });
      router.replace("/dashboard");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isAuthenticated) {
    return pageFallback;
  }

  return (
    <div className="app-page-surface min-h-screen text-[#111111]">
      <div className="pointer-events-none fixed inset-0 app-page-surface" />

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
          <section
            className={`${panelClass} flex min-h-[380px] flex-col justify-start sm:min-h-[560px]`}
          >
            <span className={chipClass}>Student account</span>
            <h1 className="mt-6 max-w-[350px] text-[2.35rem] font-semibold leading-[0.98] tracking-[-0.06em] text-[#111111] sm:mt-7 sm:text-[3.7rem]">
              Start with Esencelab.
            </h1>
            <p className="mt-4 max-w-[400px] text-[0.98rem] leading-[1.55] text-[#5f5f5f] sm:text-[1.02rem]">
              Students can create an account instantly. Recruiters must request
              admin approval before hiring tools are enabled.
            </p>
            <Link
              href="/recruiter-request"
              className="mt-6 inline-flex items-center text-[0.98rem] font-semibold text-[#111111] underline decoration-[#cfcfcf] underline-offset-4"
            >
              Recruiter? Request platform access
            </Link>

            <ul className="mt-7 space-y-3 text-[1rem] leading-[1.5] text-[#4f4f4f]">
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#111111]" />
                <span>Upload and parse resumes quickly</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#111111]" />
                <span>Check role-fit and missing skills</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#111111]" />
                <span>Track roadmap progress and applications</span>
              </li>
            </ul>
          </section>

          <section className={`${panelClass} min-h-[380px] sm:min-h-[560px]`}>
            <h2 className="text-[1.9rem] font-semibold tracking-[-0.05em] text-[#111111] sm:text-[2.1rem]">
              Student account setup
            </h2>
            <p className="mt-2 text-[1.02rem] text-[#5f5f5f]">
              Fill in the details below to create your student workspace.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              {error && (
                <div className="rounded-[18px] border border-[#ececec] bg-white px-4 py-3 text-sm text-[#565656]">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="register-name"
                  className="text-[0.98rem] font-semibold text-[#444444]"
                >
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
                <label
                  htmlFor="register-email"
                  className="text-[0.98rem] font-semibold text-[#444444]"
                >
                  Email
                </label>
                <input
                  id="register-email"
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
                <label
                  htmlFor="register-password"
                  className="text-[0.98rem] font-semibold text-[#444444]"
                >
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
                <label
                  htmlFor="register-confirm"
                  className="text-[0.98rem] font-semibold text-[#444444]"
                >
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] bg-[#111111] px-6 py-3.5 text-[1.02rem] font-semibold text-white transition hover:bg-[#1d1d1d] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Creating account..." : "Create account"}
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <div className="mt-5 space-y-2 text-[0.98rem] text-[#505050]">
              <p>
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-[#111111]">
                  Sign in
                </Link>
              </p>
              <p>
                Need recruiter access?{" "}
                <Link
                  href="/recruiter-request"
                  className="font-semibold text-[#111111]"
                >
                  Request admin approval
                </Link>
              </p>
            </div>
          </section>
        </motion.main>
      </div>
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
