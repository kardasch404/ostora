import axios from "axios";
import { AUTH_API_BASE_URL } from "@/lib/constants";
import { LoginResponse, RegisterPayload, UserRole } from "@/types/auth";

function encodeBase64(input: string): string {
  if (typeof btoa === "function") {
    return btoa(input);
  }
  return Buffer.from(input, "utf-8").toString("base64");
}

function createDemoToken(email: string, role: UserRole): string {
  const header = encodeBase64(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = encodeBase64(
    JSON.stringify({ sub: email, role, exp: Math.floor(Date.now() / 1000) + 60 * 60 }),
  );
  return `${header}.${payload}.signature`;
}

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  if (email === "admin@ostora.com" && password === "Admin123!") {
    return {
      accessToken: createDemoToken(email, "ADMIN"),
      refreshToken: "demo-refresh-token",
      expiresIn: 900,
      tokenType: "Bearer",
      user: { id: "admin-1", email, name: "Ostora Admin", role: "ADMIN" },
    };
  }

  if (email === "user@ostora.com" && password === "User12345!") {
    return {
      accessToken: createDemoToken(email, "USER"),
      refreshToken: "demo-refresh-token",
      expiresIn: 900,
      tokenType: "Bearer",
      user: { id: "user-1", email, name: "Ostora User", role: "USER" },
    };
  }

  const response = await axios.post(`${AUTH_API_BASE_URL}/login`, { email, password }, { withCredentials: true });
  return normalizeAuthResponse(response.data?.data || response.data);
}

export async function registerRequest(payload: RegisterPayload): Promise<LoginResponse> {
  try {
    const response = await axios.post(`${AUTH_API_BASE_URL}/register`, payload, { withCredentials: true });
    return normalizeAuthResponse(response.data?.data || response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || "Registration failed. Please verify your details and try again.";
      throw new Error(Array.isArray(message) ? message.join(" ") : message);
    }
    throw error;
  }
}

export async function sendOtpRequest(email: string): Promise<{ message: string }> {
  try {
    const response = await axios.post(`${AUTH_API_BASE_URL}/otp/send`, { email }, { withCredentials: true });
    return response.data?.data || response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || "Failed to send verification code.";
      throw new Error(Array.isArray(message) ? message.join(" ") : message);
    }
    throw error;
  }
}

export async function verifyEmailOtpRequest(email: string, code: string): Promise<{ message: string }> {
  try {
    const response = await axios.post(
      `${AUTH_API_BASE_URL}/otp/verify-email`,
      { email, code },
      { withCredentials: true },
    );
    return response.data?.data || response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || "Invalid or expired verification code.";
      throw new Error(Array.isArray(message) ? message.join(" ") : message);
    }
    throw error;
  }
}

function normalizeAuthResponse(raw: any): LoginResponse {
  const firstName = raw?.user?.firstName || "";
  const lastName = raw?.user?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || raw?.user?.name || "Ostora User";

  return {
    accessToken: raw?.accessToken,
    refreshToken: raw?.refreshToken || "",
    expiresIn: raw?.expiresIn || 900,
    tokenType: raw?.tokenType || "Bearer",
    user: {
      id: raw?.user?.id,
      email: raw?.user?.email,
      name: fullName,
      role: raw?.user?.role || "USER",
    },
  };
}
