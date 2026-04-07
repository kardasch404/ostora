"use client";

import { type FormEvent, useMemo, useState } from "react";
import { AI_API_BASE_URL } from "@/lib/constants";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

type ChatApiResponse = {
  response?: unknown;
  sessionId?: string;
};

function stringifyAssistantResponse(response: unknown): string {
  if (typeof response === "string") {
    return response;
  }

  if (response && typeof response === "object") {
    const maybeText = (response as { text?: unknown }).text;
    if (typeof maybeText === "string" && maybeText.trim().length > 0) {
      return maybeText;
    }

    try {
      return JSON.stringify(response, null, 2);
    } catch {
      return "I received a response but could not display it.";
    }
  }

  return "I could not generate a response right now. Please try again.";
}

export default function FloatingAIAssistant() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [logoFailed, setLogoFailed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "assistant-welcome",
      role: "assistant",
      text: "Hi, I am Ostora AI. I can help you draft and improve your cover letters.",
    },
  ]);

  const quickPrompts = useMemo(
    () => [
      "Write a professional cover letter for a full-stack developer role.",
      "Improve this paragraph and make it more concise.",
    ],
    [],
  );

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsSending(true);

    try {
      const response = await fetch(`${AI_API_BASE_URL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          sessionId,
          language: "en",
        }),
      });

      if (!response.ok) {
        throw new Error(`AI request failed with status ${response.status}`);
      }

      const data = (await response.json()) as ChatApiResponse;
      if (typeof data.sessionId === "string" && data.sessionId.length > 0) {
        setSessionId(data.sessionId);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: stringifyAssistantResponse(data.response),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: "I cannot reach AI service now. Please ensure ai-service is running on port 4723 and try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {!chatOpen ? (
        <div className="fixed bottom-6 right-6 z-[220] flex items-center gap-2">
          <span className="hidden rounded-full border border-[#d8dbe2] bg-white/95 px-3 py-1 text-xs font-semibold text-[#101828] shadow-sm backdrop-blur md:inline">
            AI Assistant
          </span>
          <button
            type="button"
            aria-label="Open Ostora AI assistant"
            onClick={() => setChatOpen(true)}
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
      ) : null}

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
              <div key={message.id} className={`max-w-[88%] rounded-2xl border px-3 py-2 text-sm ${message.role === "assistant" ? "border-[#eceff4] bg-white text-[#1f2937]" : "ml-auto border-black bg-black text-white"}`}>
                <pre className="whitespace-pre-wrap font-sans">{message.text}</pre>
              </div>
            ))}
            <div className="grid grid-cols-1 gap-2 pt-1">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded-xl border border-[#e0e4eb] bg-white px-3 py-2 text-left text-xs text-[#4b5563] hover:bg-[#f7f8fa]"
                  onClick={() => setChatInput(prompt)}
                >
                  {prompt}
                </button>
              ))}
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
                disabled={isSending}
                className="h-11 rounded-xl bg-black px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-gray-500">Max 10000 characters</p>
          </form>
        </section>
      ) : null}
    </>
  );
}
