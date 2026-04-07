import React from 'react';
import { SendOutlined } from '@ant-design/icons';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  disabled: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
  onKeyPress,
  disabled,
}) => {
  return (
    <div className="flex gap-3 p-4 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <textarea
        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-2xl text-base resize-none focus:outline-none focus:border-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder="Ask me anything... (e.g., 'What's my balance?')"
        disabled={disabled}
        rows={2}
      />
      <button
        className="w-12 h-12 border-none rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xl cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        onClick={onSend}
        disabled={disabled || !value.trim()}
      >
        {disabled ? '⏳' : <SendOutlined />}
      </button>
    </div>
  );
};

export default MessageInput;
