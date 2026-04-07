import React from 'react';
import { 
  WalletOutlined, 
  TransactionOutlined, 
  MobileOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  LineChartOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

interface QuickAction {
  icon: React.ReactNode;
  text: string;
  gradient: string;
}

interface QuickActionsProps {
  onActionClick: (text: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onActionClick }) => {
  const quickActions: QuickAction[] = [
    {
      icon: <WalletOutlined />,
      text: "What's my balance?",
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <TransactionOutlined />,
      text: "Show me my transactions from last week",
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: <MobileOutlined />,
      text: "Find MTN data plans under 2000 naira",
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      icon: <DollarOutlined />,
      text: "How much did I spend on airtime this month?",
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: <CheckCircleOutlined />,
      text: "Is the data service available?",
      gradient: 'from-indigo-500 to-blue-500',
    },
    {
      icon: <LineChartOutlined />,
      text: "Show me my commission earnings",
      gradient: 'from-rose-500 to-red-500',
    },
    {
      icon: <ExclamationCircleOutlined />,
      text: "I need a refund for a transaction",
      gradient: 'from-amber-500 to-yellow-500',
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
            className={`group relative overflow-hidden bg-gradient-to-r ${action.gradient} p-4 rounded-xl text-white text-left transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl opacity-90 group-hover:scale-110 transition-transform duration-300">
                {action.icon}
              </div>
              <span className="text-sm font-medium leading-tight flex-1">
                {action.text}
              </span>
              <div className="text-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                →
              </div>
            </div>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          </button>
        ))}
      </div>

      <div className="text-center mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          💡 Tip: You can ask me anything about your transactions, balance, data plans, and more!
        </p>
      </div>
    </div>
  );
};

export default QuickActions;
