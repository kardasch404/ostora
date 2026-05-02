"use client";

import { useEffect, useMemo, useState } from "react";

type TemplateCategory = "all" | "simple" | "modern" | "creative";

type ResumeTemplate = {
  id: string;
  name: string;
  category: Exclude<TemplateCategory, "all">;
  preview: string;
};

const templates: ResumeTemplate[] = [
  { id: "classic", name: "Classic", category: "simple", preview: "https://prod.flowcvassets.com/resume-templates/wo0esaxiizzxuq1mwkza8/960.jpeg" },
  { id: "atlantic-blue", name: "Atlantic Blue", category: "modern", preview: "https://prod.flowcvassets.com/resume-templates/z_b_8pggvd0955_woiozq/960.jpeg" },
  { id: "corporate", name: "Corporate", category: "modern", preview: "https://prod.flowcvassets.com/resume-templates/yqkcjiuopitnju5uuoq0o/960.jpeg" },
  { id: "designer", name: "Designer", category: "creative", preview: "https://prod.flowcvassets.com/resume-templates/7k2r8idqa3siolqrg_bb3/960.jpeg" },
  { id: "harvard", name: "Harvard", category: "simple", preview: "https://prod.flowcvassets.com/resume-templates/aolmyzzk7frcnkmzjiicp/960.jpeg" },
  { id: "minty", name: "Minty", category: "creative", preview: "https://prod.flowcvassets.com/resume-templates/spq0sd8muwn3ijeckqtbm/960.jpeg" },
  { id: "executive", name: "Executive", category: "modern", preview: "https://prod.flowcvassets.com/resume-templates/gs_qryrzly3kldmqhxqsb/960.jpeg" },
  { id: "fine-line", name: "Fine Line", category: "simple", preview: "https://prod.flowcvassets.com/resume-templates/hhgiq971t9bmcmgk7yvzs/960.jpeg" },
  { id: "ultra-violet", name: "Ultra Violet", category: "creative", preview: "https://prod.flowcvassets.com/resume-templates/bibpaexrejoqcnrv3kehn/960.jpeg" },
];

const categories: Array<{ value: TemplateCategory; label: string }> = [
  { value: "all", label: "All Templates" },
  { value: "simple", label: "Simple" },
  { value: "modern", label: "Modern" },
  { value: "creative", label: "Creative" },
];

export default function OstoraCvResumePage() {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>("all");
  const [activeTemplate, setActiveTemplate] = useState<ResumeTemplate | null>(null);

  const filtered = useMemo(() => {
    if (selectedCategory === "all") return templates;
    return templates.filter((template) => template.category === selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    if (!activeTemplate) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeTemplate]);

  return (
    <main className="flex min-h-screen max-w-[1500px] flex-1 flex-col px-4 pb-8 md:px-5 lg:px-8 lg:pb-12 xl:px-10 2xl:px-12 2xl:pb-16">
      <div className="relative overflow-hidden rounded-3xl border border-[#2b2b2b] bg-gradient-to-br from-[#101113] via-[#15171b] to-[#1e2024] px-5 pb-6 pt-6 shadow-[0_16px_36px_rgba(0,0,0,0.34)] 2xl:pt-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[#d4af37]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-8 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e4c46b]">Premium Templates</p>
        <h1 className="mt-2 text-xl font-bold leading-none tracking-tight text-white lg:text-2xl 2xl:text-3xl">
          Start building your resume
        </h1>
        <p className="mt-2 max-w-3xl text-base text-[#d5d8de] 2xl:text-lg">
          Choose a design you like. You can customize or switch it later.
        </p>
      </div>

      <div className="sticky top-0 z-10 mt-3 rounded-2xl border border-[#242528] bg-[#0f1114]/95 px-2 pb-4 pt-4 shadow-[0_10px_20px_rgba(0,0,0,0.22)] backdrop-blur-sm">
        <div className="-mx-4 flex flex-col justify-between gap-4 lg:-mx-0 lg:flex-row lg:items-center">
          <div className="hide-scrollbar grid auto-cols-max grid-flow-col gap-2 overflow-auto pl-4 lg:pl-0">
            {categories.map((category) => {
              const active = selectedCategory === category.value;
              return (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => setSelectedCategory(category.value)}
                  className={`h-10 rounded-full border px-5 text-[15px] font-semibold lg:h-11 xl:h-12 xl:px-7 ${
                    active
                      ? "border-[#d4af37] bg-[#d4af37] text-[#111111] shadow-[0_6px_14px_rgba(212,175,55,0.35)]"
                      : "border-[#3c3f44] bg-[#f8f8f8] text-[#111111] hover:border-[#d4af37]"
                  }`}
                >
                  {category.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="mx-4 hidden h-11 rounded-xl border border-[#d4af37] bg-[#d4af37] px-6 text-base font-semibold text-black transition hover:brightness-95 lg:mx-0 lg:flex lg:items-center"
          >
            Import resume
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-6 pb-8 pt-5 sm:grid-cols-3 md:gap-x-6 md:gap-y-7 lg:grid-cols-3 lg:gap-y-8 2xl:gap-x-8 2xl:gap-y-9">
        {filtered.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => setActiveTemplate(template)}
            className="text-left"
          >
            <div className="overflow-hidden rounded-md border border-gray-200 shadow-sm transition hover:opacity-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={template.preview}
                alt={`${template.name} template preview`}
                className="h-auto w-full"
                style={{ aspectRatio: "1 / 1.414" }}
              />
            </div>
            <p className="mt-2 pl-0.5 text-xs font-medium uppercase text-gray-700 lg:text-sm">
              {template.name}
            </p>
          </button>
        ))}
      </div>

      {activeTemplate ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
          <div className="relative mx-1 w-full max-w-xl rounded-2xl bg-slate-100 px-5 py-5 shadow-2xl sm:mx-2 md:mx-4 md:px-7 md:py-7 lg:max-w-6xl lg:px-9 lg:py-9">
            <button
              type="button"
              onClick={() => setActiveTemplate(null)}
              className="absolute right-2 top-2 flex cursor-pointer items-center justify-center rounded-md border border-gray-300 p-2 text-gray-600 transition hover:bg-gray-50 hover:text-gray-700 lg:right-2.5 lg:top-2.5"
              aria-label="Close template modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 13 12" className="h-3.5 w-3.5">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.565 1.22l-9.992 9.54M11.567 10.766l-10-9.55" />
              </svg>
            </button>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-20">
              <div className="cursor-pointer overflow-hidden rounded-md border border-white transition duration-200 ease-out hover:scale-[1.01]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeTemplate.preview}
                  alt={`${activeTemplate.name} template preview`}
                  className="h-auto w-full"
                  style={{ aspectRatio: "1 / 1.414" }}
                />
              </div>

              <div>
                <div className="mt-3 lg:mt-20">
                  <p className="text-2xl uppercase lg:text-3xl 2xl:text-4xl">{activeTemplate.name}</p>
                  <div className="my-4 w-full border-b border-gray-500 lg:my-6 2xl:my-8" />
                  <p className="text-base text-gray-700">
                    Each template is crafted to make resume design fast, professional, and simple to customize.
                  </p>
                  <ul className="mt-6 list-disc pl-[18px] text-gray-800">
                    <li className="mt-1.5">A4 and US Letter ready</li>
                    <li className="mt-1.5">Editable text blocks</li>
                    <li className="mt-1.5">Fully customizable sections</li>
                    <li className="mt-1.5">Print-ready formatting</li>
                    <li className="mt-1.5">Online sharing link support</li>
                  </ul>
                </div>

                <div className="mt-8 flex flex-col items-center lg:items-start">
                  <button
                    type="button"
                    className="h-12 rounded-[10px] bg-black px-7 py-2 text-base font-semibold text-white transition hover:opacity-80"
                  >
                    Use this template
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex w-full justify-center lg:mt-10 2xl:mt-16">
        <div className="flex w-full flex-col items-center rounded-2xl border border-gray-700 px-6 pb-9 pt-8 text-center sm:w-auto sm:rounded-3xl sm:px-16 sm:py-12 md:px-20 lg:px-24 lg:py-14 2xl:px-32">
          <h2 className="text-[#111827] text-2xl leading-tight tracking-tight sm:text-[32px] xl:text-[36px]">
            Didn&apos;t find the right resume template?
          </h2>
          <p className="mt-2 text-base text-gray-600 sm:mt-3 sm:text-lg xl:mt-5 xl:text-[24px]">
            No worries, you can design your own in OstoraCV.
          </p>
          <button
            type="button"
            className="mt-5 h-12 rounded-xl bg-black px-7 text-[15px] font-semibold text-white hover:opacity-85 sm:mt-8 sm:h-14 sm:px-10 sm:text-base"
          >
            Create resume now
          </button>
        </div>
      </div>
    </main>
  );
}
