import React from "react";
import { BulbOutlined } from "@ant-design/icons";

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start gap-3 mb-4 animate-fadeIn">
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl bg-blue-100 flex-shrink-0 animate-pulse-slow">
        <BulbOutlined className="text-[#00acf8] animate-pulse" />
      </div>
      <div className="relative px-4 py-3 bg-gray-100 rounded-2xl rounded-bl-sm shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span
              className="w-2 h-2 bg-[#00acf8] rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></span>
            <span
              className="w-2 h-2 bg-[#4e37b2] rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></span>
            <span
              className="w-2 h-2 bg-[#00acf8] rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></span>
          </div>
          <span className="text-xs text-gray-600 font-medium ml-2 animate-pulse">
            AI is thinking
          </span>
        </div>
        <div className="absolute -bottom-1 left-4 w-16 h-1 bg-[#4e37b2] rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export default TypingIndicator;
