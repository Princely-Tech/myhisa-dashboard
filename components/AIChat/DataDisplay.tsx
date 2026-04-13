import React from 'react';
import TransactionCard from './cards/TransactionCard';
import DataPlanCard from './cards/DataPlanCard';
import BalanceCard from './cards/BalanceCard';
import TicketCard from './cards/TicketCard';
import StatsCard from './cards/StatsCard';

interface DataDisplayProps {
  data: any[];
}

const DataDisplay: React.FC<DataDisplayProps> = ({ data }) => {
  const renderCard = (item: any, index: number) => {
    if (item.transaction_id) {
      return <TransactionCard key={index} transaction={item} />;
    }

    if (item.code && item.network && item.price) {
      return <DataPlanCard key={index} plan={item} />;
    }

    if (item.balance !== undefined && (item.account_number || item.commission !== undefined)) {
      return <BalanceCard key={index} balance={item} />;
    }

    if (item.ticket_code) {
      return <TicketCard key={index} ticket={item} />;
    }

    if (item.total_transactions !== undefined) {
      return <StatsCard key={index} stats={item} />;
    }

    if (Array.isArray(item.services) && item.services.length > 0) {
      return (
        <div
          key={index}
          className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <h4 className="font-semibold text-gray-900">
              Service Availability
            </h4>
            {item.message && (
              <span className="text-xs text-gray-600 text-right">
                {item.message}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {item.services.map((svc: any, svcIndex: number) => (
              <div
                key={svcIndex}
                className="p-3 rounded-lg border border-gray-100 bg-gray-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-gray-900">
                    {(svc.service ?? "service").toString().toUpperCase()} - {(
                      svc.provider ?? "provider"
                    )
                      .toString()
                      .toUpperCase()}
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${svc.available
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                      }`}
                  >
                    {svc.available ? "Available" : "Unavailable"}
                  </span>
                </div>

                <div className="mt-2 text-sm text-gray-700">
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-600">Percent:</span>
                    <span className="font-medium">{svc.percent}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (item.service && item.provider) {
      return (
        <div key={index} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-2">
            {item.service} - {item.provider}
          </h4>
          <p className="text-sm mb-1">
            Status: {item.available ? '✅ Available' : '❌ Unavailable'}
          </p>
          <p className="text-sm">Availability: {item.percent}%</p>
        </div>
      );
    }

    return (
      <div key={index} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <pre className="text-xs overflow-auto">{JSON.stringify(item, null, 2)}</pre>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((item, index) => renderCard(item, index))}
    </div>
  );
};

export default DataDisplay;
