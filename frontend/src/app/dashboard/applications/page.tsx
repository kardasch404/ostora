"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  contactEmail: string;
  contactPhone: string;
  subject: string;
  message: string;
  attachments: string[];
  sentAt: string;
  status: "sent" | "pending" | "viewed" | "rejected";
}

function extractContact(content: string): { email: string; phone: string } {
  const emailMatch = content.match(/href="mailto:([^"]+)"/);
  const phoneMatch = content.match(/\+[\d\s\-()]{7,20}/);
  return {
    email: emailMatch?.[1] ?? "",
    phone: phoneMatch?.[0]?.trim() ?? "",
  };
}

const statusBadge: Record<Application["status"], string> = {
  sent: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-700",
  viewed: "bg-purple-100 text-purple-700",
  rejected: "bg-red-100 text-red-700",
};

function ApplicationsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const allDocuments = useAppSelector((s) =>
    s.bewerbung.mappen.flatMap((m) => m.documents)
  );

  const jobTitle = searchParams.get("jobTitle") ?? "";
  const company = searchParams.get("company") ?? "";
  const content = searchParams.get("content") ?? "";
  const stelleUrl = searchParams.get("stelleUrl") ?? "";

  const { email: extractedEmail, phone: extractedPhone } = extractContact(decodeURIComponent(content));

  const [applications, setApplications] = useState<Application[]>([]);
  const [showForm, setShowForm] = useState(!!jobTitle);
  const [form, setForm] = useState({
    jobTitle,
    company,
    contactEmail: extractedEmail,
    contactPhone: extractedPhone,
    subject: jobTitle ? `Application for ${jobTitle} at ${company}` : "",
    message: jobTitle
      ? `Dear Hiring Team,\n\nI am writing to apply for the position of ${jobTitle} at ${company}.\n\nPlease find my documents attached.\n\nBest regards`
      : "",
    attachments: [] as string[],
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Update form when URL params change
  useEffect(() => {
    if (jobTitle) {
      const { email, phone } = extractContact(decodeURIComponent(content));
      setForm({
        jobTitle,
        company,
        contactEmail: email,
        contactPhone: phone,
        subject: `Application for ${jobTitle} at ${company}`,
        message: `Dear Hiring Team,\n\nI am writing to apply for the position of ${jobTitle} at ${company}.\n\nPlease find my documents attached.\n\nBest regards`,
        attachments: [],
      });
      setShowForm(true);
      setSent(false);
    }
  }, [jobTitle, company, content]);

  const toggleAttachment = (docId: string) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.includes(docId)
        ? prev.attachments.filter((id) => id !== docId)
        : [...prev.attachments, docId],
    }));
  };

  const handleSend = async () => {
    if (!form.contactEmail && !form.subject) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    const newApp: Application = {
      id: Date.now().toString(),
      jobTitle: form.jobTitle,
      company: form.company,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      subject: form.subject,
      message: form.message,
      attachments: form.attachments,
      sentAt: new Date().toLocaleDateString(),
      status: "sent",
    };
    setApplications((prev) => [newApp, ...prev]);
    setSending(false);
    setSent(true);
    setShowForm(false);
    router.replace("/dashboard/applications");
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-1">Applications</h1>
        <p className="text-purple-100">Track and send your job applications</p>
      </div>

      {/* Application Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">New Application</h2>
              {form.jobTitle && (
                <p className="text-sm text-purple-600 font-medium mt-0.5">
                  {form.jobTitle} · {form.company}
                </p>
              )}
            </div>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Contact info extracted from job */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Contact Email</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  placeholder="recruiter@company.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  placeholder="+49 123 456 789"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Message</label>
              <textarea
                rows={6}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Attachments from Documents */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                Attachments — from your Documents
              </label>
              <div className="space-y-2">
                {allDocuments.map((doc) => (
                  <label key={doc.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:border-purple-200 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={form.attachments.includes(doc.id)}
                      onChange={() => toggleAttachment(doc.id)}
                      className="w-4 h-4 accent-purple-600"
                    />
                    <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-700 flex-1">{doc.name}</span>
                    <span className="text-xs text-gray-400">{doc.size}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              {stelleUrl && (
                <a
                  href={stelleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
                >
                  View Job Post
                </a>
              )}
              <button
                onClick={handleSend}
                disabled={sending || !form.subject}
                className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? "Sending..." : "Send Application"}
              </button>
            </div>
          </div>
        </div>
      )}

      {sent && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm font-medium flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Application sent successfully!
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => { setShowForm(true); setSent(false); }}
          className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-semibold text-sm"
        >
          + New Application
        </button>
      )}

      {/* Applications list */}
      {applications.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Sent Applications</h2>
          <div className="space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                <div>
                  <p className="text-sm font-bold text-gray-900">{app.jobTitle}</p>
                  <p className="text-xs text-purple-600 font-medium">{app.company}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{app.contactEmail} · {app.sentAt}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge[app.status]}`}>
                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {applications.length === 0 && !showForm && (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-14 h-14 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-semibold">No applications yet</p>
          <p className="text-sm mt-1">Click Apply on any job to get started</p>
        </div>
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense>
      <ApplicationsContent />
    </Suspense>
  );
}
