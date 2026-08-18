"use client";

import { create } from "zustand";
import { fetchPromptDetail, fetchPrompts, streamChat } from "@/lib/api";
import type { ChatTurn, Message, PromptDetail, PromptListItem } from "@/lib/types";

let counter = 0;
const nextId = () => `msg_${Date.now()}_${counter++}`;

interface ChatState {
  messages: Message[];
  prompts: PromptListItem[];
  promptsLoading: boolean;
  promptsError: string | null;
  promptsOpen: boolean;
  activePrompt: PromptDetail | null;
  activePromptLoading: boolean;
  isStreaming: boolean;
  mockMode: boolean | null;
  sidebarOpen: boolean;
  sidebarCollapsedDesktop: boolean;

  loadPrompts: () => Promise<void>;
  setPromptsOpen: (open: boolean) => void;
  openPrompt: (item: PromptListItem) => Promise<void>;
  clearActivePrompt: () => void;
  clearChat: () => void;
  sendMessage: (text: string) => Promise<void>;
  selectAndRun: (item: PromptListItem, message?: string) => Promise<void>;
  setSidebarOpen: (open: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  prompts: [],
  promptsLoading: false,
  promptsError: null,
  promptsOpen: true,
  activePrompt: null,
  activePromptLoading: false,
  isStreaming: false,
  mockMode: null,
  sidebarOpen: false,
  sidebarCollapsedDesktop: false,

  loadPrompts: async () => {
    set({ promptsLoading: true, promptsError: null });
    try {
      const prompts = await fetchPrompts();
      set({ prompts, promptsLoading: false });
    } catch (err) {
      set({
        promptsError: err instanceof Error ? err.message : "Failed to load prompts",
        promptsLoading: false,
      });
    }
  },

  setPromptsOpen: (open) => set({ promptsOpen: open }),

  openPrompt: async (item) => {
    set({ activePromptLoading: true });
    try {
      const detail = await fetchPromptDetail(item.id);
      set({ activePrompt: detail, activePromptLoading: false });
    } catch {
      // Fall back to the list item if detail fetch fails.
      set({
        activePrompt: {
          ...item,
          content: "",
        },
        activePromptLoading: false,
      });
    }
  },

  clearActivePrompt: () => set({ activePrompt: null }),

  clearChat: () => set({ messages: [], mockMode: null }),

  sendMessage: async (text) => {
    const { isStreaming, activePrompt, messages } = get();
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: Message = {
      id: nextId(),
      role: "user",
      content: trimmed,
    };
    const assistantId = nextId();

    const history: ChatTurn[] = messages
      .filter((m) => !m.pending && !m.error)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    set({
      messages: [
        ...messages,
        userMessage,
        { id: assistantId, role: "assistant", content: "", pending: true },
      ],
      isStreaming: true,
      mockMode: null,
    });

    let accumulated = "";

    const finalize = () => {
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === assistantId ? { ...m, pending: false } : m
        ),
        isStreaming: false,
      }));
    };

    await streamChat({
      message: trimmed,
      promptTemplateContent: activePrompt?.content,
      promptTemplateName: activePrompt?.name,
      history,
      onMeta: (meta) => {
        if (typeof meta.mock === "boolean") set({ mockMode: meta.mock });
      },
      onDelta: (piece) => {
        accumulated += piece;
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === assistantId ? { ...m, content: accumulated } : m
          ),
        }));
      },
      onDone: finalize,
      onError: (message) => {
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === assistantId
              ? { ...m, pending: false, error: true, content: message }
              : m
          ),
        }));
        finalize();
      },
    });
  },

  selectAndRun: async (item, message = "Run the template against the document.") => {
    await get().openPrompt(item);
    await get().sendMessage(message);
  },

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));