"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = searchParams.get("next") || "/dashboard";

  return (
    <main className="page-shell space-y-4">
      <LoginForm
        onSuccess={(role) => {
          if (role === "ADMIN") {
            router.push("/admin");
            return;
          }
          router.push(next);
        }}
      />
      <p className="text-center text-sm text-[var(--muted)]">
        New here? <Link href="/register" className="font-semibold">Create account</Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="page-shell" />}>
      <LoginContent />
    </Suspense>
  );
}
