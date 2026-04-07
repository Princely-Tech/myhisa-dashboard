import React from 'react';
import { ReloadOutlined, CloseCircleOutlined } from '@ant-design/icons';

interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="flex items-start gap-3 mb-4 animate-shake">
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl bg-red-100 flex-shrink-0">
        <CloseCircleOutlined className="text-red-600" />
      </div>
      <div className="flex-1 max-w-[70%]">
        <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-red-50 border border-red-200">
          <p className="text-red-800 leading-6 mb-3">{message}</p>
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <ReloadOutlined className="animate-spin-slow" />
            Retry
          </button>
        </div>
        <div className="text-xs text-gray-500 px-2 mt-1">
          {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
