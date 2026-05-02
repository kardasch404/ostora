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
    email: z.string().email("Please provide a valid email address"),
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <button
        type="button"
        className="w-full py-3.5 px-4 border-2 border-gray-300 rounded-lg font-medium text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
      >
        <svg className="w-5 h-5" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
          <path d="M533.5 278.4c0-18.5-1.5-37.1-4.7-55.3H272.1v104.8h147c-6.1 33.8-25.7 63.7-54.4 82.7v68h87.7c51.5-47.4 81.1-117.4 81.1-200.2z" fill="#4285f4" />
          <path d="M272.1 544.3c73.4 0 135.3-24.1 180.4-65.7l-87.7-68c-24.4 16.6-55.9 26-92.6 26-71 0-131.2-47.9-152.8-112.3H28.9v70.1c46.2 91.9 140.3 149.9 243.2 149.9z" fill="#34a853" />
          <path d="M119.3 324.3c-11.4-33.8-11.4-70.4 0-104.2V150H28.9c-38.6 76.9-38.6 167.5 0 244.4l90.4-70.1z" fill="#fbbc04" />
          <path d="M272.1 107.7c38.8-.6 76.3 14 104.4 40.8l77.7-77.7C405 24.6 339.7-.8 272.1 0 169.2 0 75.1 58 28.9 150l90.4 70.1c21.5-64.5 81.8-112.4 152.8-112.4z" fill="#ea4335" />
        </svg>
        Continue with Google
      </button>

      <button
        type="button"
        className="w-full py-3.5 px-4 border-2 border-gray-300 rounded-lg font-medium text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
      >
        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12.223 4.385c.832 0 1.875-.58 2.496-1.353.562-.7.972-1.68.972-2.658 0-.132-.011-.265-.035-.374-.926.036-2.039.64-2.707 1.45-.527.615-1.008 1.582-1.008 2.572 0 .145.024.29.036.338.058.013.152.025.246.025M9.293 19c1.137 0 1.64-.785 3.059-.785 1.441 0 1.757.76 3.023.76 1.242 0 2.074-1.183 2.86-2.343.878-1.328 1.242-2.633 1.265-2.693-.082-.024-2.46-1.027-2.46-3.841 0-2.44 1.874-3.54 1.98-3.624-1.243-1.836-3.13-1.884-3.645-1.884-1.395 0-2.531.87-3.246.87-.774 0-1.793-.822-3-.822-2.297 0-4.629 1.957-4.629 5.653 0 2.295.867 4.723 1.934 6.293C7.348 17.913 8.144 19 9.293 19" />
        </svg>
        Continue with Apple
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-gray-500">or</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-900 mb-2">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            autoComplete="given-name"
            {...register("firstName")}
            className={`w-full px-4 py-3.5 text-base border rounded-lg focus:outline-none focus:ring-2 transition-all ${
              errors.firstName
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-gray-900 focus:border-gray-900"
            }`}
            placeholder=""
          />
          {errors.firstName && (
            <p className="mt-2 text-sm text-red-600">{errors.firstName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-900 mb-2">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            autoComplete="family-name"
            {...register("lastName")}
            className={`w-full px-4 py-3.5 text-base border rounded-lg focus:outline-none focus:ring-2 transition-all ${
              errors.lastName
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-gray-900 focus:border-gray-900"
            }`}
            placeholder=""
          />
          {errors.lastName && (
            <p className="mt-2 text-sm text-red-600">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          className={`w-full px-4 py-3.5 text-base border rounded-lg focus:outline-none focus:ring-2 transition-all ${
            errors.email
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:ring-gray-900 focus:border-gray-900"
          }`}
          placeholder=""
        />
        {errors.email && (
          <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
          className={`w-full px-4 py-3.5 text-base border rounded-lg focus:outline-none focus:ring-2 transition-all ${
            errors.password
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:ring-gray-900 focus:border-gray-900"
          }`}
          placeholder=""
        />
        {errors.password && (
          <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 mb-2">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
          className={`w-full px-4 py-3.5 text-base border rounded-lg focus:outline-none focus:ring-2 transition-all ${
            errors.confirmPassword
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:ring-gray-900 focus:border-gray-900"
          }`}
          placeholder=""
        />
        {errors.confirmPassword && (
          <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      {authState.error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{authState.error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={authState.loading}
        className="w-full py-3.5 px-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {authState.loading ? "Creating account..." : "Continue"}
      </button>

      <p className="text-xs text-gray-600 text-center leading-relaxed">
        I accept the <a href="#" className="underline hover:text-gray-900">Terms of Service</a> and have read the <a href="#" className="underline hover:text-gray-900">Privacy Policy</a>.
      </p>
    </form>
  );
}