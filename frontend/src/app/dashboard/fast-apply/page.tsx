"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";

interface Bundle {
  id: string;
  name: string;
  documents: Array<{
    id: string;
    filename: string;
    fileSize: number;
    type: string;
  }>;
}

export default function FastApplyPage() {
  const [step, setStep] = useState<1 | 2>(2);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [template, setTemplate] = useState("");
  const [sendFrom, setSendFrom] = useState("zz2406143@gmail.com");
  const [fallbackEmail, setFallbackEmail] = useState("test@test.de");
  const [subject, setSubject] = useState("Application for {position_title} at {company_name}");
  const [message, setMessage] = useState(`Dear {hr_name},

I am writing to apply for the position of {position_title} at {company_name}.

Please find my documents attached.

Best regards`);
  const [attachments, setAttachments] = useState<Record<string, boolean>>({});
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loadingBundles, setLoadingBundles] = useState(false);

  useEffect(() => {
    loadBundles();
  }, []);

  const loadBundles = async () => {
    setLoadingBundles(true);
    try {
      const bundlesRes = await apiClient.get("/api/v1/users/bundles");
      const bundlesData = Array.isArray(bundlesRes.data)
        ? bundlesRes.data
        : Array.isArray(bundlesRes.data?.data)
          ? bundlesRes.data.data
          : [];

      const bundlesWithDocs = await Promise.all(
        bundlesData.map(async (bundle: any) => {
          try {
            const docsRes = await apiClient.get(`/api/v1/users/bundles/${bundle.id}/documents`);
            const docs = Array.isArray(docsRes.data)
              ? docsRes.data
              : Array.isArray(docsRes.data?.data)
                ? docsRes.data.data
                : [];
            return {
              id: bundle.id,
              name: bundle.name,
              documents: docs.map((doc: any) => ({
                id: doc.id,
                filename: doc.filename,
                fileSize: doc.fileSize,
                type: doc.type,
              })),
            };
          } catch {
            return { id: bundle.id, name: bundle.name, documents: [] };
          }
        })
      );

      setBundles(bundlesWithDocs);
    } catch (error) {
      console.error("Failed to load bundles");
    } finally {
      setLoadingBundles(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    return `${Math.round(bytes / 1024)} KB`;
  };

  const handleSend = () => {
    const count = selectedJobs.length;
    if (count === 0) return;
    alert(`Sending ${count} applications...`);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0a5160] to-[#0c7a8a] rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#b8f2ff] font-semibold">Fast Applying</p>
            <h1 className="text-3xl font-bold mt-1">Apply to many jobs with one flow</h1>
            <p className="text-[#d8f8ff] mt-2">Select up to 50 jobs, personalize using tokens, and send with live progress.</p>
            <p className="text-[#ffdddd] text-xs mt-2">Already applied jobs are locked in red and cannot be sent again.</p>
          </div>
          <button type="button" className="rounded-xl bg-white/15 border border-white/25 px-4 py-3 hover:bg-white/20 transition-colors">
            <p className="text-xs uppercase tracking-[0.12em] text-[#d4f7ff]">New</p>
            <p className="font-semibold">AI Ostora Assistant</p>
          </button>
        </div>
      </div>

      {/* Form Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Step {step} of 2</h2>
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-3 py-1.5 rounded-full font-medium transition-colors ${step === 1 ? "bg-black text-white" : "bg-gray-100 text-gray-500"}`}>1. Select Jobs</span>
            <span className={`px-3 py-1.5 rounded-full font-medium transition-colors ${step === 2 ? "bg-black text-white" : "bg-gray-100 text-gray-500"}`}>2. Message &amp; Send</span>
          </div>
        </div>

        <div className="space-y-5">
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center justify-center rounded-full h-10 px-6 border-2 border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={selectedJobs.length === 0}
              className="inline-flex items-center justify-center rounded-full h-10 px-6 bg-black text-white text-sm font-medium disabled:opacity-50 hover:bg-gray-800 transition-colors gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send {selectedJobs.length} Applications
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full h-10 px-6 border-2 border-black text-black text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Manage Templates
            </button>
          </div>

          {/* Template & Send From */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Template</label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              >
                <option value="">Custom Message</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Send From</label>
              <select
                value={sendFrom}
                onChange={(e) => setSendFrom(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              >
                <option value="zz2406143@gmail.com">zz2406143@gmail.com (Default)</option>
              </select>
            </div>
          </div>

          {/* Fallback Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Fallback Recipient Email</label>
            <input
              placeholder="Used when job contact email is not found"
              value={fallbackEmail}
              onChange={(e) => setFallbackEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject Template</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Message Template</label>
            <textarea
              rows={7}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-500 mt-1.5">Available variables: {"{hr_name}"}, {"{company_name}"}, {"{position_title}"}</p>
          </div>

          {/* Attachments */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Attachments from Bewerbungsmappe</p>
            {loadingBundles ? (
              <div className="border border-gray-300 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Loading documents...</p>
              </div>
            ) : bundles.length === 0 ? (
              <div className="border border-gray-300 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500 mb-2">No documents found</p>
                <Link href="/dashboard/documents" className="text-sm text-black font-semibold hover:underline">
                  Go to Documents to upload files
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {bundles.map((bundle) => (
                  <div key={bundle.id} className="border border-gray-300 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-800 mb-3">{bundle.name}</p>
                    {bundle.documents.length === 0 ? (
                      <p className="text-xs text-gray-400">No documents in this folder</p>
                    ) : (
                      <div className="space-y-2.5">
                        {bundle.documents.map((doc) => (
                          <label
                            key={doc.id}
                            className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                          >
                            <input
                              className="w-4 h-4 accent-black"
                              type="checkbox"
                              checked={attachments[doc.id] || false}
                              onChange={(e) => setAttachments((prev) => ({ ...prev, [doc.id]: e.target.checked }))}
                            />
                            <span className="flex-1 truncate font-medium">{doc.filename}</span>
                            <span className="text-xs text-gray-400">{formatFileSize(doc.fileSize)}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Application History */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Application History</h3>
        <p className="text-sm text-gray-500">No sent applications yet.</p>
      </div>
    </div>
  );
}
