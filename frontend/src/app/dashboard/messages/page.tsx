"use client";

import { useEffect, useMemo, useState } from "react";

const MESSAGE_TEMPLATES_STORAGE_KEY = "ostora:messageTemplates:v1";

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  updatedAt: string;
}

const defaultTemplate: MessageTemplate = {
  id: "",
  name: "",
  subject: "Application for {position_title} at {company_name}",
  body: "Dear {hr_name},\n\nI am writing to apply for the position of {position_title} at {company_name}.\n\nPlease find my documents attached.\n\nBest regards",
  updatedAt: "",
};

export default function MessagesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(MESSAGE_TEMPLATES_STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MessageTemplate>(defaultTemplate);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MESSAGE_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  }, [templates]);

  const preview = useMemo(() => {
    const sample = {
      hr_name: "Hiring Team",
      company_name: "Nigel Frank",
      position_title: "AI Product Manager",
    };

    return {
      subject: form.subject.replace(/\{\s*([a-zA-Z0-9_]+)\s*\}/g, (_, key: string) => sample[key as keyof typeof sample] || ""),
      body: form.body.replace(/\{\s*([a-zA-Z0-9_]+)\s*\}/g, (_, key: string) => sample[key as keyof typeof sample] || ""),
    };
  }, [form.body, form.subject]);

  const saveTemplate = () => {
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      return;
    }

    if (editingId) {
      setTemplates((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? { ...form, id: editingId, updatedAt: new Date().toISOString() }
            : item,
        ),
      );
    } else {
      setTemplates((prev) => [
        {
          ...form,
          id: `${Date.now()}`,
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }

    setForm(defaultTemplate);
    setEditingId(null);
  };

  const editTemplate = (item: MessageTemplate) => {
    setEditingId(item.id);
    setForm(item);
  };

  const removeTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((item) => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setForm(defaultTemplate);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-[radial-gradient(circle_at_12%_18%,#333_0%,#161616_48%,#090909_100%)] p-8 text-white shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <div className="pointer-events-none absolute -top-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-0 h-56 w-56 rounded-full bg-zinc-500/20 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-400 font-semibold">Message Studio</p>
            <h1 className="text-3xl font-black tracking-tight mb-2">High-Impact Templates</h1>
            <p className="text-zinc-300">Build reusable outreach templates with variables and preview them instantly.</p>
          </div>
          <div className="relative w-min">
            <div className="absolute inset-0 rounded-full bg-white/20 blur-xl" />
            <div className="relative bg-black text-white w-min p-4 rounded-full border border-zinc-700 shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
              <svg className="block w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75v16.5m-9-16.5v16.5M4.5 7.5h15m-15 9h15" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
        <section className="rounded-2xl border border-zinc-800 bg-[linear-gradient(170deg,#141414_0%,#0d0d0d_100%)] shadow-[0_16px_44px_rgba(0,0,0,0.35)] p-6 space-y-4 text-zinc-100">
          <h2 className="text-lg font-black tracking-tight text-zinc-100">Template Editor</h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 mb-1">Template Name</label>
            <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2.5 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-xl placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white" placeholder="General Outreach" />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 mb-1">Subject</label>
            <input value={form.subject} onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))} className="w-full px-3 py-2.5 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-white" />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 mb-1">Body</label>
            <textarea value={form.body} onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))} rows={10} className="w-full px-3 py-2.5 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-white" />
          </div>

          <p className="text-xs text-zinc-500">Variables: {"{hr_name}"}, {"{company_name}"}, {"{position_title}"}</p>

          <div className="flex gap-2">
            <button type="button" onClick={saveTemplate} className="px-4 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-colors">
              {editingId ? "Update Template" : "Save Template"}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(defaultTemplate); }} className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 font-semibold text-sm hover:bg-zinc-800 transition-colors">
                Cancel
              </button>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-[linear-gradient(180deg,#121212_0%,#0a0a0a_100%)] shadow-[0_16px_44px_rgba(0,0,0,0.35)] p-6">
          <h3 className="text-lg font-black tracking-tight text-zinc-100 mb-3">Live Preview</h3>
          <div className="rounded-xl border border-zinc-700 p-4 bg-zinc-900">
            <p className="text-xs uppercase tracking-[0.12em] font-semibold text-zinc-500">Subject</p>
            <p className="text-sm font-semibold text-zinc-100 mt-1">{preview.subject}</p>
            <p className="text-xs uppercase tracking-[0.12em] font-semibold text-zinc-500 mt-4">Body</p>
            <p className="text-sm text-zinc-300 mt-1 whitespace-pre-wrap">{preview.body}</p>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-[linear-gradient(180deg,#131313_0%,#090909_100%)] shadow-[0_16px_40px_rgba(0,0,0,0.34)] p-6">
        <h3 className="text-lg font-black tracking-tight text-zinc-100 mb-4">Saved Templates ({templates.length})</h3>
        <div className="space-y-2">
          {templates.length === 0 && <p className="text-sm text-zinc-500">No templates yet.</p>}
          {templates.map((item) => (
            <div key={item.id} className="border border-zinc-700 bg-zinc-900 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-zinc-100 truncate">{item.name}</p>
                <p className="text-xs text-zinc-500 truncate">{item.subject}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => editTemplate(item)} className="px-3 py-1.5 text-xs rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition-colors">Edit</button>
                <button type="button" onClick={() => removeTemplate(item.id)} className="px-3 py-1.5 text-xs rounded-lg border border-red-800 bg-red-950/40 text-red-300 font-semibold hover:bg-red-900/40 transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
