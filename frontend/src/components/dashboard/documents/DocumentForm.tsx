"use client";

import { useState } from "react";
import { CreateDocumentDto, DocumentFileType, BewerbungDocument } from "@/types/bewerbung";

const FILE_TYPES: { value: DocumentFileType; label: string }[] = [
  { value: "cv", label: "CV / Resume" },
  { value: "cover_letter", label: "Cover Letter" },
  { value: "certificate", label: "Certificate" },
  { value: "other", label: "Other" },
];

interface Props {
  mappeId: string;
  initial?: BewerbungDocument;
  onSave: (dto: CreateDocumentDto) => void;
  onCancel: () => void;
}

export default function DocumentForm({ mappeId, initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    fileType: initial?.fileType ?? ("cv" as DocumentFileType),
    size: initial?.size ?? "",
    mimeType: initial?.mimeType ?? "application/pdf",
  });
  const [errors, setErrors] = useState<{ name?: string }>({});

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({
      ...prev,
      name: file.name,
      size: `${Math.round(file.size / 1024)} KB`,
      mimeType: file.type || "application/octet-stream",
    }));
  };

  const validate = () => {
    const e: { name?: string } = {};
    if (!form.name.trim()) e.name = "File name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSave({ mappeId, ...form });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* File upload */}
      {!initial && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Upload File</label>
          <label className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-purple-400 transition-colors text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {form.name || "Choose a file…"}
            <input type="file" className="hidden" onChange={handleFile} accept=".pdf,.doc,.docx,.png,.jpg" />
          </label>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">File Name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="CV_2024.pdf"
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
            errors.name ? "border-red-400" : "border-gray-200"
          }`}
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Type</label>
        <select
          value={form.fileType}
          onChange={(e) => setForm({ ...form, fileType: e.target.value as DocumentFileType })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          {FILE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-semibold">
          Cancel
        </button>
        <button type="submit" className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-bold">
          {initial ? "Save Changes" : "Add Document"}
        </button>
      </div>
    </form>
  );
}
