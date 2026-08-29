'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

interface FormattedMessageProps {
  content: string;
  isUser?: boolean;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ content, isUser = false }) => {
  if (isUser) {
    return <div className="text-white text-[13px] leading-relaxed whitespace-pre-wrap">{content}</div>;
  }

  // Sanitize isolated stream artifacts
  const cleanContent = content.trim();

  if (!cleanContent) {
    return (
      <div className="flex items-center gap-2 py-1 text-slate-400 text-xs">
        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-ping" />
        <span>SetuSahayak is formulating comprehensive guidance...</span>
      </div>
    );
  }

  // Split text by double newlines into blocks (paragraphs, headings, lists)
  const blocks = cleanContent.split(/\n\s*\n/);

  return (
    <div className="space-y-3.5 text-[12.5px] sm:text-[13px] leading-relaxed text-slate-800 dark:text-slate-100 font-normal">
      {blocks.map((block, bIdx) => {
        const trimmedBlock = block.trim();
        if (!trimmedBlock) return null;

        // 1. Heading block: ### Title or ## Title or # Title
        if (/^#{1,4}\s+/.test(trimmedBlock)) {
          const headingText = trimmedBlock.replace(/^#{1,4}\s+/, '').trim();
          return (
            <h4
              key={bIdx}
              className="text-[13.5px] sm:text-[14px] font-bold text-slate-900 dark:text-amber-300 pt-2 pb-0.5 border-b border-slate-200 dark:border-slate-700/80 flex items-center gap-1.5"
            >
              <InlineRichText text={headingText} />
            </h4>
          );
        }

        // 2. Numbered Section Heading: e.g. "1. Legal Due Diligence & Title Verification"
        if (/^\d+\.\s+[A-Z]/.test(trimmedBlock) && !trimmedBlock.includes('\n')) {
          return (
            <h4
              key={bIdx}
              className="text-[13.5px] sm:text-[14px] font-bold text-slate-900 dark:text-amber-300 pt-2 pb-0.5 border-b border-slate-200 dark:border-slate-700/80"
            >
              <InlineRichText text={trimmedBlock} />
            </h4>
          );
        }

        // 3. List block (lines starting with •, -, *, or 1., 2.)
        const lines = trimmedBlock.split('\n');
        const isListBlock = lines.every((l) => /^[•\-\*]\s+|^\d+[\.\)]\s+/.test(l.trim()));

        if (isListBlock) {
          return (
            <ul key={bIdx} className="space-y-2 pl-1 my-1.5">
              {lines.map((line, lIdx) => {
                const cleanLine = line.trim().replace(/^[•\-\*]\s+|^\d+[\.\)]\s+/, '');
                return (
                  <li key={lIdx} className="flex items-start gap-2 text-[12.5px] sm:text-[13px] leading-relaxed">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-amber-400 shrink-0" />
                    <div className="flex-1">
                      <InlineRichText text={cleanLine} />
                    </div>
                  </li>
                );
              })}
            </ul>
          );
        }

        // 4. Mixed paragraph that may contain embedded bullet lines
        if (lines.length > 1 && lines.some((l) => /^[•\-\*]\s+|^\d+[\.\)]\s+/.test(l.trim()))) {
          return (
            <div key={bIdx} className="space-y-2">
              {lines.map((line, lIdx) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return null;

                if (/^[•\-\*]\s+|^\d+[\.\)]\s+/.test(trimmedLine)) {
                  const cleanLine = trimmedLine.replace(/^[•\-\*]\s+|^\d+[\.\)]\s+/, '');
                  return (
                    <div key={lIdx} className="flex items-start gap-2 pl-1 py-0.5 text-[12.5px] sm:text-[13px] leading-relaxed">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-amber-400 shrink-0" />
                      <div className="flex-1">
                        <InlineRichText text={cleanLine} />
                      </div>
                    </div>
                  );
                }

                if (/^#{1,4}\s+/.test(trimmedLine)) {
                  const headingText = trimmedLine.replace(/^#{1,4}\s+/, '').trim();
                  return (
                    <h4
                      key={lIdx}
                      className="text-[13.5px] sm:text-[14px] font-bold text-slate-900 dark:text-amber-300 pt-2 pb-0.5 border-b border-slate-200 dark:border-slate-700/80"
                    >
                      <InlineRichText text={headingText} />
                    </h4>
                  );
                }

                return (
                  <p key={lIdx} className="text-[12.5px] sm:text-[13px] leading-relaxed">
                    <InlineRichText text={trimmedLine} />
                  </p>
                );
              })}
            </div>
          );
        }

        // 5. Standard flowing narrative paragraph
        return (
          <p key={bIdx} className="text-[12.5px] sm:text-[13px] leading-relaxed">
            <InlineRichText text={trimmedBlock} />
          </p>
        );
      })}
    </div>
  );
};

// Helper for inline bold, links, and code
function InlineRichText({ text }: { text: string }) {
  // Regex to match markdown links [text](url) and bold **text**
  const regex = /(\[.*?\]\(https?:\/\/[^\s\)]+\)|\*\*.*?\*\*)/g;
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;

        // Match markdown link: [title](url)
        const linkMatch = part.match(/^\[(.*?)\]\((https?:\/\/[^\s\)]+)\)$/);
        if (linkMatch) {
          const [, linkTitle, linkUrl] = linkMatch;
          return (
            <a
              key={i}
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-700 dark:text-amber-300 font-semibold hover:underline bg-blue-50/90 dark:bg-slate-800/90 px-1.5 py-0.5 rounded border border-blue-200/80 dark:border-slate-700 mx-0.5 text-[11.5px] sm:text-[12px] align-baseline transition-colors"
            >
              <span>{linkTitle}</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-80 shrink-0 inline" />
            </a>
          );
        }

        // Match bold: **text**
        const boldMatch = part.match(/^\*\*(.*?)\*\*$/);
        if (boldMatch) {
          return (
            <strong key={i} className="font-bold text-slate-900 dark:text-white">
              {boldMatch[1]}
            </strong>
          );
        }

        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default FormattedMessage;
