"use client";

import { useState, useEffect } from "react";
import type { ReactElement } from "react";
import { CreateMappeDto, Bewerbungsmappe } from "@/types/bewerbung";

const LOGOS = [
  { id: "js", name: "JavaScript", color: "#F7DF1E", bgColor: "#000000" },
  { id: "ts", name: "TypeScript", color: "#3178C6", bgColor: "#FFFFFF" },
  { id: "react", name: "React", color: "#61DAFB", bgColor: "#20232A" },
  { id: "node", name: "Node.js", color: "#339933", bgColor: "#FFFFFF" },
  { id: "python", name: "Python", color: "#3776AB", bgColor: "#FFD43B" },
  { id: "java", name: "Java", color: "#007396", bgColor: "#FFFFFF" },
  { id: "docker", name: "Docker", color: "#2496ED", bgColor: "#FFFFFF" },
  { id: "aws", name: "AWS", color: "#FF9900", bgColor: "#232F3E" },
  { id: "git", name: "Git", color: "#F05032", bgColor: "#FFFFFF" },
  { id: "postgres", name: "PostgreSQL", color: "#4169E1", bgColor: "#FFFFFF" },
];

const TechIcon = ({ id, color, bgColor, size = 40 }: { id: string; color: string; bgColor: string; size?: number }) => {
  const icons: Record<string, ReactElement> = {
    js: (
      <svg viewBox="0 0 24 24" fill={color} width={size} height={size}>
        <rect width="24" height="24" fill={bgColor} rx="4" />
        <path d="M6.5 20.5c0 1.5 1 2 2.5 2s2.5-.5 2.5-2v-7h-2v7c0 .5-.2.7-.5.7s-.5-.2-.5-.7v-1h-2v1zm7 0c0 1.5 1 2 2.5 2 1.8 0 2.5-.8 2.5-2.5v-2c0-1-.5-1.5-1.5-1.5h-1.5v-2h2v.5h2v-1c0-1.5-1-2-2.5-2s-2.5.5-2.5 2v2c0 1 .5 1.5 1.5 1.5h1.5v2h-2v-.5h-2v1z" fill={color} />
      </svg>
    ),
    ts: (
      <svg viewBox="0 0 24 24" fill={color} width={size} height={size}>
        <rect width="24" height="24" fill={color} rx="4" />
        <path d="M12 7h-2v10h2V7zm3 0v2h3v8h2V9h3V7h-8z" fill="white" />
      </svg>
    ),
    react: (
      <svg viewBox="0 0 24 24" fill={color} width={size} height={size}>
        <circle cx="12" cy="12" r="2" fill={color} />
        <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke={color} strokeWidth="1.5" />
        <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke={color} strokeWidth="1.5" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke={color} strokeWidth="1.5" transform="rotate(120 12 12)" />
      </svg>
    ),
    node: (
      <svg viewBox="0 0 24 24" fill={color} width={size} height={size}>
        <path d="M12 1.5c-.4 0-.8.1-1.1.3L3.3 6.3c-.7.4-1.1 1.1-1.1 1.9v7.6c0 .8.4 1.5 1.1 1.9l7.6 4.5c.7.4 1.5.4 2.2 0l7.6-4.5c.7-.4 1.1-1.1 1.1-1.9V8.2c0-.8-.4-1.5-1.1-1.9l-7.6-4.5c-.3-.2-.7-.3-1.1-.3z" />
      </svg>
    ),
    python: (
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <path d="M12 2c-1.3 0-2.5.2-3.5.5C6.5 3 5.5 4 5.5 5.5v2h6v.5h-8c-1.5 0-2.8 1-3.2 2.8-.5 2-.5 3.2 0 5.4.3 1.6 1.2 2.8 2.7 2.8h1.8v-2.5c0-1.7 1.5-3.2 3.2-3.2h6c1.4 0 2.5-1.2 2.5-2.6v-5c0-1.4-1.2-2.5-2.5-2.7-1-.2-2.2-.5-3.5-.5zm-1.5 1.5c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1z" fill="#3776AB" />
        <path d="M20.5 6.5h-1.8v2.5c0 1.7-1.5 3.2-3.2 3.2h-6c-1.4 0-2.5 1.2-2.5 2.6v5c0 1.4 1.2 2.5 2.5 2.7 1.6.3 3.1.3 6 0 1.5-.2 2.5-1.1 2.5-2.7v-2h-6v-.5h8c1.5 0 2.1-.9 2.5-2.8.5-1.9.5-3.7 0-5.4-.3-1.5-1-2.6-2.5-2.6zm-6 13c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1z" fill="#FFD43B" />
      </svg>
    ),
    java: (
      <svg viewBox="0 0 24 24" fill={color} width={size} height={size}>
        <path d="M9 16.5s-.5.3 0 .5c.7.2 1 .2 1.8.2.8 0 1.5-.1 2.2-.3 0 0 .3.2.7.3-2.5 1-5.7-.1-4.7-1.7zm-.4-1.8s-.6.4 0 .5c.8.2 1.4.2 2.5.1 1-.1 1.9-.3 1.9-.3s.3.3.7.4c-4 1.2-8.5.1-5.1-1.7z" />
        <path d="M13.5 11.5c.7.8-.2 1.5-.2 1.5s1.8-.9.9-2c-.8-1-1.4-1.5 1.9-3.2 0 0-5.2 1.3-2.6 3.7z" />
        <path d="M18.5 18s.4.3-.4.6c-1.5.5-6.3.7-7.6 0-.5-.2.4-.5.7-.6.3-.1.5-.1.5-.1-.6-.4-3.8.8-1.6 1.1 5.3.8 9.7-.4 8.4-1z" />
      </svg>
    ),
    docker: (
      <svg viewBox="0 0 24 24" fill={color} width={size} height={size}>
        <path d="M13.5 10.5h2v2h-2v-2zm-3 0h2v2h-2v-2zm-3 0h2v2h-2v-2zm6-3h2v2h-2v-2zm-3 0h2v2h-2v-2zm-3 0h2v2h-2v-2zm-3 0h2v2h-2v-2zm9 6h2v2h-2v-2zm-3 0h2v2h-2v-2zm11.5-1.5c-.5-.3-1.5-.4-2.3-.1-.1-.8-.7-1.5-1.7-2.1l-.3-.2-.2.3c-.4.6-.6 1.4-.5 2.1.1.5.3.9.6 1.3-.3.2-.7.3-1.1.4h-14c-.6 0-1 .4-1 1 0 1.5.2 3 .9 4.4.7 1.3 1.7 2.3 3.1 2.9 1.3.6 2.8.9 4.3.9 1.2 0 2.4-.2 3.5-.5 1.5-.5 2.8-1.3 3.9-2.4 1.5-1.5 2.5-3.5 2.8-5.5h.2c1.3 0 2.1-.5 2.6-1 .3-.3.5-.7.6-1.1l.1-.3-.3-.2z" />
      </svg>
    ),
    aws: (
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <path d="M6.76 10.17c0 .4.03.73.09.98.06.25.15.52.29.79.05.09.07.18.07.26 0 .11-.07.22-.22.33l-.73.49c-.1.07-.21.1-.31.10-.12 0-.24-.06-.36-.17-.14-.15-.26-.31-.36-.49-.1-.18-.2-.38-.31-.61-.78.92-1.76 1.38-2.94 1.38-.84 0-1.51-.24-2-.72-.49-.48-.74-1.13-.74-1.93 0-.85.3-1.54.91-2.06.61-.52 1.42-.78 2.44-.78.34 0 .69.03 1.06.08.37.05.75.13 1.15.21v-.71c0-.74-.15-1.26-.46-1.55-.32-.29-.85-.44-1.61-.44-.35 0-.7.04-1.07.12-.37.08-.73.18-1.08.3-.16.06-.28.09-.35.11-.07.01-.13.02-.16.02-.14 0-.21-.1-.21-.31v-.49c0-.16.02-.28.07-.35.05-.07.14-.14.28-.21.35-.18.77-.33 1.26-.45.49-.13 1.02-.19 1.58-.19 1.21 0 2.09.27 2.65.82.55.55.83 1.38.83 2.5v3.3zm-4.08 1.53c.33 0 .67-.06 1.03-.18.36-.12.68-.33.95-.62.16-.18.28-.38.35-.61.07-.23.11-.5.11-.82v-.39c-.29-.06-.6-.11-.92-.15-.32-.04-.64-.06-.96-.06-.68 0-1.18.13-1.49.4-.31.27-.47.65-.47 1.15 0 .47.12.82.36 1.07.24.25.58.37 1.04.37zm8.1 1.09c-.18 0-.3-.03-.38-.1-.08-.07-.15-.21-.22-.42l-2.45-8.06c-.07-.23-.11-.38-.11-.45 0-.18.09-.27.27-.27h1.1c.19 0 .32.03.39.1.08.07.14.21.21.42l1.75 6.9 1.63-6.9c.06-.23.13-.37.2-.42.08-.07.22-.1.4-.1h.9c.19 0 .32.03.4.1.08.07.15.21.21.42l1.65 6.99 1.8-6.99c.07-.23.14-.37.21-.42.08-.07.21-.10.39-.10h1.04c.18 0 .28.09.28.27 0 .05-.01.11-.03.18-.02.07-.05.16-.09.27l-2.51 8.06c-.07.23-.14.37-.22.42-.08.07-.21.1-.38.10h-.97c-.19 0-.32-.03-.4-.1-.08-.07-.15-.21-.21-.43l-1.62-6.74-1.61 6.73c-.06.23-.13.37-.21.43-.08.07-.22.1-.4.1h-.97zm13.01.28c-.53 0-1.06-.06-1.58-.18-.52-.12-.93-.26-1.21-.41-.17-.09-.28-.19-.33-.29-.05-.1-.07-.21-.07-.32v-.51c0-.21.08-.31.23-.31.06 0 .12.01.18.03.06.02.15.06.27.11.37.16.77.29 1.2.37.43.09.86.13 1.29.13.68 0 1.21-.12 1.58-.35.37-.23.56-.57.56-1.01 0-.3-.1-.55-.29-.76-.19-.21-.55-.39-1.06-.56l-1.52-.48c-.77-.24-1.33-.6-1.69-1.06-.36-.46-.54-1-.54-1.6 0-.46.1-.87.3-1.23.2-.36.47-.67.81-.93.34-.26.73-.46 1.18-.59.45-.14.93-.2 1.44-.2.23 0 .47.01.7.04.24.03.46.07.68.11.21.05.41.1.61.16.2.06.36.12.49.18.15.08.26.16.33.25.07.09.1.2.10.35v.47c0 .21-.08.32-.23.32-.09 0-.23-.05-.42-.14-.64-.28-1.36-.42-2.17-.42-.62 0-1.11.1-1.45.31-.34.21-.51.52-.51.94 0 .3.1.56.31.77.21.21.59.41 1.14.59l1.49.47c.76.24 1.31.58 1.65 1.02.34.44.51.96.51 1.54 0 .47-.1.9-.29 1.29-.19.39-.47.73-.83 1.01-.36.28-.79.5-1.29.65-.51.15-1.07.23-1.68.23z" fill="#FF9900" />
        <path d="M21.69 17.72c-2.93 2.16-7.19 3.31-10.85 3.31-5.13 0-9.75-1.9-13.24-5.06-.27-.25-.03-.59.3-.4 3.76 2.19 8.41 3.5 13.21 3.5 3.24 0 6.8-.67 10.08-2.06.49-.21.91.32.5.71z" fill="#FF9900" />
        <path d="M23.14 15.95c-.37-.48-2.47-.23-3.41-.11-.29.03-.33-.22-.07-.4 1.67-1.18 4.41-.84 4.73-.44.32.4-.09 3.15-1.66 4.47-.24.2-.47.09-.36-.17.35-.88 1.14-2.87.77-3.35z" fill="#FF9900" />
      </svg>
    ),
    git: (
      <svg viewBox="0 0 24 24" fill={color} width={size} height={size}>
        <path d="M23.5 11.6l-11-11c-.6-.6-1.5-.6-2.1 0l-2.3 2.3 2.9 2.9c.6-.2 1.4-.1 2 .5.6.6.7 1.4.5 2l2.8 2.8c.6-.2 1.4-.1 2 .5.8.8.8 2 0 2.8-.8.8-2 .8-2.8 0-.6-.6-.7-1.5-.4-2.2l-2.6-2.6v6.9c.2.1.4.2.5.4.8.8.8 2 0 2.8-.8.8-2 .8-2.8 0-.8-.8-.8-2 0-2.8.2-.2.4-.3.7-.4v-7c-.2-.1-.5-.2-.7-.4-.6-.6-.7-1.5-.4-2.2l-2.9-2.9-7.6 7.6c-.6.6-.6 1.5 0 2.1l11 11c.6.6 1.5.6 2.1 0l10.9-10.9c.6-.6.6-1.5 0-2.1z" />
      </svg>
    ),
    postgres: (
      <svg viewBox="0 0 24 24" fill={color} width={size} height={size}>
        <path d="M17.1 2.5c-.2 0-.5 0-.7.1-1.3.3-2.1 1.3-2.5 2.5-.3-.1-.6-.1-.9-.1-1.9 0-3.5 1.1-4.3 2.7-.5-.2-1-.3-1.6-.3-2.2 0-4 1.8-4 4 0 1.5.8 2.8 2.1 3.5-.1.3-.1.7-.1 1 0 3.3 2.7 6 6 6 .8 0 1.5-.2 2.2-.4.7.3 1.5.4 2.3.4 3.3 0 6-2.7 6-6 0-.3 0-.7-.1-1 1.2-.7 2.1-2 2.1-3.5 0-2.2-1.8-4-4-4-.6 0-1.1.1-1.6.3-.8-1.6-2.4-2.7-4.3-2.7-.3 0-.6 0-.9.1-.4-1.2-1.2-2.2-2.5-2.5-.2-.1-.5-.1-.7-.1zm0 1c.1 0 .3 0 .4.1.8.2 1.4.8 1.7 1.6-1.1.5-2 1.4-2.5 2.5-.5-.2-1-.3-1.6-.3-.6 0-1.1.1-1.6.3-.5-1.1-1.4-2-2.5-2.5.3-.8.9-1.4 1.7-1.6.1-.1.3-.1.4-.1.2 0 .4 0 .6.1 1 .3 1.7 1.1 1.9 2.1.2-.1.5-.1.7-.1.3 0 .5 0 .7.1.2-1 .9-1.8 1.9-2.1.2-.1.4-.1.6-.1z" />
      </svg>
    ),
  };
  return icons[id] || icons.js;
};

interface Props {
  initial?: Bewerbungsmappe;
  onSave: (dto: CreateMappeDto) => void;
  onCancel: () => void;
}

export default function MappeForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<CreateMappeDto>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    logo: initial?.logo ?? "js",
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
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">Select Technology Icon</label>
        <div className="grid grid-cols-5 gap-3">
          {LOGOS.map((logo) => (
            <button
              key={logo.id}
              type="button"
              onClick={() => setForm({ ...form, logo: logo.id })}
              className={`relative flex items-center justify-center w-full aspect-square rounded-xl border-2 transition-all hover:scale-105 ${
                form.logo === logo.id
                  ? "border-black shadow-lg scale-105"
                  : "border-gray-200 hover:border-gray-400"
              }`}
              title={logo.name}
            >
              <TechIcon id={logo.id} color={logo.color} bgColor={logo.bgColor} size={32} />
              {form.logo === logo.id && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Software Engineer Applications"
          className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent transition-all ${
            errors.name ? "border-red-400" : "border-gray-300"
          }`}
        />
        {errors.name && <p className="text-xs text-red-500 mt-1.5">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Short description of this application folder"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
        />
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
          className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors h-10 px-6 bg-black text-white hover:bg-gray-800 gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {initial ? "Save Changes" : "Create Mappe"}
        </button>
      </div>
    </form>
  );
}
