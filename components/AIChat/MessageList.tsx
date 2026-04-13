import React from "react";
import { CheckCircleOutlined } from "@ant-design/icons";
import DataDisplay from "./DataDisplay";

const normalizeMessageContent = (content: string): string => {
  return content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\u003cbr\u003e/gi, "\n");
};

const renderInlineBold = (content: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*|__)(.+?)\1/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const matchIndex = match.index;
    const fullMatch = match[0];
    const boldText = match[2] ?? "";

    if (matchIndex > lastIndex) {
      parts.push(content.slice(lastIndex, matchIndex));
    }

    parts.push(
      <strong key={`b-${matchIndex}`} className="font-semibold">
        {boldText}
      </strong>,
    );

    lastIndex = matchIndex + fullMatch.length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
};

const renderMarkdownLite = (rawContent: string): React.ReactNode => {
  // Supports:
  // - bold via **text** or __text__
  // - fenced code blocks ```lang ...```
  // - line breaks via \n (including converted <br>)
  // Intentionally does NOT render HTML.
  const content = normalizeMessageContent(rawContent);
  const nodes: React.ReactNode[] = [];

  const fenceRegex = /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const pushText = (text: string, keyPrefix: string) => {
    if (!text) return;
    nodes.push(
      <span key={`${keyPrefix}-${nodes.length}`} className="whitespace-pre-wrap">
        {renderInlineBold(text)}
      </span>,
    );
  };

  while ((match = fenceRegex.exec(content)) !== null) {
    const matchIndex = match.index;
    const lang = (match[1] ?? "").trim();
    const code = match[2] ?? "";

    pushText(content.slice(lastIndex, matchIndex), `t-${matchIndex}`);

    nodes.push(
      <pre
        key={`c-${matchIndex}`}
        className="mt-3 mb-1 p-3 rounded-lg bg-gray-900 text-gray-100 text-xs overflow-auto"
      >
        <code className={lang ? `language-${lang}` : undefined}>{code}</code>
      </pre>,
    );

    lastIndex = matchIndex + match[0].length;
  }

  pushText(content.slice(lastIndex), "t-end");

  return nodes.length > 0 ? nodes : renderInlineBold(content);
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
                <p className="leading-6 whitespace-pre-wrap">
                  {renderMarkdownLite(message.content)}
                </p>
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
