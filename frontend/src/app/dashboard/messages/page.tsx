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
      <div className="bg-gradient-to-r from-[#0f6673] to-[#2a8ca0] rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-[#d6f7ff]">Create one template or many templates with variables for fast personalized applications.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Template Editor</h2>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Template Name</label>
            <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="General Outreach" />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Subject</label>
            <input value={form.subject} onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Body</label>
            <textarea value={form.body} onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))} rows={10} className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none" />
          </div>

          <p className="text-xs text-gray-500">Variables: {"{hr_name}"}, {"{company_name}"}, {"{position_title}"}</p>

          <div className="flex gap-2">
            <button type="button" onClick={saveTemplate} className="px-4 py-2 rounded-lg bg-[#0f6673] text-white font-semibold text-sm">
              {editingId ? "Update Template" : "Save Template"}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(defaultTemplate); }} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold text-sm">
                Cancel
              </button>
            )}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Live Preview</h3>
          <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
            <p className="text-xs uppercase font-semibold text-gray-500">Subject</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{preview.subject}</p>
            <p className="text-xs uppercase font-semibold text-gray-500 mt-4">Body</p>
            <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{preview.body}</p>
          </div>
        </section>
      </div>

      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Saved Templates ({templates.length})</h3>
        <div className="space-y-2">
          {templates.length === 0 && <p className="text-sm text-gray-500">No templates yet.</p>}
          {templates.map((item) => (
            <div key={item.id} className="border border-gray-100 rounded-lg p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-500 truncate">{item.subject}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => editTemplate(item)} className="px-3 py-1.5 text-xs rounded-lg bg-[#e9f7fa] text-[#0f6673] font-semibold">Edit</button>
                <button type="button" onClick={() => removeTemplate(item.id)} className="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-700 font-semibold">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
