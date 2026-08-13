"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "model";
  text: string;
  grounded?: boolean;
  sources?: { url?: string; title?: string }[];
}

interface ChatPanelProps {
  context?: {
    profile?: Record<string, unknown>;
    projection?: Record<string, unknown>;
    allocation?: Record<string, unknown>;
  };
}

const SUGGESTED_QUESTIONS = [
  "What if I retire 5 years earlier?",
  "Should I increase my 401(k) contribution?",
  "How do current market conditions affect my plan?",
  "What's the best order to fund my accounts?",
];

export function ChatPanel({ context }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [useGrounding, setUseGrounding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage: Message = { role: "user", text: messageText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      // Convert messages to Gemini format
      const chatHistory = updatedMessages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatHistory,
          context,
          useGrounding,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Chat failed");
      }

      const modelMessage: Message = {
        role: "model",
        text: data.reply,
        grounded: data.grounded,
        sources: data.sources,
      };
      setMessages([...updatedMessages, modelMessage]);
    } catch (err) {
      const errorMessage: Message = {
        role: "model",
        text: `Sorry, I encountered an error: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`,
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Ask your AI advisor
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Ask follow-up questions about your financial plan
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={useGrounding}
            onChange={(e) => setUseGrounding(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
          />
          Live market data
        </label>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4" style={{ maxHeight: "400px", minHeight: "200px" }}>
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Try asking a question about your plan:
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
              {msg.grounded && msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Sources:</p>
                  <ul className="mt-1 space-y-0.5">
                    {msg.sources.map((src, j) => (
                      <li key={j} className="text-xs">
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 underline hover:text-emerald-700 dark:text-emerald-400"
                        >
                          {src.title || src.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your financial plan..."
            disabled={loading}
            className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600"
          >
            Send
          </button>
        </div>
        {useGrounding && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Live market data enabled — responses may include current market information via Google Search.
          </p>
        )}
      </div>
    </div>
  );
}
