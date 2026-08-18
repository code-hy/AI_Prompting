"use client";

import Markdown from "@/components/Markdown";
import type { Message } from "@/lib/types";

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot h-2 w-2 rounded-full bg-slate-400"
        />
      ))}
      <span className="ml-2 text-xs text-slate-400">Generating&hellip;</span>
    </div>
  );
}

export default function MessageBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-slate-200 px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap text-slate-800">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div
        className={`max-w-[92%] rounded-2xl rounded-bl-md border px-4 py-3 shadow-sm ${
          message.error
            ? "border-red-200 bg-red-50"
            : "border-slate-200 bg-white"
        }`}
      >
        {message.pending && message.content.trim() === "" ? (
          <TypingIndicator />
        ) : (
          <Markdown content={message.content} />
        )}
        {message.error && (
          <p className="mt-2 text-xs font-medium text-red-600">
            Stream error — check the backend.
          </p>
        )}
      </div>
    </div>
  );
}