"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import EsencelabLogo from "@/components/EsencelabLogo";
import {
  getReadableErrorMessage,
  submitRecruiterAccessRequest,
} from "@/lib/dashboardApi";

const shellClass =
  "rounded-[34px] border border-[#ececec] bg-white/62 shadow-[0_30px_80px_-54px_rgba(17,17,17,0.32)] backdrop-blur-[18px]";
const panelClass =
  "rounded-[30px] border border-[#ececec] bg-white/68 p-7 shadow-[0_18px_44px_-34px_rgba(17,17,17,0.22)] sm:p-9";
const chipClass =
  "inline-flex rounded-full border border-[#ececec] bg-white/72 px-3 py-1.5 text-[0.76rem] font-semibold uppercase tracking-[0.22em] text-[#757575]";
const inputClass =
  "mt-2 w-full rounded-[18px] border border-[#ececec] bg-white px-5 py-3.5 text-base text-[#111111] outline-none transition placeholder:text-[#b3b8c3] focus:border-[#d8d8d8] focus:ring-2 focus:ring-[#e9e9e9]";

export default function RecruiterRequestPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    companyName: "",
    companyWebsite: "",
    jobTitle: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      companyName: form.companyName.trim(),
      companyWebsite: form.companyWebsite.trim(),
      jobTitle: form.jobTitle.trim(),
      message: form.message.trim(),
    };

    if (
      !payload.name ||
      !payload.email ||
      !payload.companyName ||
      !payload.message
    ) {
      setError(
        "Name, email, company name, and platform use case are required.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await submitRecruiterAccessRequest(payload);
      setSubmittedEmail(payload.email);
      setForm({
        name: "",
        email: "",
        companyName: "",
        companyWebsite: "",
        jobTitle: "",
        message: "",
      });
    } catch (err: any) {
      setError(
        getReadableErrorMessage(err, "Unable to submit recruiter request."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f2] text-[#111111]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(210,210,210,0.42),transparent_34%),radial-gradient(circle_at_100%_0%,rgba(245,245,245,0.94),transparent_34%),linear-gradient(180deg,#efefed_0%,#f5f5f3_55%,#f8f8f6_100%)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1080px] flex-col px-4 py-5 sm:px-6 sm:py-7 lg:px-0 lg:py-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex">
            <EsencelabLogo textClassName="tracking-[0.18em]" />
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-[#ececec] bg-white/72 px-5 py-2.5 text-[0.98rem] font-semibold text-[#111111] transition hover:bg-white"
            >
              Student login
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-[#ececec] bg-white/72 px-5 py-2.5 text-[0.98rem] font-semibold text-[#111111] transition hover:bg-white"
            >
              Back to home
            </Link>
          </div>
        </header>

        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className={`${shellClass} grid gap-4 overflow-hidden p-3 sm:p-5 lg:grid-cols-[0.95fr_1.15fr]`}
        >
          <section
            className={`${panelClass} flex min-h-[420px] flex-col justify-start sm:min-h-[620px]`}
          >
            <span className={chipClass}>Recruiter approval</span>
            <h1 className="mt-6 max-w-[420px] text-[2.35rem] font-semibold leading-[0.98] tracking-[-0.06em] text-[#111111] sm:mt-7 sm:text-[3.7rem]">
              Request access to hire on Esencelab.
            </h1>
            <p className="mt-4 max-w-[430px] text-[0.98rem] leading-[1.55] text-[#5f5f5f] sm:text-[1.02rem]">
              Student accounts can sign up immediately. Recruiters are reviewed
              by admins first so candidate data, job posts, and platform access
              stay trusted.
            </p>

            <div className="mt-8 grid gap-3">
              {[
                {
                  icon: ShieldCheck,
                  title: "Admin-reviewed access",
                  text: "Your request is checked before a recruiter workspace is created.",
                },
                {
                  icon: Building2,
                  title: "Company context required",
                  text: "Tell us how your team plans to use Esencelab for hiring.",
                },
                {
                  icon: CheckCircle2,
                  title: "Secure onboarding",
                  text: "Once approved, an admin shares a temporary password securely.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-[24px] border border-[#ececec] bg-white/62 p-4"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#111111] text-white">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#111111]">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#5f5f5f]">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className={`${panelClass} min-h-[420px] sm:min-h-[620px]`}>
            <h2 className="text-[1.9rem] font-semibold tracking-[-0.05em] text-[#111111] sm:text-[2.1rem]">
              Recruiter request
            </h2>
            <p className="mt-2 text-[1.02rem] text-[#5f5f5f]">
              Submit your details. Admin approval is required before recruiter
              login works.
            </p>

            {submittedEmail && (
              <div className="mt-6 rounded-[22px] border border-[#d8ead8] bg-[#f5fbf4] px-4 py-3 text-sm leading-6 text-[#315231]">
                Request received for{" "}
                <span className="font-semibold">{submittedEmail}</span>. You
                will be contacted after admin review.
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              {error && (
                <div className="rounded-[18px] border border-[#ececec] bg-white px-4 py-3 text-sm text-[#565656]">
                  {error}
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="request-name"
                    className="text-[0.98rem] font-semibold text-[#444444]"
                  >
                    Full name
                  </label>
                  <input
                    id="request-name"
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    placeholder="Your name"
                    autoComplete="name"
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="request-email"
                    className="text-[0.98rem] font-semibold text-[#444444]"
                  >
                    Work email
                  </label>
                  <input
                    id="request-email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    placeholder="you@company.com"
                    autoComplete="email"
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="request-company"
                    className="text-[0.98rem] font-semibold text-[#444444]"
                  >
                    Company name
                  </label>
                  <input
                    id="request-company"
                    type="text"
                    value={form.companyName}
                    onChange={(event) =>
                      updateField("companyName", event.target.value)
                    }
                    placeholder="Company"
                    autoComplete="organization"
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="request-title"
                    className="text-[0.98rem] font-semibold text-[#444444]"
                  >
                    Role / title
                  </label>
                  <input
                    id="request-title"
                    type="text"
                    value={form.jobTitle}
                    onChange={(event) =>
                      updateField("jobTitle", event.target.value)
                    }
                    placeholder="Talent partner"
                    autoComplete="organization-title"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="request-website"
                  className="text-[0.98rem] font-semibold text-[#444444]"
                >
                  Company website
                </label>
                <input
                  id="request-website"
                  type="url"
                  value={form.companyWebsite}
                  onChange={(event) =>
                    updateField("companyWebsite", event.target.value)
                  }
                  placeholder="https://company.com"
                  autoComplete="url"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="request-message"
                  className="text-[0.98rem] font-semibold text-[#444444]"
                >
                  How will you use Esencelab?
                </label>
                <textarea
                  id="request-message"
                  rows={5}
                  value={form.message}
                  onChange={(event) =>
                    updateField("message", event.target.value)
                  }
                  placeholder="Tell admins about your hiring needs, roles, and expected usage."
                  required
                  className={`${inputClass} min-h-[132px] resize-y`}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] bg-[#111111] px-6 py-3.5 text-[1.02rem] font-semibold text-white transition hover:bg-[#1d1d1d] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting
                  ? "Submitting request..."
                  : "Send request to admin"}
                {!isSubmitting && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </section>
        </motion.main>
      </div>
    </div>
  );
}
