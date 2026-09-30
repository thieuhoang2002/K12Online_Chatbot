"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
  isDarkMode?: boolean;
}

export default function MarkdownRenderer({ content, isDarkMode = true }: MarkdownRendererProps) {
  return (
    <div
      className={`text-[13.5px] leading-relaxed break-words ${
        isDarkMode ? "text-slate-200" : "text-slate-800"
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1
              className={`text-base md:text-lg font-bold mt-4 mb-2 pb-1 border-b ${
                isDarkMode ? "text-sky-400 border-slate-800" : "text-sky-600 border-slate-200"
              }`}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className={`text-sm md:text-base font-bold mt-3 mb-1.5 ${
                isDarkMode ? "text-sky-300" : "text-sky-600"
              }`}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className={`text-[13.5px] font-bold mt-3 mb-1 uppercase tracking-wide ${
                isDarkMode ? "text-sky-400" : "text-sky-600"
              }`}
            >
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4
              className={`text-[13.5px] font-semibold mt-2.5 mb-1 ${
                isDarkMode ? "text-sky-300" : "text-sky-700"
              }`}
            >
              {children}
            </h4>
          ),
          p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
          strong: ({ children }) => (
            <strong
              className={`font-semibold ${
                isDarkMode ? "text-white" : "text-slate-900 font-bold"
              }`}
            >
              {children}
            </strong>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-5 space-y-1 my-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-5 space-y-1.5 my-2">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
          hr: () => (
            <hr
              className={`my-3.5 border-t ${
                isDarkMode ? "border-slate-800" : "border-slate-200"
              }`}
            />
          ),
          code: ({ children }) => (
            <code
              className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                isDarkMode
                  ? "bg-slate-800 text-amber-300"
                  : "bg-slate-100 text-amber-700 border border-slate-200"
              }`}
            >
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className={`border-l-4 pl-3 my-2 italic ${
                isDarkMode
                  ? "border-sky-500/50 text-slate-400"
                  : "border-sky-500 text-slate-600"
              }`}
            >
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
