"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { AI_API_BASE_URL } from "@/lib/constants";
import { apiClient } from "@/lib/api-client";
import { useAppSelector } from "@/store/hooks";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  createdAt: number;
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

function createWelcomeMessage(name: string): ChatMessage {
  const safeName = name.trim() || "there";
  return {
    id: "assistant-welcome",
    role: "assistant",
    text: `Hi ${safeName}, I am Ostora AI. I can help you draft and improve your cover letters.`,
    createdAt: Date.now(),
  };
}

function formatTime(value: number): string {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function FloatingAIAssistant() {
  const authState = useAppSelector((state) => state.auth);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [logoFailed, setLogoFailed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [userName, setUserName] = useState("there");
  const [userEmail, setUserEmail] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [createWelcomeMessage("there")]);
  const [messageError, setMessageError] = useState("");

  const chatBodyRef = useRef<HTMLDivElement>(null);
  const chatFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fallback = authState.user?.name?.trim() || "there";
    setUserName(fallback);
    setUserEmail(authState.user?.email || "");
  }, [authState.user]);

  useEffect(() => {
    if (!chatOpen) {
      return;
    }

    let mounted = true;
    const loadProfile = async () => {
      try {
        const response = await apiClient.get("/api/v1/users/profile");
        const profile = response.data?.data || {};
        const fullName = `${String(profile.firstName || "").trim()} ${String(profile.lastName || "").trim()}`.trim();
        if (!mounted) {
          return;
        }
        setUserName(fullName || String(profile.name || authState.user?.name || "there"));
        setUserEmail(String(profile.email || authState.user?.email || ""));
      } catch (error) {
        if (!mounted) {
          return;
        }
        if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
          setUserName(authState.user?.name || "there");
          setUserEmail(authState.user?.email || "");
          return;
        }
      }
    };

    void loadProfile();
    return () => {
      mounted = false;
    };
  }, [chatOpen, authState.user]);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 0 || prev[0].id !== "assistant-welcome") {
        return prev;
      }

      const next = [...prev];
      next[0] = createWelcomeMessage(userName);
      return next;
    });
  }, [userName]);

  useEffect(() => {
    if (!chatOpen) {
      return;
    }
    chatBodyRef.current?.scrollTo({ top: chatBodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending, chatOpen]);

  const quickPrompts = useMemo(
    () => [
      "Write a professional cover letter for a full-stack developer role.",
      "Improve this paragraph and make it more concise.",
      `Draft a short outreach message for ${userName === "there" ? "me" : userName}.`,
    ],
    [userName],
  );

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || isSending) return;

    setMessageError("");

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsSending(true);

    const contextualMessage =
      userName && userName !== "there"
        ? `[User: ${userName}${userEmail ? `, ${userEmail}` : ""}] ${trimmed}`
        : trimmed;

    try {
      const response = await fetch(`${AI_API_BASE_URL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: contextualMessage,
          sessionId,
          language: "en",
        }),
      });

      if (!response.ok) {
        let details = "";
        try {
          const errorBody = await response.json();
          const message =
            typeof errorBody?.message === "string"
              ? errorBody.message
              : Array.isArray(errorBody?.message)
                ? errorBody.message.join(" ")
                : "";
          details = message;
        } catch {
          // Ignore JSON parse failures and fallback to status-only message.
        }
        throw new Error(details || `AI request failed with status ${response.status}`);
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
          createdAt: Date.now(),
        },
      ]);
    } catch (error) {
      const fallbackText =
        error instanceof Error && error.message
          ? `AI service error: ${error.message}`
          : "I cannot reach AI service now. Please ensure ai-service is running on port 4723 and try again.";
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: fallbackText,
          createdAt: Date.now(),
        },
      ]);
      setMessageError(fallbackText);
    } finally {
      setIsSending(false);
    }
  };

  const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      chatFormRef.current?.requestSubmit();
    }
  };

  const clearConversation = () => {
    setMessages([createWelcomeMessage(userName)]);
    setSessionId(undefined);
    setMessageError("");
  };

  return (
    <>
      {!chatOpen ? (
        <div className="fixed bottom-6 right-6 z-[220] flex items-center gap-2">
          <span className="hidden rounded-full border border-[#111827]/10 bg-white/90 px-3 py-1 text-xs font-semibold text-[#111827] shadow-sm backdrop-blur md:inline">
            Ask Ostora AI
          </span>
          <button
            type="button"
            aria-label="Open Ostora AI assistant"
            onClick={() => setChatOpen(true)}
            className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/50 bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1f2937] p-1.5 shadow-[0_18px_42px_rgba(17,24,39,0.46)] transition hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#a5b4fc]/55"
          >
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border border-white bg-emerald-500" />
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
        <section className="fixed bottom-24 right-6 z-[221] flex h-[640px] w-[392px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-3xl border border-[#d8dbe2] bg-white shadow-[0_26px_58px_rgba(0,0,0,0.24)]">
          <header className="relative flex items-center justify-between border-b border-[#e7e9ef] bg-[linear-gradient(100deg,#f8fafc_0%,#eef2ff_48%,#f8fafc_100%)] px-4 py-3">
            <div className="flex items-center gap-3">
              {logoFailed ? (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-xs font-bold text-white">AI</div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/ostora_logo.png" alt="Ostora AI" className="h-9 w-9 rounded-full object-cover ring-1 ring-black/10" onError={() => setLogoFailed(true)} />
              )}
              <div>
                <p className="text-sm font-semibold text-[#101828]">Ostora AI Assistant</p>
                <p className="text-xs text-gray-500">Chatting as {userName || "User"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearConversation}
                className="rounded-lg border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-100"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="rounded-lg border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </header>

          <div
            ref={chatBodyRef}
            className="flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top,#f8fafc_0%,#fdfdfd_45%,#ffffff_100%)] p-4"
          >
            {messages.map((message) => (
              <article key={message.id} className={message.role === "assistant" ? "max-w-[89%]" : "ml-auto max-w-[89%]"}>
                <div
                  className={`rounded-2xl border px-3 py-2 text-sm ${
                    message.role === "assistant"
                      ? "border-[#e7ebf2] bg-white text-[#111827] shadow-[0_5px_15px_rgba(17,24,39,0.06)]"
                      : "border-black bg-black text-white"
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-sans leading-relaxed">{message.text}</pre>
                </div>
                <p className="mt-1 px-1 text-[10px] text-gray-400">{formatTime(message.createdAt)}</p>
              </article>
            ))}

            {messages.length <= 2 && (
              <div className="grid grid-cols-1 gap-2 pt-1">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded-xl border border-[#e0e4eb] bg-white px-3 py-2 text-left text-xs text-[#4b5563] transition hover:-translate-y-[1px] hover:bg-[#f7f8fa]"
                  onClick={() => setChatInput(prompt)}
                >
                  {prompt}
                </button>
              ))}
              </div>
            )}

            {isSending && (
              <div className="max-w-[89%] rounded-2xl border border-[#e7ebf2] bg-white px-3 py-2 text-xs text-gray-500">
                Ostora AI is thinking...
              </div>
            )}
          </div>

          <form ref={chatFormRef} onSubmit={sendMessage} className="border-t border-[#ebeef3] bg-white p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Ask Ostora AI anything..."
                rows={2}
                maxLength={10000}
                className="min-h-[44px] flex-1 resize-none rounded-xl border border-[#d6dbe3] px-3 py-2 text-sm outline-none focus:border-black"
              />
              <button
                type="submit"
                disabled={isSending || chatInput.trim().length === 0}
                className="h-11 rounded-xl bg-black px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
              <p>Enter to send, Shift+Enter for new line</p>
              <p>{chatInput.length}/10000</p>
            </div>
            {messageError ? <p className="mt-1 text-[11px] text-red-600">{messageError}</p> : null}
          </form>
        </section>
      ) : null}
    </>
  );
}
