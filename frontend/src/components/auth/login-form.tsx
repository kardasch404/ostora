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
  email: z.string().email("Please provide a valid email address"),
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
    <div className="card max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="text-display-md mb-2">Welcome back</h1>
        <p className="text-body text-gray-500">Sign in to your Ostora account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-body-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className={`input ${errors.email ? "input-error" : ""}`}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-2 text-body-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-body-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className={`input ${errors.password ? "input-error" : ""}`}
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-2 text-body-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {authState.error && (
          <div className="p-4 rounded-button bg-red-50 border border-red-200">
            <p className="text-body-sm text-red-700">{authState.error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={authState.loading}
          className="btn-primary w-full"
        >
          {authState.loading ? "Signing in..." : "Sign In"}
        </button>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-body-sm text-gray-500 text-center">
            Demo: <span className="font-medium text-black">admin@ostora.com</span> / <span className="font-medium text-black">Admin123!</span>
          </p>
        </div>
      </form>
    </div>
  );
}
