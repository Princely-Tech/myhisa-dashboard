import React from 'react';
import { useRouter } from 'next/navigation';
import { EyeOutlined } from '@ant-design/icons';

interface Ticket {
  ticket_id: number;
  ticket_code: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  message: string;
}

interface TicketCardProps {
  ticket: Ticket;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket }) => {
  const router = useRouter();

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewTicket = () => {
    router.push(`/tickets/${ticket.ticket_code}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="flex items-center gap-2">
          <div className="text-2xl">🎫</div>
          <h3 className="text-lg font-semibold">Support Ticket Created</h3>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">Ticket Code:</span>
          <span className="font-mono font-bold text-indigo-600">{ticket.ticket_code}</span>
        </div>

        <div className="space-y-1">
          <span className="text-gray-600 text-sm block">Subject:</span>
          <span className="font-semibold text-gray-900 block">{ticket.subject}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
            {ticket.priority.toUpperCase()}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            {ticket.category.replace('_', ' ').toUpperCase()}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            {ticket.status.toUpperCase()}
          </span>
        </div>

        <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg line-clamp-3">
          {ticket.message}
        </p>
      </div>

      <div className="px-4 pb-4">
        <button 
          onClick={handleViewTicket}
          className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <EyeOutlined /> View Ticket
        </button>
      </div>
    </div>
  );
};

export default TicketCard;
