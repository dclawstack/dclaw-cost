"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function getSessionId(): string {
  if (typeof window === "undefined") return crypto.randomUUID();
  let id = localStorage.getItem("copilot_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("copilot_session_id", id);
  }
  return id;
}

export default function CopilotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your DClaw Cost Copilot. Ask me anything about your cloud spend, budgets, or optimization opportunities.",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    const asstId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: asstId, role: "assistant", content: "" },
    ]);
    setStreaming(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/copilot/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: getSessionId() }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === asstId ? { ...m, content: m.content + parsed.content } : m
              )
            );
          } catch {}
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === asstId ? { ...m, content: "Something went wrong. Try again." } : m
        )
      );
    } finally {
      setStreaming(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Open AI Copilot"
        >
          <Bot className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex w-96 flex-col rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold text-sm">AI Cost Copilot</span>
            </div>
            <button onClick={() => setOpen(false)} className="hover:opacity-75">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96 bg-gray-50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap",
                  m.role === "user"
                    ? "ml-auto bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-800"
                )}
              >
                {m.content || (m.role === "assistant" && <Loader2 className="h-4 w-4 animate-spin" />)}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-gray-200 bg-white p-3">
            <input
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Ask about your cloud costs..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              disabled={streaming}
            />
            <button
              onClick={send}
              disabled={streaming || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700"
            >
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
