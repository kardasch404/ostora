"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <main className="page-shell space-y-4">
      <RegisterForm
        onSuccess={(email, role) => {
          if (role === "ADMIN") {
            router.push("/admin");
            return;
          }
          router.push(`/register/verify-email?email=${encodeURIComponent(email)}`);
        }}
      />
      <p className="text-center text-sm text-[var(--muted)]">
        Already have an account? <Link href="/login" className="font-semibold">Sign in</Link>
      </p>
    </main>
  );
}
