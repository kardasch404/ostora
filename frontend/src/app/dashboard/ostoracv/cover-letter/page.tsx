"use client";

import { useMemo, useState, type FormEvent } from "react";

type LetterTemplate = {
  id: string;
  name: string;
  preview: string;
};

type CoverLetterDoc = {
  id: string;
  title: string;
  updatedAt: string;
  pageSize: "A4" | "US-Letter";
  templateId: string;
};

const templates: LetterTemplate[] = [
  { id: "classic-centered", name: "Classic - Cover letter centered", preview: "https://prod.flowcvassets.com/letter-templates/letter-template-gdulhec4bafsy3u-qcqgw/960.jpeg" },
  { id: "dark-leaves", name: "Dark Leaves - Cover letter border", preview: "https://prod.flowcvassets.com/letter-templates/letter-template-6zqnh3-wjtbex0uznfwl5/960.jpeg" },
  { id: "classic-template", name: "Classic - Cover letter template", preview: "https://prod.flowcvassets.com/letter-templates/letter-template-qtxhg6xjcsglos4dcr7xc/960.jpeg" },
  { id: "rosewood-header", name: "Rosewood - Two-column header", preview: "https://prod.flowcvassets.com/letter-templates/letter-template-fb3utossmxppwtousgnbt/960.jpeg" },
  { id: "minty", name: "Minty - Minimalistic cover letter", preview: "https://prod.flowcvassets.com/letter-templates/letter-template-bvuzfeei4u_vplmv3asfk/960.jpeg" },
  { id: "blue-classic", name: "Blue Classic - Border accent", preview: "https://prod.flowcvassets.com/letter-templates/letter-template-q5qnsjvkswa0i38q9uzxv/960.jpeg" },
  { id: "sea-pearl", name: "Sea Pearl - Creative cover letter", preview: "https://prod.flowcvassets.com/letter-templates/letter-template-rlydv-wae89nxlukynyoo/960.jpeg" },
  { id: "lavender", name: "Lavender - Creative cover letter", preview: "https://prod.flowcvassets.com/letter-templates/letter-template-9iygnz9lu07wptazfybdm/960.jpeg" },
  { id: "classic-green", name: "Classic Green - Minimal border", preview: "https://prod.flowcvassets.com/letter-templates/letter-template-kxh-c4wbjsmcbjujamnvd/960.jpeg" },
  { id: "violetta", name: "Violetta - Minimal creative", preview: "https://prod.flowcvassets.com/letter-templates/letter-template-zykvlqbxgu0kgdubt5pju/960.jpeg" },
  { id: "elite", name: "Elite - Header classic", preview: "https://prod.flowcvassets.com/letter-templates/letter-template-zh7b-ptapddss3rcbxuck/960.jpeg" },
  { id: "executive", name: "Executive - Serif sidebar", preview: "https://prod.flowcvassets.com/letter-templates/letter-template-elrgzyo1cbs1_hfcfywrw/960.jpeg" },
  { id: "powder-blush", name: "Powder Blush - Border", preview: "https://prod.flowcvassets.com/letter-templates/letter-template-gvhlnfnd7l8qmd1m2_-qk/960.jpeg" },
  { id: "mercury", name: "Mercury - Two-column", preview: "https://prod.flowcvassets.com/letter-templates/letter-template-dxlnk4kaejkvvouk-yskv/960.jpeg" },
  { id: "accentuated", name: "Accentuated - Red accent", preview: "https://prod.flowcvassets.com/letter-templates/letter-template-3pa21fr-devc_jvw4pdfx/960.jpeg" },
  { id: "gold", name: "Gold - Minimal border", preview: "https://prod.flowcvassets.com/letter-templates/letter-template-sint_jcrrypsb5tjhubbt/960.jpeg" },
];

const initialCoverLetters: CoverLetterDoc[] = [
  {
    id: "letter-1",
    title: "Cover Letter 1",
    updatedAt: "edited 8 months ago",
    pageSize: "A4",
    templateId: "classic-centered",
  },
];

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

export default function OstoraCvCoverLetterPage() {
  const [documents, setDocuments] = useState<CoverLetterDoc[]>(initialCoverLetters);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [openMenuForId, setOpenMenuForId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [logoFailed, setLogoFailed] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "assistant-welcome",
      role: "assistant",
      text: "Hi, I am Ostora AI. I can help you draft and improve your cover letters.",
    },
  ]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId],
  );

  const resolvePreview = (templateId: string) => {
    const fallback = templates[0]?.preview ?? "";
    return templates.find((template) => template.id === templateId)?.preview ?? fallback;
  };

  const handleCreateFromTemplate = () => {
    if (!selectedTemplateId) return;
    const nextIndex = documents.length + 1;
    setDocuments((prev) => [
      {
        id: `letter-${Date.now()}`,
        title: `Cover Letter ${nextIndex}`,
        updatedAt: "edited just now",
        pageSize: "A4",
        templateId: selectedTemplateId,
      },
      ...prev,
    ]);
    setShowTemplatePicker(false);
    setSelectedTemplateId(null);
  };

  const handleDuplicate = (id: string) => {
    const source = documents.find((item) => item.id === id);
    if (!source) return;
    setDocuments((prev) => [
      {
        ...source,
        id: `letter-${Date.now()}`,
        title: `${source.title} Copy`,
        updatedAt: "edited just now",
      },
      ...prev,
    ]);
    setOpenMenuForId(null);
  };

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((item) => item.id !== id));
    setOpenMenuForId(null);
  };

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      text: "Got it. I can help tailor this cover letter to your role and tone. Share the job description or your draft.",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setChatInput("");
  };

  return (
    <main className="flex min-h-screen max-w-[1500px] flex-1 flex-col px-4 pb-8 md:px-5 lg:px-8 lg:pb-12 xl:px-10 2xl:px-12 2xl:pb-16">
      <div className="sticky top-0 z-10 rounded-2xl border border-[#d8d2c6] bg-gradient-to-r from-[#f8f3ea]/95 via-[#f2ede2]/95 to-[#ece6da]/95 px-4 pb-4 pt-6 shadow-[0_10px_24px_rgba(17,24,39,0.08)] backdrop-blur-sm 2xl:pb-6 2xl:pt-8">
        <div className="flex flex-col gap-y-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8c6f25]">Premium Workspace</p>
            <h1 className="text-[#101828] text-xl font-bold leading-none lg:text-2xl 2xl:text-3xl">
              My Cover Letters
            </h1>
            <p className="mt-1.5 text-base text-gray-500 2xl:mt-2.5 2xl:text-lg">
              Your first cover letter is free forever. Need more than one?{" "}
              <button type="button" className="font-semibold underline hover:opacity-80">
                Upgrade your plan
              </button>
            </p>
          </div>
        </div>
      </div>

      {showTemplatePicker ? (
        <section>
          <div className="mb-4 mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setShowTemplatePicker(false);
                setSelectedTemplateId(null);
              }}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Back to my cover letters
            </button>
            <button
              type="button"
              disabled={!selectedTemplate}
              onClick={handleCreateFromTemplate}
              className="h-11 rounded-xl bg-black px-6 text-sm font-semibold text-white transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Use selected template
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-6 pb-8 pt-4 sm:grid-cols-3 md:gap-x-6 md:gap-y-8 lg:grid-cols-3 lg:pt-6 2xl:grid-cols-4">
            <button
              type="button"
              className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-400 text-gray-500 hover:opacity-80"
              style={{ aspectRatio: "210 / 296" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-5">
                <path d="M15 7H9V1a1 1 0 00-2 0v6H1a1 1 0 000 2h6v6a1 1 0 102 0V9h6a1 1 0 100-2z" />
              </svg>
              <span className="mt-2 text-base font-bold">New blank</span>
            </button>

            {templates.map((template) => {
              const isSelected = selectedTemplateId === template.id;
              return (
                <button key={template.id} type="button" onClick={() => setSelectedTemplateId(template.id)} className="text-left">
                  <div className={`cursor-pointer overflow-hidden rounded-md border border-solid shadow-sm hover:opacity-70 ${isSelected ? "border-black ring-2 ring-black/20" : "border-gray-200"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={template.preview} alt={template.name} className="h-auto w-full" style={{ aspectRatio: "1 / 1.414" }} />
                  </div>
                  <p className="mt-[6px] max-w-min truncate pl-0.5 text-xs uppercase text-gray-500">{template.name}</p>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 pb-8 pt-4 sm:grid-cols-3 md:gap-x-6 md:gap-y-8 lg:grid-cols-3 2xl:grid-cols-4 2xl:gap-x-8 2xl:gap-y-10">
          <div className="flex flex-col rounded-lg" style={{ aspectRatio: "210 / 296" }}>
            <button
              type="button"
              onClick={() => {
                setShowTemplatePicker(true);
                setSelectedTemplateId(null);
                setOpenMenuForId(null);
              }}
              className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-400 text-gray-500 transition hover:opacity-80"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-5">
                <path d="M15 7H9V1a1 1 0 00-2 0v6H1a1 1 0 000 2h6v6a1 1 0 102 0V9h6a1 1 0 100-2z" />
              </svg>
              <span className="mt-2 text-base font-bold">New cover letter</span>
            </button>
          </div>

          {documents.map((doc) => (
            <div key={doc.id} className="relative select-none">
              <div className="relative cursor-pointer select-none overflow-hidden rounded-md border border-white shadow-sm" style={{ height: 457 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolvePreview(doc.templateId)}
                  alt={`${doc.title} preview`}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="relative mt-[6px] grid w-full max-w-full grid-cols-[minmax(0,1fr)_min-content] gap-1 pl-0.5">
                <div className="w-full">
                  <p className="line-clamp-2 w-full font-bold leading-tight">{doc.title}</p>
                  <p className="mt-0.5 text-xs leading-none text-gray-500">
                    {doc.updatedAt} • {doc.pageSize}
                  </p>
                </div>

                <div className="mt-1">
                  <button
                    type="button"
                    onClick={() => setOpenMenuForId((prev) => (prev === doc.id ? null : doc.id))}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 transition hover:bg-gray-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 text-gray-500">
                      <path d="M12 7a2 2 0 100-4 2 2 0 000 4zm0 10a2 2 0 100 4 2 2 0 000-4zm0-7a2 2 0 100 4 2 2 0 000-4z" />
                    </svg>
                  </button>
                </div>

                {openMenuForId === doc.id ? (
                  <div className="absolute bottom-[33px] right-0 z-[11] w-full rounded-lg bg-white shadow-md">
                    <div className="rounded-lg border border-gray-200">
                      <button type="button" className="flex w-full items-center justify-start gap-3 px-3.5 pb-2.5 pt-3.5 font-semibold hover:opacity-80" onClick={() => setOpenMenuForId(null)}>
                        Edit title
                      </button>
                      <button type="button" className="flex w-full items-center justify-start gap-3 px-3.5 py-2.5 font-semibold hover:opacity-80" onClick={() => handleDuplicate(doc.id)}>
                        Duplicate
                      </button>
                      <button type="button" className="flex w-full items-center justify-start gap-3 px-3.5 py-2.5 font-semibold hover:opacity-80" onClick={() => setOpenMenuForId(null)}>
                        <span className="flex items-center gap-1.5">
                          AI translate
                          <span className="hidden rounded-lg bg-[#11a997] px-1.5 py-0.5 text-xs font-medium text-white md:inline">Beta</span>
                        </span>
                      </button>
                      <button type="button" className="flex w-full items-center justify-start gap-3 px-3.5 pb-3.5 pt-2.5 font-semibold text-red-600 hover:opacity-80" onClick={() => handleDelete(doc.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-[220] flex items-center gap-2">
        <span className="hidden rounded-full border border-[#d8dbe2] bg-white/95 px-3 py-1 text-xs font-semibold text-[#101828] shadow-sm backdrop-blur md:inline">
          AI Assistant
        </span>
        <button
          type="button"
          aria-label="Open Ostora AI assistant"
          onClick={() => setChatOpen((prev) => !prev)}
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#dbe7ff] bg-gradient-to-br from-[#3f8cff] via-[#2f74ff] to-[#1f5dff] p-1.5 shadow-[0_14px_38px_rgba(31,93,255,0.42)] transition hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9fc0ff]/70"
        >
          {logoFailed ? (
            <span className="text-xs font-bold tracking-wide text-white">AI</span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/ostora_logo.png"
              alt="Ostora AI"
              className="h-full w-full rounded-full border border-white/70 bg-white object-contain"
              onError={() => setLogoFailed(true)}
            />
          )}
        </button>
      </div>

      {chatOpen ? (
        <section className="fixed bottom-24 right-6 z-[221] flex h-[640px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-[#d8dbe2] bg-white shadow-[0_22px_45px_rgba(0,0,0,0.22)]">
          <header className="flex items-center justify-between border-b border-[#ebeef3] bg-[#f8fafc] px-4 py-3">
            <div className="flex items-center gap-2">
              {logoFailed ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-bold text-white">AI</div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/ostora_logo.png" alt="Ostora AI" className="h-8 w-8 rounded-full object-cover" onError={() => setLogoFailed(true)} />
              )}
              <div>
                <p className="text-sm font-semibold text-[#101828]">Ostora AI Assistant</p>
                <p className="text-xs text-gray-500">How can I help you today?</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
            >
              Close
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#fcfcfd] p-4">
            {messages.map((message) => (
              <div key={message.id} className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${message.role === "assistant" ? "bg-white text-[#1f2937] border border-[#eceff4]" : "ml-auto bg-black text-white"}`}>
                {message.text}
              </div>
            ))}
            <div className="grid grid-cols-1 gap-2 pt-1">
              <button type="button" className="rounded-xl border border-[#e0e4eb] bg-white px-3 py-2 text-left text-xs text-[#4b5563] hover:bg-[#f7f8fa]" onClick={() => setChatInput("Write a professional cover letter for a full-stack developer role.")}>Write a professional cover letter for a full-stack role</button>
              <button type="button" className="rounded-xl border border-[#e0e4eb] bg-white px-3 py-2 text-left text-xs text-[#4b5563] hover:bg-[#f7f8fa]" onClick={() => setChatInput("Improve this paragraph and make it more concise.")}>Improve my paragraph and make it concise</button>
            </div>
          </div>

          <form onSubmit={sendMessage} className="border-t border-[#ebeef3] bg-white p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Ask Ostora AI anything..."
                rows={2}
                maxLength={10000}
                className="min-h-[44px] flex-1 resize-none rounded-xl border border-[#d6dbe3] px-3 py-2 text-sm outline-none focus:border-black"
              />
              <button
                type="submit"
                className="h-11 rounded-xl bg-black px-4 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Send
              </button>
            </div>
            <p className="mt-1 text-[11px] text-gray-500">Max 10000 characters</p>
          </form>
        </section>
      ) : null}
    </main>
  );
}
