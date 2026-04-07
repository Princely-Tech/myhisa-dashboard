import React from "react";
import { CheckCircleOutlined } from "@ant-design/icons";
import DataDisplay from "./DataDisplay";

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
            className={`flex gap-3 animate-slideIn ${
              message.role === "user" ? "flex-row-reverse" : ""
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-md transition-all duration-300 ${
                message.role === "user"
                  ? "bg-[#4e37b2] text-white"
                  : "bg-gray-200"
              } ${message.isSending ? "animate-pulse" : ""}`}
            >
              {message.role === "user" ? "👤" : "🤖"}
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <div
                className={`px-4 py-3 rounded-2xl break-words shadow-sm transition-all duration-300 hover:shadow-md ${
                  message.role === "user"
                    ? "bg-[#4e37b2] text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-900 rounded-bl-sm border border-gray-200"
                } ${message.isSending ? "opacity-70 animate-pulse" : ""}`}
              >
                <p className="leading-6 whitespace-pre-wrap">
                  {message.content}
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
                className={`text-xs text-gray-500 px-2 flex items-center gap-1 ${
                  message.role === "user" ? "justify-end" : ""
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
