"use client";

import { z } from "zod";
import Cookies from "js-cookie";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginRequest } from "@/services/auth.service";
import { ROLE_COOKIE, ROLE_STORAGE_KEY, TOKEN_COOKIE, TOKEN_STORAGE_KEY } from "@/lib/constants";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginFailure, loginStart, loginSuccess } from "@/store/slices/auth-slice";

const loginSchema = z.object({
  email: z.email("Please provide a valid email address"),
  password: z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .regex(/[A-Z]/, "Password must include one uppercase letter")
    .regex(/[0-9]/, "Password must include one number"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: (role: "USER" | "ADMIN" | "RECRUITER") => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const onSubmit = async (values: LoginFormValues) => {
    dispatch(loginStart());

    try {
      const result = await loginRequest(values.email, values.password);

      const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";

      Cookies.set(TOKEN_COOKIE, result.accessToken, { secure: isHttps, sameSite: "lax", expires: 1 });
      Cookies.set(ROLE_COOKIE, result.user.role, { secure: isHttps, sameSite: "lax", expires: 1 });
      if (typeof window !== "undefined") {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, result.accessToken);
        window.localStorage.setItem(ROLE_STORAGE_KEY, result.user.role);
      }

      dispatch(
        loginSuccess({
          token: result.accessToken,
          role: result.user.role,
          user: result.user,
        }),
      );

      onSuccess?.(result.user.role);
    } catch (error) {
      dispatch(loginFailure("Invalid credentials or unavailable API"));
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card mx-auto w-full max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-bold">Sign in to Ostora</h1>
      <p className="text-sm text-[var(--muted)]">Try admin@ostora.com / Admin123! for demo access.</p>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register("email")}
          className="ring-focus w-full rounded-lg border border-[var(--foreground)]/20 bg-white px-3 py-2"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register("password")}
          className="ring-focus w-full rounded-lg border border-[var(--foreground)]/20 bg-white px-3 py-2"
        />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
      </div>

      {authState.error && <p className="rounded-md bg-red-100 p-2 text-sm text-red-700">{authState.error}</p>}

      <button
        type="submit"
        disabled={authState.loading}
        className="ring-focus w-full rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        {authState.loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
