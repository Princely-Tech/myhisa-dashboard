import React from 'react';
import { ShoppingCartOutlined, InfoCircleOutlined } from '@ant-design/icons';

interface DataPlan {
  code: string;
  network: string;
  description: string;
  price: number;
  validity: string;
  bundle_type: string;
}

interface DataPlanCardProps {
  plan: DataPlan;
}

const DataPlanCard: React.FC<DataPlanCardProps> = ({ plan }) => {
  const getNetworkColor = (network: string) => {
    switch (network.toLowerCase()) {
      case 'mtn':
        return 'from-yellow-400 to-yellow-600';
      case 'glo':
        return 'from-green-400 to-green-600';
      case 'airtel':
        return 'from-red-400 to-red-600';
      case '9mobile':
        return 'from-emerald-400 to-emerald-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
      <div className={`p-4 bg-gradient-to-r ${getNetworkColor(plan.network)} text-white`}>
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg">{plan.network.toUpperCase()}</span>
          <span className="px-3 py-1 bg-white bg-opacity-30 rounded-full text-xs font-semibold">
            {plan.bundle_type}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4 min-h-[48px]">{plan.description}</h3>

        <div className="flex items-baseline justify-center mb-4">
          <span className="text-gray-600 text-xl">₦</span>
          <span className="text-4xl font-bold text-gray-900">{plan.price.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4 text-gray-600">
          <span className="text-lg">⏱️</span>
          <span className="font-medium">{plan.validity}</span>
        </div>
      </div>

      <div className="px-4 pb-4 flex gap-2">
        <button className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
          <ShoppingCartOutlined /> Buy Now
        </button>
        <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
          <InfoCircleOutlined />
        </button>
      </div>
    </div>
  );
};

export default DataPlanCard;
