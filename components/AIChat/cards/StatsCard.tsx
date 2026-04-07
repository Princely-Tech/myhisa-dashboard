import React from 'react';

interface Stats {
  total_transactions: number;
  total_amount: number;
  successful: number;
  pending: number;
  failed: number;
  success_rate?: number;
  by_type?: Record<string, number>;
  by_network?: Record<string, number>;
}

interface StatsCardProps {
  stats: Stats;
}

const StatsCard: React.FC<StatsCardProps> = ({ stats }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          📊 Transaction Statistics
        </h3>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <span className="text-gray-600 text-sm block mb-1">Total Transactions</span>
            <span className="text-2xl font-bold text-indigo-600">{stats.total_transactions}</span>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <span className="text-gray-600 text-sm block mb-1">Total Amount</span>
            <span className="text-2xl font-bold text-purple-600">
              ₦{stats.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <span className="text-2xl mb-1 block">✅</span>
            <span className="text-gray-600 text-xs block mb-1">Successful</span>
            <span className="text-lg font-bold text-green-700">{stats.successful}</span>
          </div>

          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <span className="text-2xl mb-1 block">⏳</span>
            <span className="text-gray-600 text-xs block mb-1">Pending</span>
            <span className="text-lg font-bold text-yellow-700">{stats.pending}</span>
          </div>

          <div className="text-center p-3 bg-red-50 rounded-lg">
            <span className="text-2xl mb-1 block">❌</span>
            <span className="text-gray-600 text-xs block mb-1">Failed</span>
            <span className="text-lg font-bold text-red-700">{stats.failed}</span>
          </div>
        </div>

        {stats.success_rate !== undefined && (
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <span className="text-2xl mb-1 block">📈</span>
            <span className="text-gray-600 text-sm block mb-1">Success Rate</span>
            <span className="text-xl font-bold text-blue-700">{stats.success_rate.toFixed(1)}%</span>
          </div>
        )}

        {stats.by_type && Object.keys(stats.by_type).length > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">By Type</h4>
            <div className="space-y-2">
              {Object.entries(stats.by_type).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 capitalize">{type}:</span>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.by_network && Object.keys(stats.by_network).length > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">By Network</h4>
            <div className="space-y-2">
              {Object.entries(stats.by_network).map(([network, count]) => (
                <div key={network} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 uppercase">{network}:</span>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
