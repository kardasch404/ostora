"use client";

import Link from "next/link";
import { Suspense } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sendOtpRequest, verifyEmailOtpRequest } from "@/services/auth.service";

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "your@email.com";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [expirySeconds, setExpirySeconds] = useState(10 * 60);

  useEffect(() => {
    const tick = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(tick);
  }, []);

  const resendDisabled = resendCooldown > 0;
  const isExpired = expirySeconds <= 0;

  const title = useMemo(() => "Verify your identity", []);

  const handleResendCode = async () => {
    if (resendDisabled || isResending) {
      return;
    }

    setIsResending(true);
    setError(null);
    setSuccess(null);

    try {
      await sendOtpRequest(email);
      setResendCooldown(30);
      setExpirySeconds(10 * 60);
      setSuccess("A new verification code was sent to your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend verification code.");
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!/^\d{6}$/.test(code)) {
      setError("Please enter a valid 6-digit verification code.");
      return;
    }

    if (isExpired) {
      setError("This code has expired. Please request a new code.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await verifyEmailOtpRequest(email, code);
      setSuccess("Email verified successfully.");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired verification code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell">
      <fieldset className="glass-card mx-auto max-w-2xl p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-3">
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-[var(--muted)]">
              Please enter this code to verify your identity and complete your sign-in to Ostora.
            </p>
          </section>

          <section className="rounded-xl border border-[var(--foreground)]/15 bg-white p-4">
            <p className="mb-2 text-sm font-semibold">E-Mail</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span data-testid="email-display" className="font-medium">
                {email}
              </span>
              <Link href="/register" className="font-semibold text-[var(--ring)]">
                Change
              </Link>
            </div>
          </section>

          <section className="rounded-xl border border-[var(--foreground)]/15 bg-white p-4">
            <label htmlFor="verification-code" className="mb-2 block text-sm font-semibold">
              Verification code
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <input
                id="verification-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-stellig"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                className="ring-focus w-full rounded-lg border border-[var(--foreground)]/20 bg-white px-3 py-2 sm:flex-1"
              />
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendDisabled || isResending}
                className="ring-focus rounded-lg border border-[var(--foreground)]/20 px-4 py-2 font-semibold disabled:opacity-60"
              >
                {isResending ? "Sending..." : `Resend code ${resendDisabled ? `${resendCooldown}s` : ""}`}
              </button>
            </div>
            <p className="mt-3 text-sm text-[var(--muted)]">
              This code expires in <strong>{formatTimer(expirySeconds)}</strong> (valid for 10 minutes)
            </p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            {success && <p className="mt-2 text-sm text-green-700">{success}</p>}
          </section>

          <p className="text-sm text-[var(--muted)]">For additional help, contact Ostora Support.</p>

          <p className="rounded-lg border border-[var(--foreground)]/15 bg-white p-3 text-xs text-[var(--muted)]">
            Ostora Platform will never email you and ask you to disclose or verify your password,
            credit card, or banking account number. If you receive a suspicious email with a link
            to update your account information, do not click the link. Instead, report the email
            to noreplayostora@gmail.com for investigation.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="ring-focus w-full rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-white"
          >
            {isSubmitting ? "Verifying..." : "Continue"}
          </button>
        </form>
      </fieldset>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="page-shell" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
