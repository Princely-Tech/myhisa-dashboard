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
