import type { ChatTurn, PromptDetail, PromptListItem } from "@/lib/types";

async function requestJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export async function fetchPrompts(): Promise<PromptListItem[]> {
  return requestJson<PromptListItem[]>("/api/prompts");
}

export async function fetchPromptDetail(id: string): Promise<PromptDetail> {
  return requestJson<PromptDetail>(`/api/prompts/${encodeURIComponent(id)}`);
}

export interface ChatStreamOptions {
  message: string;
  promptTemplateContent?: string;
  promptTemplateName?: string;
  history?: ChatTurn[];
  onDelta: (piece: string) => void;
  onMeta?: (meta: { mock?: boolean; promptTemplateName?: string | null }) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
  signal?: AbortSignal;
}

interface ChatMeta {
  promptTemplateName?: string | null;
  mock?: boolean;
  documentId?: string;
}

export async function streamChat(opts: ChatStreamOptions): Promise<void> {
  const body = {
    message: opts.message,
    promptTemplateContent: opts.promptTemplateContent,
    promptTemplateName: opts.promptTemplateName,
    history: opts.history ?? [],
  };

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "Unknown error");
    opts.onError?.(detail || `Request failed (${res.status})`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const parseBlock = (block: string): void => {
    let event = "message";
    const dataLines: string[] = [];
    for (const line of block.split("\n")) {
      const trimmed = line.trimEnd();
      if (trimmed.startsWith("event:")) event = trimmed.slice(6).trim();
      else if (trimmed.startsWith("data:")) dataLines.push(trimmed.slice(5).trim());
    }
    if (dataLines.length === 0) return;
    const payload = dataLines.join("\n");
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(payload) as Record<string, unknown>;
    } catch {
      return;
    }
    if (event === "delta") {
      opts.onDelta(String(parsed.content ?? ""));
    } else if (event === "meta") {
      opts.onMeta?.(parsed as unknown as ChatMeta);
    } else if (event === "done") {
      opts.onDone?.();
    } else if (event === "error") {
      opts.onError?.(String(parsed.message ?? "Unknown error"));
    }
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() ?? "";
      for (const block of blocks) parseBlock(block);
    }
    if (buffer.trim()) parseBlock(buffer);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      opts.onDone?.();
    } else {
      opts.onError?.(err instanceof Error ? err.message : "Stream interrupted");
    }
  }
}