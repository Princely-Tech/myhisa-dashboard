import React from "react";
import { CheckCircleOutlined } from "@ant-design/icons";
import DataDisplay from "./DataDisplay";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

const normalizeMessageContent = (content: string): string => {
  return content
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\u003cbr\u003e/gi, "\n");
};

const renderMarkdown = (rawContent: string): React.ReactNode => {
  const content = normalizeMessageContent(rawContent);

  return (
    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ol:my-1 prose-ul:my-1 prose-li:my-0 prose-pre:my-2 prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-3 prose-pre:rounded-lg prose-code:before:content-none prose-code:after:content-none prose-table:my-2 prose-th:py-2 prose-td:py-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          p: ({ children }: { children?: React.ReactNode }) => (
            <p className="my-1 whitespace-pre-wrap">{children}</p>
          ),
          pre: ({ children }: { children?: React.ReactNode }) => (
            <pre className="overflow-auto">{children}</pre>
          ),
          table: ({ children }: { children?: React.ReactNode }) => (
            <div className="overflow-auto">
              <table className="w-full border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }: { children?: React.ReactNode }) => (
            <th className="border border-gray-200 bg-gray-50 px-2 text-left text-xs font-semibold text-gray-700">
              {children}
            </th>
          ),
          td: ({ children }: { children?: React.ReactNode }) => (
            <td className="border border-gray-200 px-2 text-xs text-gray-800 align-top">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  data?: any[];
  isSending?: boolean;
}

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="flex flex-col gap-4">
      {messages.map((message, index) => (
        <div key={message.id} className="flex flex-col gap-3">
          <div
            className={`flex gap-3 animate-slideIn ${message.role === "user" ? "flex-row-reverse" : ""
              }`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-md transition-all duration-300 ${message.role === "user"
                ? "bg-gray-200"
                : "bg-[#00acf8] text-white"
                } ${message.isSending ? "animate-pulse" : ""}`}
            >
              {message.role === "user" ? "👨‍" : "🤖"}
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <div
                className={`px-4 py-3 rounded-2xl break-words shadow-sm transition-all duration-300 hover:shadow-md ${message.role === "user"
                  ? "bg-[#4e37b2] text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-900 rounded-bl-sm border border-gray-200"
                  } ${message.isSending ? "opacity-70 animate-pulse" : ""}`}
              >
                <div className="leading-6">
                  {renderMarkdown(message.content)}
                </div>
                {message.isSending && (
                  <div className="flex items-center gap-2 mt-2 text-xs opacity-75">
                    <div className="flex gap-1">
                      <span
                        className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></span>
                      <span
                        className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "100ms" }}
                      ></span>
                      <span
                        className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "200ms" }}
                      ></span>
                    </div>
                    <span>Sending...</span>
                  </div>
                )}
              </div>
              <div
                className={`text-xs text-gray-500 px-2 flex items-center gap-1 ${message.role === "user" ? "justify-end" : ""
                  }`}
              >
                {!message.isSending && message.role === "user" && (
                  <CheckCircleOutlined className="text-green-500" />
                )}
                <span>{message.timestamp.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {message.data && message.data.length > 0 && (
            <div className="ml-[52px] animate-fadeIn">
              <DataDisplay data={message.data} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MessageList;
