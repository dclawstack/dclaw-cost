"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Bot, User, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDashboard, type DashboardStats } from "@/lib/api";

// Relative URL — proxied to BACKEND_URL/api/v1/copilot/chat via next.config.js rewrites
const CHAT_URL = "/api/v1/copilot/chat";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What are my biggest cost drivers this month?",
  "How can I reduce my cloud spend by 20%?",
  "Which resources are good candidates for right-sizing?",
  "Explain the difference between reserved instances and savings plans.",
  "What is FinOps and how should my team practice it?",
];

function getSessionId(): string {
  if (typeof window === "undefined") return crypto.randomUUID();
  let id = localStorage.getItem("copilot_session_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("copilot_session_id", id); }
  return id;
}

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your DClaw Cost Copilot — your AI-powered FinOps assistant.\n\nI can help you understand your cloud spend, identify savings opportunities, explain FinOps concepts, and suggest optimization strategies based on your data.\n\nWhat would you like to explore?",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { getDashboard().then(setStats).catch(() => {}); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text = input.trim()) => {
    if (!text || streaming) return;
    setInput("");

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    const asstId = crypto.randomUUID();
    setMessages((prev) => [...prev, userMsg, { id: asstId, role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: getSessionId() }),
      });

      if (!res.body) throw new Error("No stream body");

      const reader = res.body.getReader();
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
              prev.map((m) => m.id === asstId ? { ...m, content: m.content + parsed.content } : m)
            );
          } catch {}
        }
      }
    } catch (e) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === asstId
            ? { ...m, content: `Error: ${e instanceof Error ? e.message : "Something went wrong."}` }
            : m
        )
      );
    } finally {
      setStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const reset = () => {
    localStorage.removeItem("copilot_session_id");
    setMessages([{
      id: "welcome-" + Date.now(),
      role: "assistant",
      content: "Session reset. How can I help you optimize your cloud costs?",
    }]);
  };

  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">AI Cost Copilot</h1>
              <p className="text-xs text-gray-400">Powered by Kimi K2 via OpenRouter</p>
            </div>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" /> New session
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 px-6 py-6 bg-gray-50">
          {messages.map((m) => (
            <div key={m.id} className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
              <div className={cn(
                "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                m.role === "user" ? "bg-gray-200" : "bg-blue-600"
              )}>
                {m.role === "user" ? <User className="h-4 w-4 text-gray-600" /> : <Bot className="h-4 w-4 text-white" />}
              </div>
              <div className={cn(
                "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-sm"
                  : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
              )}>
                {m.content || (
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[44px] max-h-32"
              placeholder="Ask about your cloud costs…"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              disabled={streaming}
            />
            <button
              onClick={() => send()}
              disabled={streaming || !input.trim()}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors"
            >
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="hidden w-72 flex-shrink-0 border-l border-gray-200 bg-white lg:flex lg:flex-col">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Live Context</h2>
          <p className="text-xs text-gray-400 mt-0.5">What the copilot knows right now</p>
        </div>

        {stats && (
          <div className="px-5 py-4 space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Monthly Spend</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">
                ${stats.total_monthly_spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Savings Available</p>
              <p className="text-xl font-bold text-green-600 mt-0.5">
                ${stats.total_savings_opportunities.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Alerts</p>
              <p className={`text-xl font-bold mt-0.5 ${stats.active_alerts_count > 0 ? "text-red-600" : "text-gray-900"}`}>
                {stats.active_alerts_count}
              </p>
            </div>
            {stats.top_services.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Top Services</p>
                <div className="space-y-1">
                  {stats.top_services.slice(0, 3).map((s) => (
                    <div key={s.service} className="flex justify-between text-xs">
                      <span className="text-gray-600">{s.service}</span>
                      <span className="font-medium text-gray-900">
                        ${s.cost_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="px-5 py-4 border-t border-gray-100 mt-auto">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Suggested Questions</p>
          <div className="space-y-2">
            {SUGGESTIONS.slice(0, 4).map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={streaming}
                className="w-full text-left text-xs text-gray-600 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg px-3 py-2 transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
