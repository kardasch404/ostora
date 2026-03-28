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
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    fileType: initial?.fileType ?? ("cv" as DocumentFileType),
    size: initial?.size ?? "",
    mimeType: initial?.mimeType ?? "application/pdf",
  });
  const [errors, setErrors] = useState<{ name?: string; file?: string }>({});

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setForm((prev) => ({
      ...prev,
      name: file.name,
      size: `${Math.round(file.size / 1024)} KB`,
      mimeType: file.type || "application/octet-stream",
    }));
  };

  const validate = () => {
    const e: { name?: string; file?: string } = {};
    if (!form.name.trim()) e.name = "File name is required";
    if (!initial && !selectedFile) e.file = "Please choose a file to upload";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSave({ mappeId, ...form, file: selectedFile });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {!initial && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Upload File</label>
          <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-black hover:bg-gray-50 transition-all text-sm text-gray-600 group">
            <svg className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="font-medium">{form.name || "Choose a file to upload…"}</span>
            <input type="file" className="hidden" onChange={handleFile} accept=".pdf,.doc,.docx,.png,.jpg" />
          </label>
          {errors.file && <p className="text-xs text-red-500 mt-1.5">{errors.file}</p>}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">File Name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="CV_2024.pdf"
          className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent transition-all ${
            errors.name ? "border-red-400" : "border-gray-300"
          }`}
        />
        {errors.name && <p className="text-xs text-red-500 mt-1.5">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
        <select
          value={form.fileType}
          onChange={(e) => setForm({ ...form, fileType: e.target.value as DocumentFileType })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent transition-all"
        >
          {FILE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors h-10 px-6 border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors h-10 px-6 bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:pointer-events-none gap-2"
        >
          {submitting ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {initial ? "Save Changes" : "Add Document"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
