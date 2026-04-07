"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import axios from "axios";

interface EmailAccount {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const [emails, setEmails] = useState<EmailAccount[]>([]);
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [newEmail, setNewEmail] = useState({ email: "", appPassword: "" });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>("");

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message;
      return Array.isArray(message) ? message.join(", ") : message || fallback;
    }
    return fallback;
  };

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
  }, []);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post("/api/v1/users/emails", newEmail);
      setNewEmail({ email: "", appPassword: "" });
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
    const appPassword = prompt("Enter new app password for this email:");
    if (!appPassword) return;

    try {
      await apiClient.patch(`/api/v1/users/emails/${id}`, { appPassword });
      loadEmails();
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Failed to update password"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this email account?")) return;
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
            <p className="text-sm text-gray-600 mt-1">Manage Gmail accounts for sending applications</p>
          </div>
          <button
            onClick={() => setShowAddEmail(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
          >
            + Add Email
          </button>
        </div>

        <div className="space-y-3">
          {loadError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {loadError}
            </div>
          )}
          {emails.map((email) => (
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
          ))}
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
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add Gmail Account</h3>
            <form onSubmit={handleAddEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Gmail Address</label>
                <input
                  type="email"
                  value={newEmail.email}
                  onChange={(e) => setNewEmail({ ...newEmail, email: e.target.value })}
                  placeholder="your.email@gmail.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">App Password</label>
                <input
                  type="password"
                  value={newEmail.appPassword}
                  onChange={(e) => setNewEmail({ ...newEmail, appPassword: e.target.value })}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  <a href="https://myaccount.google.com/apppasswords" target="_blank" className="text-purple-600 hover:underline">
                    Generate App Password →
                  </a>
                </p>
              </div>
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
                  onClick={() => setShowAddEmail(false)}
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
