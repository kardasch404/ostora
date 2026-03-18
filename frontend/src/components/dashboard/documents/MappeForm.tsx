"use client";

import { useState, useEffect } from "react";
import { CreateMappeDto, Bewerbungsmappe } from "@/types/bewerbung";

const LOGOS = ["💼", "🎓", "🚀", "🏢", "⭐", "🔥", "💡", "🎯", "📁", "🌟"];

interface Props {
  initial?: Bewerbungsmappe;
  onSave: (dto: CreateMappeDto) => void;
  onCancel: () => void;
}

export default function MappeForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<CreateMappeDto>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    logo: initial?.logo ?? "💼",
  });
  const [errors, setErrors] = useState<Partial<CreateMappeDto>>({});

  useEffect(() => {
    if (initial) setForm({ name: initial.name, description: initial.description, logo: initial.logo });
  }, [initial]);

  const validate = (): boolean => {
    const e: Partial<CreateMappeDto> = {};
    if (!form.name.trim()) e.name = "Name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Logo picker */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Logo</label>
        <div className="flex flex-wrap gap-2">
          {LOGOS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setForm({ ...form, logo: l })}
              className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${
                form.logo === l ? "border-purple-500 bg-purple-50 scale-110" : "border-gray-200 hover:border-purple-300"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Software Engineer Applications"
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
            errors.name ? "border-red-400" : "border-gray-200"
          }`}
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Short description of this application folder"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-semibold">
          Cancel
        </button>
        <button type="submit" className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-bold">
          {initial ? "Save Changes" : "Create Mappe"}
        </button>
      </div>
    </form>
  );
}
