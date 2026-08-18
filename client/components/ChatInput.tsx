"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Square, X } from "lucide-react";
import { useChatStore } from "@/store/chatStore";

export default function ChatInput() {
  const { isStreaming, activePrompt, clearActivePrompt, sendMessage } =
    useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  useEffect(() => {
    autoResize();
  }, [value]);

  const reset = () => {
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const submit = () => {
    if (!value.trim() || isStreaming) return;
    const text = value;
    reset();
    textareaRef.current?.focus();
    void sendMessage(text);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white px-4 pt-2 pb-4">
      {/* Active prompt chip */}
      {activePrompt && (
        <div className="mx-auto mb-2 flex max-w-3xl items-center justify-between rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5">
          <span className="flex items-center gap-2 text-[13px] text-violet-800">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            Active Prompt&nbsp;·&nbsp;
            <span className="font-semibold">{activePrompt.name}</span>
            <span className="hidden text-xs text-violet-500 sm:inline">
              — the template context will be applied to this chat.
            </span>
          </span>
          <button
            type="button"
            onClick={clearActivePrompt}
            title="Clear active prompt"
            className="ml-2 rounded p-1 text-violet-500 transition-colors hover:bg-violet-100 hover:text-violet-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={
              activePrompt
                ? "Ask me to execute the selected prompt template against the document…"
                : "Ask anything, or select a prompt template from the library…"
            }
            className="max-h-[200px] flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          {isStreaming ? (
            <button
              type="button"
              title="Generating…"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-400"
            >
              <Square className="h-4 w-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!value.trim()}
              title="Send (Enter)"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition-colors enabled:hover:bg-violet-700 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-400">
          {activePrompt
            ? "The REQ-260818 ATO RFQ is pre-loaded as Document Context."
            : "Enter Shift+Return for a new line. The REQ-260818 RFQ is pre-loaded in the backend."}
        </p>
      </div>
    </div>
  );
}