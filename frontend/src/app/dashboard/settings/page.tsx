"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import axios from "axios";

type EmailEncryption = "SSL" | "TLS" | "STARTTLS" | "NONE";

interface EmailAccount {
  id: string;
  email: string;
  provider?: string;
  smtpHost?: string;
  smtpPort?: number;
  encryption?: EmailEncryption;
  isActive: boolean;
  createdAt: string;
}

interface EmailProviderOption {
  name: string;
  value: string;
}

interface NewEmailFormState {
  provider: string;
  email: string;
  appPassword: string;
  fromName: string;
  smtpHost: string;
  smtpPort: string;
  encryption: EmailEncryption;
}

const FALLBACK_PROVIDERS: EmailProviderOption[] = [
  { name: "Gmail", value: "gmail" },
  { name: "Outlook", value: "outlook" },
  { name: "Custom SMTP", value: "custom" },
];

const PROVIDER_HELP_LINKS: Record<string, string> = {
  gmail: "https://myaccount.google.com/apppasswords",
  outlook: "https://account.microsoft.com/security",
};

const PROVIDER_INSTRUCTIONS: Record<string, string> = {
  gmail: "Enable 2FA, then generate an App Password at Google Account settings.",
  outlook: "Enable 2FA at Microsoft Account Security, then create an App Password (16-character format: xxxx-xxxx-xxxx-xxxx).",
  custom: "Enter your SMTP server credentials. Contact your email provider for SMTP settings.",
};

const OUTLOOK_DOMAINS = new Set(["outlook.com", "outlook.de", "hotmail.com", "hotmail.de", "live.com", "live.de", "msn.com"]);
const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

const createInitialFormState = (provider: string): NewEmailFormState => ({
  provider,
  email: "",
  appPassword: "",
  fromName: "",
  smtpHost: "",
  smtpPort: "587",
  encryption: "STARTTLS",
});

export default function SettingsPage() {
  const [emails, setEmails] = useState<EmailAccount[]>([]);
  const [providers, setProviders] = useState<EmailProviderOption[]>(FALLBACK_PROVIDERS);
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [newEmail, setNewEmail] = useState<NewEmailFormState>(createInitialFormState("gmail"));
  const [loading, setLoading] = useState(false);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providerConfigLoading, setProviderConfigLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>("");
  const [providerError, setProviderError] = useState<string>("");

  const getErrorMessage = useCallback((error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message;
      return Array.isArray(message) ? message.join(", ") : message || fallback;
    }
    return fallback;
  }, []);

  const inferProviderFromAccount = useCallback((email: EmailAccount): string => {
    if (email.provider && email.provider.trim().length > 0) {
      return email.provider.toLowerCase();
    }

    const smtpHost = email.smtpHost?.toLowerCase() || "";
    if (smtpHost.includes("gmail")) {
      return "gmail";
    }
    if (smtpHost.includes("outlook") || smtpHost.includes("office365")) {
      return "outlook";
    }

    const domain = email.email.split("@")[1]?.toLowerCase() || "";
    if (GMAIL_DOMAINS.has(domain)) {
      return "gmail";
    }
    if (OUTLOOK_DOMAINS.has(domain)) {
      return "outlook";
    }

    return "custom";
  }, []);

  const getProviderLabel = useCallback(
    (providerValue: string): string => {
      const match = providers.find((provider) => provider.value.toLowerCase() === providerValue.toLowerCase());
      if (match) {
        return match.name;
      }
      if (providerValue === "custom") {
        return "Custom SMTP";
      }
      return providerValue.charAt(0).toUpperCase() + providerValue.slice(1);
    },
    [providers],
  );

  const loadEmails = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/v1/users/emails");
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      setEmails(data);
      setLoadError("");
    } catch (error: unknown) {
      const normalizedMessage = getErrorMessage(error, "Failed to load email accounts");
      setEmails([]);
      setLoadError(normalizedMessage);
      console.error("Failed to load emails", error);
    }
  }, [getErrorMessage]);

  const loadProviders = useCallback(async () => {
    setProvidersLoading(true);
    try {
      const res = await apiClient.get("/api/v1/users/emails/providers");
      const raw = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      const normalized = raw
        .filter((item: unknown): item is EmailProviderOption => {
          if (!item || typeof item !== "object") {
            return false;
          }
          const candidate = item as Record<string, unknown>;
          return typeof candidate.name === "string" && typeof candidate.value === "string";
        })
        .map((item: EmailProviderOption) => ({
          name: item.name,
          value: item.value.toLowerCase(),
        }));

      const merged = normalized.some((provider: EmailProviderOption) => provider.value === "custom")
        ? normalized
        : [...normalized, { name: "Custom SMTP", value: "custom" }];

      setProviders(merged.length > 0 ? merged : FALLBACK_PROVIDERS);
      setProviderError("");
    } catch (error: unknown) {
      setProviders(FALLBACK_PROVIDERS);
      setProviderError(getErrorMessage(error, "Could not load provider list. Using fallback providers."));
    } finally {
      setProvidersLoading(false);
    }
  }, [getErrorMessage]);

  useEffect(() => {
    loadEmails();
    loadProviders();
  }, [loadEmails, loadProviders]);

  const applyProviderDefaults = useCallback(async (provider: string) => {
    if (!provider || provider === "custom") {
      return;
    }

    setProviderConfigLoading(true);
    try {
      const res = await apiClient.get(`/api/v1/users/emails/providers/${encodeURIComponent(provider)}`);
      const data = res.data || {};

      setNewEmail((prev) => ({
        ...prev,
        provider,
        smtpHost: typeof data.host === "string" ? data.host : prev.smtpHost,
        smtpPort:
          typeof data.port === "number"
            ? String(data.port)
            : typeof data.port === "string"
              ? data.port
              : prev.smtpPort,
        encryption:
          data.encryption === "SSL" ||
          data.encryption === "TLS" ||
          data.encryption === "STARTTLS" ||
          data.encryption === "NONE"
            ? data.encryption
            : prev.encryption,
      }));
    } catch {
      // Keep values as-is; backend can still resolve by provider or domain.
    } finally {
      setProviderConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showAddEmail || newEmail.provider === "custom") {
      return;
    }
    applyProviderDefaults(newEmail.provider);
  }, [showAddEmail, newEmail.provider, applyProviderDefaults]);

  const resetForm = useCallback(() => {
    const preferredProvider = providers.some((provider) => provider.value === "gmail")
      ? "gmail"
      : providers[0]?.value || "custom";
    setNewEmail(createInitialFormState(preferredProvider));
  }, [providers]);

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    const smtpHost = newEmail.smtpHost.trim();
    const smtpPortValue = Number(newEmail.smtpPort);
    const isCustomProvider = newEmail.provider === "custom";

    if (isCustomProvider && (!smtpHost || !newEmail.smtpPort || Number.isNaN(smtpPortValue) || smtpPortValue < 1)) {
      alert("Custom SMTP requires a valid host and port.");
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        email: newEmail.email.trim(),
        appPassword: newEmail.appPassword,
        provider: newEmail.provider,
      };

      if (newEmail.fromName.trim()) {
        payload.fromName = newEmail.fromName.trim();
      }

      const shouldSendSmtpValues = isCustomProvider || Boolean(smtpHost && newEmail.smtpPort);
      if (shouldSendSmtpValues && !Number.isNaN(smtpPortValue) && smtpPortValue > 0) {
        payload.smtpHost = smtpHost;
        payload.smtpPort = smtpPortValue;
        payload.encryption = newEmail.encryption;
      }

      await apiClient.post("/api/v1/users/emails", payload);
      resetForm();
      setShowAddEmail(false);
      loadEmails();
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Failed to add email"));
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await apiClient.patch(`/api/v1/users/emails/${id}/default`);
      loadEmails();
    } catch {
      alert("Failed to set default email");
    }
  };

  const handleUpdatePassword = async (id: string) => {
    const appPassword = prompt("Enter new password/app password for this email:");
    if (!appPassword) {
      return;
    }

    try {
      await apiClient.patch(`/api/v1/users/emails/${id}`, { appPassword });
      loadEmails();
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Failed to update password"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this email account?")) {
      return;
    }
    try {
      await apiClient.delete(`/api/v1/users/emails/${id}`);
      loadEmails();
    } catch {
      alert("Failed to delete email");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account settings and email accounts</p>
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/settings/payments"
              className="inline-flex items-center rounded-lg border border-black px-4 py-2 text-sm font-semibold text-black hover:bg-gray-100"
            >
              Payments
            </Link>
            <Link
              href="/dashboard/settings/payments-faq"
              className="inline-flex items-center rounded-lg border border-black px-4 py-2 text-sm font-semibold text-black hover:bg-gray-100"
            >
              Payments FAQ
            </Link>
            <Link
              href="/dashboard/settings/password"
              className="inline-flex items-center rounded-lg border border-black px-4 py-2 text-sm font-semibold text-black hover:bg-gray-100"
            >
              Password
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Email Accounts</h2>
            <p className="text-sm text-gray-600 mt-1">Manage sender accounts (Gmail, Outlook, and custom SMTP) for applications</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddEmail(true);
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
          >
            + Add Email
          </button>
        </div>

        <div className="space-y-3">
          {providerError && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {providerError}
            </div>
          )}
          {loadError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {loadError}
            </div>
          )}

          {emails.map((email) => {
            const providerValue = inferProviderFromAccount(email);

            return (
              <div key={email.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-200 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-gray-900">{email.email}</p>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                        {getProviderLabel(providerValue)}
                      </span>
                      {email.isActive && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">Default</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Added {new Date(email.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!email.isActive && (
                    <button
                      onClick={() => handleSetDefault(email.id)}
                      className="px-3 py-1.5 text-sm border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleUpdatePassword(email.id)}
                    className="px-3 py-1.5 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Update Password
                  </button>
                  <button
                    onClick={() => handleDelete(email.id)}
                    className="px-3 py-1.5 text-sm border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}

          {emails.length === 0 && !loadError && (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p>No email accounts added yet</p>
            </div>
          )}
        </div>
      </div>

      {showAddEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Add {newEmail.provider === "gmail" ? "Gmail" : newEmail.provider === "outlook" ? "Outlook" : "Email"} Account
            </h3>

            <form onSubmit={handleAddEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Provider</label>
                <select
                  value={newEmail.provider}
                  onChange={(e) => {
                    const provider = e.target.value.toLowerCase();
                    setNewEmail((prev) => ({
                      ...prev,
                      provider,
                      ...(provider === "custom" ? { smtpHost: "", smtpPort: "587", encryption: "STARTTLS" as EmailEncryption } : {}),
                    }));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  disabled={providersLoading}
                >
                  {providers.map((provider) => (
                    <option key={provider.value} value={provider.value}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={newEmail.email}
                  onChange={(e) => setNewEmail({ ...newEmail, email: e.target.value })}
                  placeholder={newEmail.provider === "outlook" ? "your.name@outlook.com" : "your.name@example.com"}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">From Name (optional)</label>
                <input
                  type="text"
                  value={newEmail.fromName}
                  onChange={(e) => setNewEmail({ ...newEmail, fromName: e.target.value })}
                  placeholder="Your Name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {newEmail.provider === "outlook" ? "App Password (Required)" : "App Password"}
                </label>
                <input
                  type="password"
                  value={newEmail.appPassword}
                  onChange={(e) => setNewEmail({ ...newEmail, appPassword: e.target.value })}
                  placeholder={newEmail.provider === "outlook" ? "xxxx-xxxx-xxxx-xxxx" : "Enter app password"}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  required
                />
                {PROVIDER_INSTRUCTIONS[newEmail.provider] && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                    <p className="font-semibold mb-1">📌 Setup Instructions:</p>
                    <p>{PROVIDER_INSTRUCTIONS[newEmail.provider]}</p>
                    {PROVIDER_HELP_LINKS[newEmail.provider] && (
                      <a
                        href={PROVIDER_HELP_LINKS[newEmail.provider]}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-600 hover:underline font-semibold mt-1 inline-block"
                      >
                        → Get App Password
                      </a>
                    )}
                  </div>
                )}
              </div>

              {newEmail.provider === "custom" ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Host</label>
                    <input
                      type="text"
                      value={newEmail.smtpHost}
                      onChange={(e) => setNewEmail({ ...newEmail, smtpHost: e.target.value })}
                      placeholder="smtp.example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Port</label>
                    <input
                      type="number"
                      min={1}
                      max={65535}
                      value={newEmail.smtpPort}
                      onChange={(e) => setNewEmail({ ...newEmail, smtpPort: e.target.value })}
                      placeholder="587"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Encryption</label>
                    <select
                      value={newEmail.encryption}
                      onChange={(e) => setNewEmail({ ...newEmail, encryption: e.target.value as EmailEncryption })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    >
                      <option value="STARTTLS">STARTTLS</option>
                      <option value="TLS">TLS</option>
                      <option value="SSL">SSL</option>
                      <option value="NONE">None</option>
                    </select>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                  {providerConfigLoading ? (
                    <p>Loading provider SMTP defaults...</p>
                  ) : (
                    <>
                      <p>SMTP Host: {newEmail.smtpHost || "Auto-detected"}</p>
                      <p>SMTP Port: {newEmail.smtpPort || "Auto-detected"}</p>
                      <p>Encryption: {newEmail.encryption}</p>
                    </>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50"
                >
                  {loading ? "Adding..." : "Add Email"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddEmail(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
