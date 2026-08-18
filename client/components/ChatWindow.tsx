"use client";

import { useEffect, useRef } from "react";
import { Menu, PanelLeft, TriangleAlert } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import EmptyState from "@/components/EmptyState";
import MessageBubble from "@/components/MessageBubble";
import ChatInput from "@/components/ChatInput";

export default function ChatWindow() {
  const { messages, mockMode, activePrompt } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollKey = messages.map((m) => m.content.length).join("|");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [scrollKey, messages.length]);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
        <button
          type="button"
          onClick={() =>
            useChatStore.setState((s) => ({ sidebarOpen: !s.sidebarOpen }))
          }
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
          title="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() =>
            useChatStore.setState((s) => ({
              sidebarCollapsedDesktop: !s.sidebarCollapsedDesktop,
            }))
          }
          className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:block"
          title="Toggle sidebar"
        >
          <PanelLeft className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm leading-tight font-semibold text-slate-900">
            {activePrompt ? `Active Context: ${activePrompt.name}` : "Standard Chat"}
          </h1>
          <p className="truncate text-[11px] text-slate-400">
            Document: SPC-17765 · ATO Request for Quote
          </p>
        </div>

        {mockMode && (
          <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
            <TriangleAlert className="h-3 w-3" />
            Demo mode — no LLM key
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <ChatInput />
    </div>
  );
}