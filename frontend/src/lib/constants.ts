export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4717";
export const AUTH_API_BASE_URL =
	process.env.NEXT_PUBLIC_AUTH_API_BASE_URL || "http://localhost:4718/api/v1/auth";
export const AI_API_BASE_URL =
	process.env.NEXT_PUBLIC_AI_API_BASE_URL || "http://localhost:4723/api";
export const PAYMENT_API_BASE_URL =
	process.env.NEXT_PUBLIC_PAYMENT_API_BASE_URL || "http://localhost:4724";
export const TOKEN_COOKIE = "ostora_token";
export const ROLE_COOKIE = "ostora_role";
export const TOKEN_STORAGE_KEY = "ostora_token";
export const ROLE_STORAGE_KEY = "ostora_role";
