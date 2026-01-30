'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import type { Components } from 'react-markdown';

interface MarkdownContentProps {
  content: string;
}

const components: Components = {
  // Paragraphs
  p: ({ children }) => (
    <p className="text-[15px] text-text-primary leading-relaxed mb-2 last:mb-0">
      {children}
    </p>
  ),

  // Bold
  strong: ({ children }) => (
    <strong className="font-semibold text-text-primary">{children}</strong>
  ),

  // Italic
  em: ({ children }) => (
    <em className="italic text-text-primary">{children}</em>
  ),

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent hover:text-accent/80 underline underline-offset-2 transition-colors"
    >
      {children}
    </a>
  ),

  // Inline code
  code: ({ className, children }) => {
    const isCodeBlock = className?.includes('language-');

    if (isCodeBlock) {
      return (
        <code className="block text-sm text-text-primary">
          {children}
        </code>
      );
    }

    return (
      <code className="bg-accent/20 text-accent px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    );
  },

  // Code blocks
  pre: ({ children }) => (
    <pre className="bg-bg-primary rounded-lg p-3 my-2 overflow-x-auto border border-white/10">
      {children}
    </pre>
  ),

  // Unordered lists
  ul: ({ children }) => (
    <ul className="list-disc list-inside space-y-1 my-2 text-[15px] text-text-primary">
      {children}
    </ul>
  ),

  // Ordered lists
  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-1 my-2 text-[15px] text-text-primary">
      {children}
    </ol>
  ),

  // List items
  li: ({ children }) => (
    <li className="text-text-primary leading-relaxed">{children}</li>
  ),

  // Blockquotes
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-accent pl-3 my-2 text-text-secondary italic">
      {children}
    </blockquote>
  ),

  // Tables
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table className="min-w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  ),

  thead: ({ children }) => (
    <thead className="bg-bg-primary">{children}</thead>
  ),

  tbody: ({ children }) => <tbody>{children}</tbody>,

  tr: ({ children }) => (
    <tr className="border-b border-white/10">{children}</tr>
  ),

  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-text-primary font-semibold">
      {children}
    </th>
  ),

  td: ({ children }) => (
    <td className="px-3 py-2 text-text-primary">{children}</td>
  ),

  // Headers
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-text-primary mt-3 mb-2">{children}</h1>
  ),

  h2: ({ children }) => (
    <h2 className="text-lg font-bold text-text-primary mt-3 mb-2">{children}</h2>
  ),

  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-text-primary mt-2 mb-1">{children}</h3>
  ),

  // Horizontal rule
  hr: () => <hr className="border-white/10 my-3" />,
};

export default function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
