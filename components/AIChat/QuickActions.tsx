import React from "react";
import {
  ApiOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LockOutlined,
  MobileOutlined,
  PhoneOutlined,
  WalletOutlined,
} from "@ant-design/icons";

interface QuickAction {
  icon: React.ReactNode;
  text: string;
}

interface QuickActionsProps {
  onActionClick: (text: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onActionClick }) => {
  const quickActions: QuickAction[] = [
    {
      icon: <PhoneOutlined />,
      text: "How do I integrate airtime purchase API?",
    },
    {
      icon: <ApiOutlined />,
      text: "How do I integrate data bundle purchase?",
    },
    {
      icon: <LockOutlined />,
      text: "How do I authenticate API requests",
    },

    {
      icon: <WalletOutlined />,
      text: "What's my balance?",
    },
    {
      icon: <MobileOutlined />,
      text: "Find MTN data plans under 2000 naira",
    },
    {
      icon: <CheckCircleOutlined />,
      text: "Is the data service available?",
    },
    {
      icon: <ExclamationCircleOutlined />,
      text: "I need a refund for a transaction",
    },

  ];

  return (
    <div className="p-6 space-y-4 animate-fadeIn">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          👋 Hi! How can I help you today?
        </h3>
        <p className="text-gray-600 text-sm">
          Choose a quick action below or type your own question
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => onActionClick(action.text)}
            className={`group relative overflow-hidden bg-white p-4 rounded-xl text-left border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300 active:shadow-sm`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl text-gray-700 group-hover:scale-105 transition-transform duration-200">
                {action.icon}
              </div>
              <span className="text-sm font-medium leading-tight flex-1 text-gray-900">
                {action.text}
              </span>
              <div className="text-xl text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                →
              </div>
            </div>
            <div className="absolute inset-0 bg-gray-900 opacity-0 group-hover:opacity-[0.02] transition-opacity duration-200"></div>
          </button>
        ))}
      </div>

      <div className="text-center mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          💡 Tip: You can ask me anything about your transactions, balance, integrations, and more!
        </p>
      </div>
    </div>
  );
};

export default QuickActions;
