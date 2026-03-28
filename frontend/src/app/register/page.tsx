"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-8">
            <div className="w-10 h-10 bg-black rounded-button flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-black">Ostora</span>
          </Link>
        </div>
        
        <RegisterForm
          onSuccess={(email, role) => {
            if (role === "ADMIN") {
              router.push("/admin");
              return;
            }
            router.push(`/register/verify-email?email=${encodeURIComponent(email)}`);
          }}
        />
        
        <p className="text-center text-body-sm text-gray-500">
          Already have an account? <Link href="/login" className="font-semibold text-black hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}