"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import OstoraLogo from "@/components/brand/OstoraLogo";

export default function RegisterPage() {
  const router = useRouter();

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
            src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&h=800&fit=crop&q=80"
            alt="Professional success"
            className="rounded-3xl shadow-2xl w-full"
          />
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Sign up now – free and in just 2 minutes!</h1>
            <p className="text-base text-gray-600">
              Already a member?{" "}
              <Link href="/login" className="font-semibold text-gray-900 hover:underline">
                Sign in
              </Link>
            </p>
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
        </div>
      </div>
    </main>
  );
}