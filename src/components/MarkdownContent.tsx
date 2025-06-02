import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark-dimmed.css';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          // Custom components for better styling
          h1: ({ node, ...props }) => (
            <h1 className="text-3xl font-bold mt-8 mb-4 text-indigo-700 dark:text-indigo-300" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-2xl font-bold mt-6 mb-3 text-indigo-600 dark:text-indigo-200" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xl font-semibold mt-5 mb-2 text-indigo-500 dark:text-indigo-100" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-200" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a 
              className="text-indigo-600 dark:text-indigo-400 hover:underline hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors" 
              target="_blank" 
              rel="noopener noreferrer"
              {...props} 
            />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-800 dark:text-gray-200" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-6 mb-4 space-y-1 text-gray-800 dark:text-gray-200" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="mb-1 pl-1" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote 
              className="border-l-4 border-indigo-400 pl-4 italic my-4 text-gray-700 dark:text-gray-300"
              {...props} 
            />
          ),
          code: ({ node, className, children, ...props }: { node?: any, className?: string, children: React.ReactNode, [key: string]: any }) => {
            const isInline = !className?.includes('language-');
            const match = /language-(\w+)/.exec(className || '');
            return !isInline ? (
              <pre className="rounded-lg overflow-x-auto bg-gray-900 p-4 my-4">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-100 dark:bg-gray-700" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200" {...props} />
          ),
          img: ({ node, ...props }) => (
            <div className="my-6">
              <img 
                className="rounded-lg shadow-lg w-full max-h-96 object-cover" 
                alt={props.alt || ''}
                {...props} 
              />
              {props.alt && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {props.alt}
                </p>
              )}
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
