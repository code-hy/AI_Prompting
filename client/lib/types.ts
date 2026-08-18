export interface PromptListItem {
  id: string;
  name: string;
  description: string;
  source: "bundled" | "github";
  category: string;
  content_url: string | null;
}

export interface PromptDetail extends PromptListItem {
  content: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
  error?: boolean;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}