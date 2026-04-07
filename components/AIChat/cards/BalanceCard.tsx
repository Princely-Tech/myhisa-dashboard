import React from 'react';
import { WalletOutlined } from '@ant-design/icons';

interface Balance {
  balance: number;
  commission: number;
  bonus: number;
  account_number?: string;
  account_name?: string;
  bank_name?: string;
  is_active: boolean;
}

interface BalanceCardProps {
  balance: Balance;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ balance }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <WalletOutlined className="text-xl" /> Wallet Balance
          </h3>
          {!balance.is_active && (
            <span className="px-3 py-1 bg-yellow-500 bg-opacity-90 rounded-full text-xs font-semibold flex items-center gap-1">
              ⚠️ Inactive
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6 text-center">
          <span className="text-gray-600 text-sm block mb-2">Main Balance</span>
          <span className="text-4xl font-bold text-gray-900">
            ₦{balance.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <span className="text-gray-600 text-xs block mb-1">Commission</span>
            <span className="text-lg font-bold text-green-700">
              ₦{balance.commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <span className="text-gray-600 text-xs block mb-1">Bonus</span>
            <span className="text-lg font-bold text-blue-700">
              ₦{balance.bonus.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {balance.account_number && (
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Account Number:</span>
              <span className="font-mono font-semibold text-gray-900">{balance.account_number}</span>
            </div>
            {balance.account_name && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Account Name:</span>
                <span className="font-medium text-gray-900">{balance.account_name}</span>
              </div>
            )}
            {balance.bank_name && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Bank:</span>
                <span className="font-medium text-gray-900">{balance.bank_name}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* <div className="px-4 pb-4">
        <button className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all">
          Fund Wallet
        </button>
      </div> */}
    </div>
  );
};

export default BalanceCard;
