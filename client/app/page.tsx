"use client";

import { useChatStore } from "@/store/chatStore";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";

export default function Home() {
  const { sidebarOpen, sidebarCollapsedDesktop } = useChatStore();

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => useChatStore.setState({ sidebarOpen: false })}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 md:static md:translate-x-0 md:transition-[width] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          sidebarCollapsedDesktop
            ? "md:w-0 md:overflow-hidden md:border-l-0"
            : "md:w-[260px]"
        }`}
      >
        <Sidebar />
      </aside>

      <main className="flex min-w-0 flex-1">
        <ChatWindow />
      </main>
    </div>
  );
}