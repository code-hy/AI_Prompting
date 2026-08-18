"use client";

import { FileText, Play, Pointer } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import type { PromptListItem } from "@/lib/types";

const DEMO_SCENARIOS: Array<{
  name: string;
  blurb: string;
  expect: string;
  match: (p: PromptListItem) => boolean;
}> = [
  {
    name: "Compliance & Evaluation Extractor",
    blurb: "Extract evaluation criteria, weightings and what the ATO is looking for.",
    expect: "Structured list over Goods/Services, Delivery/Management, Financials.",
    match: (p) => p.id === "compliance_evaluator",
  },
  {
    name: "Bidder Readiness Checklist",
    blurb: "Turn the RFQ into an actionable bidding checklist.",
    expect: "Markdown checklist with forms, security and the 7 Aug 2026 deadline.",
    match: (p) => p.id === "bidder_readiness_checklist",
  },
  {
    name: "Executive Summary Drafter",
    blurb: "Draft the Quote Response Form Executive Summary from your capability statement.",
    expect: "Detects missing capability context and asks instead of hallucinating.",
    match: (p) => p.id === "executive_summary_drafter",
  },
];

export default function EmptyState() {
  const { prompts, promptsLoading, selectAndRun, openPrompt } = useChatStore();

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-10">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
        <FileText className="h-6 w-6 text-violet-600" />
      </div>
      <h1 className="mt-4 text-center text-2xl font-bold text-slate-900">
        Prompt Engineering Demo
      </h1>
      <p className="mt-2 max-w-xl text-center text-sm leading-relaxed text-slate-500">
        Execute prompt templates from the GitHub prompt library against the
        pre-loaded <strong className="text-slate-700">SPC-17765 ATO Request for Quote</strong>.
        The meta-prompt validates template requirements against the document and refuses
        to hallucinate missing information.
      </p>

      <div className="mt-8 grid w-full gap-3">
        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Try a runnable demo scenario
        </p>
        {promptsLoading && (
          <p className="text-sm text-slate-400">Loading scenario prompts&hellip;</p>
        )}
        {DEMO_SCENARIOS.map((scenario) => {
          const prompt = prompts.find(scenario.match);
          return (
            <div
              key={scenario.name}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{scenario.name}</p>
                  <p className="mt-1 text-xs text-slate-600">{scenario.blurb}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Expect: {scenario.expect}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    disabled={!prompt}
                    onClick={() => prompt && void openPrompt(prompt)}
                    title="Select this template"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40"
                  >
                    <Pointer className="h-3.5 w-3.5" />
                    Select
                  </button>
                  <button
                    type="button"
                    disabled={!prompt}
                    onClick={() => prompt && void selectAndRun(prompt)}
                    title="Select and run now"
                    className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-40"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Run
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-xs text-slate-400">
        Full library (incl. live GitHub prompts) is in the <strong>Prompt Library</strong> sidebar.
      </p>
    </div>
  );
}