"use client";

import { z } from "zod";
import Cookies from "js-cookie";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerRequest } from "@/services/auth.service";
import { ROLE_COOKIE, ROLE_STORAGE_KEY, TOKEN_COOKIE, TOKEN_STORAGE_KEY } from "@/lib/constants";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginFailure, loginStart, loginSuccess } from "@/store/slices/auth-slice";

const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.email("Please provide a valid email address"),
    password: z
      .string()
      .min(8, "Password must contain at least 8 characters")
      .regex(/[A-Z]/, "Password must include one uppercase letter")
      .regex(/[a-z]/, "Password must include one lowercase letter")
      .regex(/[0-9]/, "Password must include one number")
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password must include one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: (email: string, role: "USER" | "ADMIN" | "RECRUITER") => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
  });

  const onSubmit = async (values: RegisterFormValues) => {
    dispatch(loginStart());

    try {
      const result = await registerRequest({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
      });

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

      onSuccess?.(result.user.email, result.user.role);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Registration failed. Please verify your details and try again.";
      dispatch(loginFailure(message));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card mx-auto w-full max-w-lg space-y-4 p-6">
      <h1 className="text-2xl font-bold">Create your Ostora account</h1>
      <p className="text-sm text-[var(--muted)]">Register and access your personalized dashboard.</p>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-1 block text-sm font-medium">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            {...register("firstName")}
            className="ring-focus w-full rounded-lg border border-[var(--foreground)]/20 bg-white px-3 py-2"
          />
          {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
        </div>

        <div>
          <label htmlFor="lastName" className="mb-1 block text-sm font-medium">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            {...register("lastName")}
            className="ring-focus w-full rounded-lg border border-[var(--foreground)]/20 bg-white px-3 py-2"
          />
          {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
        </div>
      </div>

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

      <div>
        <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          {...register("confirmPassword")}
          className="ring-focus w-full rounded-lg border border-[var(--foreground)]/20 bg-white px-3 py-2"
        />
        {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
      </div>

      {authState.error && <p className="rounded-md bg-red-100 p-2 text-sm text-red-700">{authState.error}</p>}

      <button
        type="submit"
        disabled={authState.loading}
        className="ring-focus w-full rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        {authState.loading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
