"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import OstoraLogo from "@/components/brand/OstoraLogo";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = searchParams.get("next") || "/dashboard";

  return (
    <main className="min-h-screen bg-white flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-black p-16 items-center justify-center relative overflow-hidden">
        <div className="absolute top-12 left-12">
          <OstoraLogo
            href="/"
            textClassName="text-2xl font-bold text-white"
            iconWrapperClassName="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600"
            imageClassName="h-7 w-7 object-contain"
          />
        </div>
        
        <div className="max-w-2xl w-full">
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=800&fit=crop&q=80"
            alt="Professional team collaboration"
            className="rounded-3xl shadow-2xl w-full"
          />
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome back!</h1>
            <p className="text-base text-gray-600">
              Not a XING member yet?{" "}
              <Link href="/register" className="font-semibold text-gray-900 hover:underline">
                Sign up for free
              </Link>
            </p>
          </div>

          <LoginForm
            onSuccess={(role) => {
              if (role === "ADMIN") {
                router.push("/admin");
                return;
              }
              router.push(next);
            }}
          />
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white" />}>
      <LoginContent />
    </Suspense>
  );
}