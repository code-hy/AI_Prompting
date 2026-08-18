"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mt-5 mb-2 text-xl font-bold text-slate-900 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-4 mb-2 text-lg font-bold text-slate-900">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 mb-1 text-base font-semibold text-slate-900">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="my-2 leading-relaxed text-slate-700 first:mt-0 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-2 ml-5 list-disc space-y-1 text-slate-700">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 ml-5 list-decimal space-y-1 text-slate-700">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  a: (props) => (
    <a
      {...props}
      className="text-violet-600 underline decoration-violet-300 underline-offset-2 hover:text-violet-700"
      target="_blank"
      rel="noreferrer"
    />
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-4 border-slate-200 pl-3 italic text-slate-500">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-slate-200" />,
  code: (props) => {
    const { inline, className, children } = props as {
      inline?: boolean;
      className?: string;
      children?: React.ReactNode;
    };
    const match = /language-(\w+)/.exec(className ?? "");
    if (inline) {
      return (
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[13px] text-violet-700">
          {children}
        </code>
      );
    }
    return (
      <pre className="my-3 overflow-x-auto rounded-lg bg-slate-900 p-3 text-[13px] leading-relaxed text-slate-100">
        <code className={match ? `language-${match[1]}` : ""}>{children}</code>
      </pre>
    );
  },
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-semibold text-slate-700">{children}</th>
  ),
  td: ({ children }) => <td className="px-3 py-2 align-top text-slate-700">{children}</td>,
  tr: ({ children }) => <tr className="divide-x divide-slate-200">{children}</tr>,
};

export default function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-sm max-w-none prose-p:my-2">
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}