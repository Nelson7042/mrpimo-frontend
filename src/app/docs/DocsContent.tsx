"use client";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github.css";

interface DocsContentProps {
  markdown: string;
  sectionId: string;
  onInternalLinkClick?: (filePath: string) => void;
}

export default function DocsContent({ markdown, sectionId, onInternalLinkClick }: DocsContentProps) {
  return (
    <article key={sectionId} className="docs-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold text-gray-800 mt-10 mb-4 pb-2 border-b border-gray-100">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-gray-800 mt-8 mb-3">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-medium text-gray-700 mt-6 mb-2">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-base font-medium text-gray-700 mt-4 mb-2">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-sm font-medium text-gray-600 mt-4 mb-1">
              {children}
            </h6>
          ),
          p: ({ children }) => (
            <p className="text-gray-700 leading-7 mb-4">{children}</p>
          ),
          a: ({ href, children }) => {
            // Intercept internal .md links
            const isInternalMd =
              href &&
              !href.startsWith("http") &&
              !href.startsWith("mailto:") &&
              href.endsWith(".md");

            if (isInternalMd && onInternalLinkClick) {
              const filePath = href.replace(/^\.\//, "");
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onInternalLinkClick(filePath);
                  }}
                  className="text-blue-600 hover:text-blue-800 underline underline-offset-2 cursor-pointer"
                >
                  {children}
                </button>
              );
            }

            return (
              <a
                href={href}
                className="text-blue-600 hover:text-blue-800 underline underline-offset-2"
                target={href?.startsWith("http") ? "_blank" : undefined}
                rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                {children}
              </a>
            );
          },
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 mb-4 text-gray-700 pl-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 mb-4 text-gray-700 pl-2">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-7">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-300 bg-blue-50 pl-4 py-2 my-4 text-gray-700 italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gray-100 bg-white">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-gray-50 transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-gray-600">{children}</td>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              );
            }
            return (
              <code className={`${className || ""} text-sm`} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 my-4 overflow-x-auto text-sm leading-relaxed">
              {children}
            </pre>
          ),
          hr: () => <hr className="my-8 border-gray-200" />,
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-600">{children}</em>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  );
}
