import React from 'react';
import { EyeOutlined } from '@ant-design/icons';

interface Transaction {
  transaction_id: string;
  type: string;
  amount: number;
  fee: number;
  network: string;
  msisdn: string;
  status: string;
  created_at: string;
  external_ref?: string;
  description?: string;
}

interface TransactionCardProps {
  transaction: Transaction;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'successful':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'airtime':
        return '📞';
      case 'data':
        return '📱';
      case 'cable':
        return '📺';
      case 'electricity':
        return '⚡';
      default:
        return '💳';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getTypeIcon(transaction.type)}</span>
          <span className="font-semibold text-gray-900 uppercase">{transaction.type}</span>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
          {transaction.status}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">Amount:</span>
          <span className="font-bold text-lg text-gray-900">₦{transaction.amount.toLocaleString()}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">Network:</span>
          <span className="font-medium text-gray-900">{transaction.network.toUpperCase()}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">Phone:</span>
          <span className="font-medium text-gray-900">{transaction.msisdn}</span>
        </div>

        {transaction.description && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Description:</span>
            <span className="font-medium text-gray-900 text-right">{transaction.description}</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">Date:</span>
          <span className="font-medium text-gray-900 text-sm">
            {new Date(transaction.created_at).toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="text-gray-600 text-xs">Transaction ID:</span>
          <span className="font-mono text-xs text-gray-700">{transaction.transaction_id}</span>
        </div>
      </div>

      <div className="px-4 pb-4">
        <button className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
          <EyeOutlined /> View Details
        </button>
      </div>
    </div>
  );
};

export default TransactionCard;
