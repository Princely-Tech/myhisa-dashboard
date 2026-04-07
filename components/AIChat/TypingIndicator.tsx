import React from 'react';
import { BulbOutlined } from '@ant-design/icons';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start gap-3 mb-4 animate-fadeIn">
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex-shrink-0 animate-pulse-slow">
        <BulbOutlined className="text-indigo-600 animate-pulse" />
      </div>
      <div className="relative px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-50 rounded-2xl rounded-bl-sm shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
          <span className="text-xs text-gray-600 font-medium ml-2 animate-pulse">AI is thinking</span>
        </div>
        <div className="absolute -bottom-1 left-4 w-16 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export default TypingIndicator;
