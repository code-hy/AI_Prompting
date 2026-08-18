"use client";

import { useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  History,
  Loader2,
  MessageSquare,
  Plus,
  Sparkles,
} from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import type { PromptListItem } from "@/lib/types";

function PromptCard({
  prompt,
  active,
  onSelect,
}: {
  prompt: PromptListItem;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      title={prompt.description}
      className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
        active
          ? "border-violet-300 bg-violet-50"
          : "border-transparent hover:border-slate-200 hover:bg-slate-100"
      }`}
    >
      <p className="truncate text-[13px] font-semibold text-slate-800">
        {active && <Sparkles className="mr-1 inline h-3 w-3 text-violet-500" />}
        {prompt.name}
      </p>
      <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-500">
        {prompt.description || "No description"}
      </p>
    </button>
  );
}

export default function Sidebar() {
  const {
    prompts,
    promptsLoading,
    promptsError,
    promptsOpen,
    setPromptsOpen,
    loadPrompts,
    openPrompt,
    activePrompt,
    setSidebarOpen,
  } = useChatStore();

  useEffect(() => {
    void loadPrompts();
  }, [loadPrompts]);

  const grouped = prompts.reduce<Record<string, PromptListItem[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  const handleSelect = (p: PromptListItem) => {
    void openPrompt(p);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-full w-[260px] flex-col border-r border-slate-200 bg-white">
      {/* New chat */}
      <button
        type="button"
        onClick={() => {
          useChatStore.getState().clearChat();
          setSidebarOpen(false);
        }}
        className="mx-3 mt-3 flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
      >
        <Plus className="h-4 w-4" />
        New Chat
      </button>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {/* Prompt Library accordion */}
        <button
          type="button"
          onClick={() => setPromptsOpen(!promptsOpen)}
          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            Prompt Library
          </span>
          {promptsOpen ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {promptsOpen && (
          <div className="mt-2 space-y-4 pl-1">
            {promptsLoading && (
              <div className="flex items-center gap-2 px-2 py-2 text-xs text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading prompt library&hellip;
              </div>
            )}
            {promptsError && (
              <p className="px-2 py-2 text-xs text-red-600">
                {promptsError} — demo scenarios still available.
              </p>
            )}
            {!promptsLoading &&
              !promptsError &&
              Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <p className="mb-1 px-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    {category}
                  </p>
                  <div className="space-y-1">
                    {items.map((p) => (
                      <PromptCard
                        key={p.id}
                        prompt={p}
                        active={activePrompt?.id === p.id}
                        onSelect={() => handleSelect(p)}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Mock chat history */}
        <div className="mt-6">
          <p className="mb-1 flex items-center gap-1.5 px-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            <History className="h-3 w-3" />
            Chat History
          </p>
          <div className="space-y-0.5">
            {[
              "Evaluation criteria extraction",
              "Bidder readiness checklist",
              "RFQ requirements summary",
            ].map((title) => (
              <button
                key={title}
                type="button"
                className="flex w-full items-center gap-2 truncate rounded-lg px-2 py-1.5 text-left text-[13px] text-slate-500 hover:bg-slate-100"
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{title}</span>
              </button>
            ))}
          </div>
          <p className="px-2 pt-2 text-[11px] text-slate-400">
            Mock history for the demo.
          </p>
        </div>
      </div>
    </div>
  );
}