# HISA AI Assistant - React Implementation Guide

## Overview

This guide provides comprehensive instructions for implementing the HISA AI Assistant in a React application. The AI chat interface allows users to query transactions, check balances, search data plans, and get instant answers through a conversational interface.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Integration](#api-integration)
3. [Component Structure](#component-structure)
4. [State Management](#state-management)
5. [UI Components](#ui-components)
6. [Data Type Handling](#data-type-handling)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│          React Application              │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      AI Chat Container            │ │
│  │  - Manages conversation state     │ │
│  │  - Handles API calls              │ │
│  │  - Processes tool results         │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      Message Components           │ │
│  │  - User messages                  │ │
│  │  - AI responses                   │ │
│  │  - Typing indicators              │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      Data Display Components      │ │
│  │  - Transaction cards              │ │
│  │  - Data plan cards                │ │
│  │  - Balance display                │ │
│  │  - Ticket confirmation            │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## API Integration

### Base Configuration

Create an API service file for the AI endpoints:

```typescript
// services/aiService.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const aiApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
aiApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  data: {
    message: string;
    data?: any[];
    tool_calls?: ToolCallResult[];
    metadata: {
      conversation_history: ChatMessage[];
      tokens_used: number;
    };
  };
}

export interface ToolCallResult {
  tool_name: string;
  result: any;
}

export const aiService = {
  // Send chat message
  chat: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await aiApi.post<ChatResponse>('/ai/chat', request);
    return response.data;
  },

  // Get available tools
  getTools: async () => {
    const response = await aiApi.get('/ai/tools');
    return response.data;
  },

  // Get user tickets
  getTickets: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await aiApi.get('/tickets', { params });
    return response.data;
  },

  // Get specific ticket
  getTicket: async (ticketCode: string) => {
    const response = await aiApi.get(`/tickets/${ticketCode}`);
    return response.data;
  },

  // Add message to ticket
  addTicketMessage: async (ticketId: number, message: string) => {
    const response = await aiApi.post(`/tickets/${ticketId}/messages`, { message });
    return response.data;
  },
};

export default aiService;
```

---

## Component Structure

### Main Chat Container

```typescript
// components/AIChat/AIChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { aiService, ChatMessage, ChatResponse } from '../../services/aiService';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import DataDisplay from './DataDisplay';
import TypingIndicator from './TypingIndicator';
import './AIChat.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any[];
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [displayData, setDisplayData] = useState<any[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiService.chat({
        message: input,
        history: conversationHistory,
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date(),
        data: response.data.data,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setConversationHistory(response.data.metadata.conversation_history);

      // Update display data if present
      if (response.data.data && response.data.data.length > 0) {
        setDisplayData(response.data.data);
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error.response?.data?.error || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="ai-chat-container">
      <div className="ai-chat-header">
        <h2>HISA AI Assistant</h2>
        <p>Ask me about your transactions, balance, data plans, and more!</p>
      </div>

      <div className="ai-chat-body">
        <MessageList messages={messages} />
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {displayData.length > 0 && (
        <div className="ai-data-display">
          <DataDisplay data={displayData} />
        </div>
      )}

      <MessageInput
        value={input}
        onChange={setInput}
        onSend={sendMessage}
        onKeyPress={handleKeyPress}
        disabled={isLoading}
      />
    </div>
  );
};

export default AIChat;
```

### Message List Component

```typescript
// components/AIChat/MessageList.tsx
import React from 'react';
import { Message } from './AIChat';
import './MessageList.css';

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="message-list">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`message ${message.role === 'user' ? 'user-message' : 'ai-message'}`}
        >
          <div className="message-avatar">
            {message.role === 'user' ? '👤' : '🤖'}
          </div>
          <div className="message-content">
            <div className="message-text">{message.content}</div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
```

### Message Input Component

```typescript
// components/AIChat/MessageInput.tsx
import React from 'react';
import './MessageInput.css';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  disabled: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
  onKeyPress,
  disabled,
}) => {
  return (
    <div className="message-input-container">
      <textarea
        className="message-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder="Ask me anything... (e.g., 'What's my balance?')"
        disabled={disabled}
        rows={2}
      />
      <button
        className="send-button"
        onClick={onSend}
        disabled={disabled || !value.trim()}
      >
        {disabled ? '⏳' : '📤'}
      </button>
    </div>
  );
};

export default MessageInput;
```

### Typing Indicator Component

```typescript
// components/AIChat/TypingIndicator.tsx
import React from 'react';
import './TypingIndicator.css';

const TypingIndicator: React.FC = () => {
  return (
    <div className="typing-indicator">
      <div className="typing-avatar">🤖</div>
      <div className="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
};

export default TypingIndicator;
```

---

## Data Type Handling

### Data Display Component

```typescript
// components/AIChat/DataDisplay.tsx
import React from 'react';
import TransactionCard from './cards/TransactionCard';
import DataPlanCard from './cards/DataPlanCard';
import BalanceCard from './cards/BalanceCard';
import TicketCard from './cards/TicketCard';
import StatsCard from './cards/StatsCard';
import './DataDisplay.css';

interface DataDisplayProps {
  data: any[];
}

const DataDisplay: React.FC<DataDisplayProps> = ({ data }) => {
  const renderCard = (item: any, index: number) => {
    // Transaction data
    if (item.transaction_id) {
      return <TransactionCard key={index} transaction={item} />;
    }

    // Data plan
    if (item.code && item.network) {
      return <DataPlanCard key={index} plan={item} />;
    }

    // Balance data
    if (item.balance !== undefined && item.account_number) {
      return <BalanceCard key={index} balance={item} />;
    }

    // Ticket data
    if (item.ticket_code) {
      return <TicketCard key={index} ticket={item} />;
    }

    // Statistics data
    if (item.total_transactions !== undefined) {
      return <StatsCard key={index} stats={item} />;
    }

    // Service availability
    if (item.service && item.provider) {
      return (
        <div key={index} className="service-card">
          <h4>{item.service} - {item.provider}</h4>
          <p>Status: {item.available ? '✅ Available' : '❌ Unavailable'}</p>
          <p>Availability: {item.percent}%</p>
        </div>
      );
    }

    // Generic data
    return (
      <div key={index} className="generic-card">
        <pre>{JSON.stringify(item, null, 2)}</pre>
      </div>
    );
  };

  return (
    <div className="data-display-grid">
      {data.map((item, index) => renderCard(item, index))}
    </div>
  );
};

export default DataDisplay;
```

### Transaction Card

```typescript
// components/AIChat/cards/TransactionCard.tsx
import React from 'react';
import './TransactionCard.css';

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
        return 'status-success';
      case 'pending':
        return 'status-pending';
      case 'failed':
        return 'status-failed';
      default:
        return 'status-unknown';
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
    <div className="transaction-card">
      <div className="transaction-header">
        <span className="transaction-icon">{getTypeIcon(transaction.type)}</span>
        <span className="transaction-type">{transaction.type.toUpperCase()}</span>
        <span className={`transaction-status ${getStatusColor(transaction.status)}`}>
          {transaction.status}
        </span>
      </div>

      <div className="transaction-body">
        <div className="transaction-detail">
          <span className="label">Amount:</span>
          <span className="value">₦{transaction.amount.toLocaleString()}</span>
        </div>

        <div className="transaction-detail">
          <span className="label">Network:</span>
          <span className="value">{transaction.network.toUpperCase()}</span>
        </div>

        <div className="transaction-detail">
          <span className="label">Phone:</span>
          <span className="value">{transaction.msisdn}</span>
        </div>

        {transaction.description && (
          <div className="transaction-detail">
            <span className="label">Description:</span>
            <span className="value">{transaction.description}</span>
          </div>
        )}

        <div className="transaction-detail">
          <span className="label">Date:</span>
          <span className="value">
            {new Date(transaction.created_at).toLocaleString()}
          </span>
        </div>

        <div className="transaction-detail">
          <span className="label">Transaction ID:</span>
          <span className="value transaction-id">{transaction.transaction_id}</span>
        </div>
      </div>

      <div className="transaction-footer">
        <button className="view-details-btn">View Details</button>
      </div>
    </div>
  );
};

export default TransactionCard;
```

### Data Plan Card

```typescript
// components/AIChat/cards/DataPlanCard.tsx
import React from 'react';
import './DataPlanCard.css';

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
        return 'network-mtn';
      case 'glo':
        return 'network-glo';
      case 'airtel':
        return 'network-airtel';
      case '9mobile':
        return 'network-9mobile';
      default:
        return 'network-default';
    }
  };

  return (
    <div className={`data-plan-card ${getNetworkColor(plan.network)}`}>
      <div className="plan-header">
        <span className="plan-network">{plan.network.toUpperCase()}</span>
        <span className="plan-type">{plan.bundle_type}</span>
      </div>

      <div className="plan-body">
        <h3 className="plan-description">{plan.description}</h3>

        <div className="plan-price">
          <span className="currency">₦</span>
          <span className="amount">{plan.price.toLocaleString()}</span>
        </div>

        <div className="plan-validity">
          <span className="validity-icon">⏱️</span>
          <span className="validity-text">{plan.validity}</span>
        </div>
      </div>

      <div className="plan-footer">
        <button className="buy-plan-btn">Buy Now</button>
        <button className="details-btn">Details</button>
      </div>
    </div>
  );
};

export default DataPlanCard;
```

### Balance Card

```typescript
// components/AIChat/cards/BalanceCard.tsx
import React from 'react';
import './BalanceCard.css';

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
    <div className="balance-card">
      <div className="balance-header">
        <h3>💰 Wallet Balance</h3>
        {!balance.is_active && (
          <span className="inactive-badge">⚠️ Inactive</span>
        )}
      </div>

      <div className="balance-main">
        <div className="balance-item primary">
          <span className="balance-label">Main Balance</span>
          <span className="balance-amount">
            ₦{balance.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="balance-grid">
          <div className="balance-item">
            <span className="balance-label">Commission</span>
            <span className="balance-amount">
              ₦{balance.commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="balance-item">
            <span className="balance-label">Bonus</span>
            <span className="balance-amount">
              ₦{balance.bonus.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {balance.account_number && (
        <div className="balance-account">
          <div className="account-detail">
            <span className="account-label">Account Number:</span>
            <span className="account-value">{balance.account_number}</span>
          </div>
          {balance.account_name && (
            <div className="account-detail">
              <span className="account-label">Account Name:</span>
              <span className="account-value">{balance.account_name}</span>
            </div>
          )}
          {balance.bank_name && (
            <div className="account-detail">
              <span className="account-label">Bank:</span>
              <span className="account-value">{balance.bank_name}</span>
            </div>
          )}
        </div>
      )}

      <div className="balance-footer">
        <button className="fund-wallet-btn">Fund Wallet</button>
      </div>
    </div>
  );
};

export default BalanceCard;
```

### Ticket Card

```typescript
// components/AIChat/cards/TicketCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TicketCard.css';

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
  const navigate = useNavigate();

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'priority-urgent';
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return 'priority-default';
    }
  };

  const handleViewTicket = () => {
    navigate(`/tickets/${ticket.ticket_code}`);
  };

  return (
    <div className="ticket-card">
      <div className="ticket-header">
        <div className="ticket-icon">🎫</div>
        <h3>Support Ticket Created</h3>
      </div>

      <div className="ticket-body">
        <div className="ticket-code">
          <span className="label">Ticket Code:</span>
          <span className="code">{ticket.ticket_code}</span>
        </div>

        <div className="ticket-subject">
          <span className="label">Subject:</span>
          <span className="value">{ticket.subject}</span>
        </div>

        <div className="ticket-badges">
          <span className={`badge priority-badge ${getPriorityColor(ticket.priority)}`}>
            {ticket.priority.toUpperCase()}
          </span>
          <span className="badge category-badge">
            {ticket.category.replace('_', ' ').toUpperCase()}
          </span>
          <span className="badge status-badge">
            {ticket.status.toUpperCase()}
          </span>
        </div>

        <p className="ticket-message">{ticket.message}</p>
      </div>

      <div className="ticket-footer">
        <button className="view-ticket-btn" onClick={handleViewTicket}>
          View Ticket
        </button>
      </div>
    </div>
  );
};

export default TicketCard;
```

### Statistics Card

```typescript
// components/AIChat/cards/StatsCard.tsx
import React from 'react';
import './StatsCard.css';

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
    <div className="stats-card">
      <div className="stats-header">
        <h3>📊 Transaction Statistics</h3>
      </div>

      <div className="stats-body">
        <div className="stats-summary">
          <div className="stat-item primary">
            <span className="stat-label">Total Transactions</span>
            <span className="stat-value">{stats.total_transactions}</span>
          </div>

          <div className="stat-item primary">
            <span className="stat-label">Total Amount</span>
            <span className="stat-value">
              ₦{stats.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-item success">
            <span className="stat-icon">✅</span>
            <span className="stat-label">Successful</span>
            <span className="stat-value">{stats.successful}</span>
          </div>

          <div className="stat-item pending">
            <span className="stat-icon">⏳</span>
            <span className="stat-label">Pending</span>
            <span className="stat-value">{stats.pending}</span>
          </div>

          <div className="stat-item failed">
            <span className="stat-icon">❌</span>
            <span className="stat-label">Failed</span>
            <span className="stat-value">{stats.failed}</span>
          </div>

          {stats.success_rate !== undefined && (
            <div className="stat-item rate">
              <span className="stat-icon">📈</span>
              <span className="stat-label">Success Rate</span>
              <span className="stat-value">{stats.success_rate.toFixed(1)}%</span>
            </div>
          )}
        </div>

        {stats.by_type && Object.keys(stats.by_type).length > 0 && (
          <div className="stats-breakdown">
            <h4>By Type</h4>
            <div className="breakdown-list">
              {Object.entries(stats.by_type).map(([type, count]) => (
                <div key={type} className="breakdown-item">
                  <span className="breakdown-label">{type}:</span>
                  <span className="breakdown-value">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.by_network && Object.keys(stats.by_network).length > 0 && (
          <div className="stats-breakdown">
            <h4>By Network</h4>
            <div className="breakdown-list">
              {Object.entries(stats.by_network).map(([network, count]) => (
                <div key={network} className="breakdown-item">
                  <span className="breakdown-label">{network.toUpperCase()}:</span>
                  <span className="breakdown-value">{count}</span>
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
```

---

## Styling (CSS)

### Main Chat Container Styles

```css
/* components/AIChat/AIChat.css */
.ai-chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  background: #f5f7fa;
}

.ai-chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.ai-chat-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.ai-chat-header p {
  margin: 0;
  opacity: 0.9;
  font-size: 0.9rem;
}

.ai-chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: white;
}

.ai-data-display {
  max-height: 400px;
  overflow-y: auto;
  padding: 1rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

/* Scrollbar styling */
.ai-chat-body::-webkit-scrollbar,
.ai-data-display::-webkit-scrollbar {
  width: 8px;
}

.ai-chat-body::-webkit-scrollbar-track,
.ai-data-display::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.ai-chat-body::-webkit-scrollbar-thumb,
.ai-data-display::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.ai-chat-body::-webkit-scrollbar-thumb:hover,
.ai-data-display::-webkit-scrollbar-thumb:hover {
  background: #555;
}

@media (max-width: 768px) {
  .ai-chat-container {
    height: 100vh;
    max-width: 100%;
  }

  .ai-chat-header h2 {
    font-size: 1.2rem;
  }

  .ai-data-display {
    max-height: 300px;
  }
}
```

### Message List Styles

```css
/* components/AIChat/MessageList.css */
.message-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  display: flex;
  gap: 0.75rem;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  background: #f3f4f6;
}

.user-message .message-avatar {
  background: #667eea;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.message-text {
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  background: #f3f4f6;
  color: #1f2937;
  line-height: 1.5;
  word-wrap: break-word;
}

.user-message .message-text {
  background: #667eea;
  color: white;
  border-bottom-right-radius: 0.25rem;
}

.ai-message .message-text {
  border-bottom-left-radius: 0.25rem;
}

.message-timestamp {
  font-size: 0.75rem;
  color: #9ca3af;
  padding: 0 0.5rem;
}

.user-message .message-timestamp {
  text-align: right;
}

@media (max-width: 768px) {
  .message-content {
    max-width: 85%;
  }

  .message-avatar {
    width: 32px;
    height: 32px;
    font-size: 1.2rem;
  }
}
```

### Message Input Styles

```css
/* components/AIChat/MessageInput.css */
.message-input-container {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.message-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 1rem;
  font-size: 1rem;
  font-family: inherit;
  resize: none;
  transition: border-color 0.2s;
}

.message-input:focus {
  outline: none;
  border-color: #667eea;
}

.message-input:disabled {
  background: #f9fafb;
  cursor: not-allowed;
}

.send-button {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-button:hover:not(:disabled) {
  transform: scale(1.05);
}

.send-button:active:not(:disabled) {
  transform: scale(0.95);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .message-input-container {
    padding: 0.75rem;
  }

  .send-button {
    width: 44px;
    height: 44px;
  }
}
```

### Typing Indicator Styles

```css
/* components/AIChat/TypingIndicator.css */
.typing-indicator {
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem 0;
  animation: fadeIn 0.3s ease-in;
}

.typing-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: #f3f4f6;
  flex-shrink: 0;
}

.typing-dots {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  background: #f3f4f6;
  border-radius: 1rem;
  border-bottom-left-radius: 0.25rem;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #9ca3af;
  animation: typing 1.4s infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}
```

### Data Display Grid Styles

```css
/* components/AIChat/DataDisplay.css */
.data-display-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  padding: 0.5rem 0;
}

@media (max-width: 768px) {
  .data-display-grid {
    grid-template-columns: 1fr;
  }
}
```

### Card Styles

```css
/* components/AIChat/cards/TransactionCard.css */
.transaction-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.transaction-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.transaction-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.transaction-icon {
  font-size: 1.5rem;
}

.transaction-type {
  flex: 1;
  font-weight: 600;
  color: #1f2937;
}

.transaction-status {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-success {
  background: #d1fae5;
  color: #065f46;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-failed {
  background: #fee2e2;
  color: #991b1b;
}

.status-unknown {
  background: #e5e7eb;
  color: #6b7280;
}

.transaction-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.transaction-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.transaction-detail .label {
  color: #6b7280;
  font-weight: 500;
}

.transaction-detail .value {
  color: #1f2937;
  font-weight: 600;
}

.transaction-id {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
}

.transaction-footer {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

.view-details-btn {
  width: 100%;
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.view-details-btn:hover {
  background: #5568d3;
}
```

```css
/* components/AIChat/cards/DataPlanCard.css */
.data-plan-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  border-top: 4px solid;
}

.data-plan-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.network-mtn {
  border-top-color: #ffcc00;
}

.network-glo {
  border-top-color: #00b140;
}

.network-airtel {
  border-top-color: #ed1c24;
}

.network-9mobile {
  border-top-color: #006f3f;
}

.network-default {
  border-top-color: #667eea;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.plan-network {
  font-weight: 700;
  font-size: 1rem;
  color: #1f2937;
}

.plan-type {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: #f3f4f6;
  border-radius: 0.5rem;
  color: #6b7280;
}

.plan-body {
  margin-bottom: 1rem;
}

.plan-description {
  font-size: 0.9rem;
  color: #4b5563;
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.plan-price {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.plan-price .currency {
  font-size: 1rem;
  color: #6b7280;
}

.plan-price .amount {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
}

.plan-validity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.plan-footer {
  display: flex;
  gap: 0.5rem;
}

.buy-plan-btn,
.details-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.buy-plan-btn {
  background: #667eea;
  color: white;
}

.buy-plan-btn:hover {
  background: #5568d3;
}

.details-btn {
  background: #f3f4f6;
  color: #4b5563;
}

.details-btn:hover {
  background: #e5e7eb;
}
```

```css
/* components/AIChat/cards/BalanceCard.css */
.balance-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.balance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.balance-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.inactive-badge {
  padding: 0.25rem 0.75rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.balance-main {
  margin-bottom: 1.5rem;
}

.balance-item {
  margin-bottom: 1rem;
}

.balance-item.primary {
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.balance-label {
  display: block;
  font-size: 0.875rem;
  opacity: 0.9;
  margin-bottom: 0.25rem;
}

.balance-amount {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
}

.balance-item.primary .balance-amount {
  font-size: 2rem;
}

.balance-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1rem;
}

.balance-account {
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.account-detail {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.account-detail:last-child {
  margin-bottom: 0;
}

.account-label {
  opacity: 0.9;
}

.account-value {
  font-weight: 600;
}

.balance-footer {
  margin-top: 1rem;
}

.fund-wallet-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 0.5rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s;
}

.fund-wallet-btn:hover {
  transform: scale(1.02);
}
```

```css
/* components/AIChat/cards/TicketCard.css */
.ticket-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #667eea;
}

.ticket-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.ticket-icon {
  font-size: 2rem;
}

.ticket-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
}

.ticket-body {
  margin-bottom: 1rem;
}

.ticket-code {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.ticket-code .label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  font-weight: 600;
}

.ticket-code .code {
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  font-weight: 700;
  color: #667eea;
}

.ticket-subject {
  margin-bottom: 1rem;
}

.ticket-subject .label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.ticket-subject .value {
  font-size: 1rem;
  color: #1f2937;
  font-weight: 600;
}

.ticket-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.priority-badge.priority-urgent {
  background: #fee2e2;
  color: #991b1b;
  animation: pulse 2s infinite;
}

.priority-badge.priority-high {
  background: #fef3c7;
  color: #92400e;
}

.priority-badge.priority-medium {
  background: #dbeafe;
  color: #1e40af;
}

.priority-badge.priority-low {
  background: #e5e7eb;
  color: #6b7280;
}

.category-badge {
  background: #f3f4f6;
  color: #4b5563;
}

.status-badge {
  background: #d1fae5;
  color: #065f46;
}

.ticket-message {
  color: #4b5563;
  line-height: 1.6;
  font-size: 0.875rem;
}

.ticket-footer {
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.view-ticket-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.view-ticket-btn:hover {
  background: #5568d3;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
```

```css
/* components/AIChat/cards/StatsCard.css */
.stats-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.stats-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
}

.stats-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-item.primary {
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
}

.stat-item.primary .stat-label {
  opacity: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stats-grid .stat-item {
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
}

.stat-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.stats-grid .stat-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.stats-grid .stat-value {
  font-size: 1.25rem;
  color: #1f2937;
}

.stat-item.success {
  background: #d1fae5;
}

.stat-item.pending {
  background: #fef3c7;
}

.stat-item.failed {
  background: #fee2e2;
}

.stat-item.rate {
  background: #dbeafe;
}

.stats-breakdown {
  margin-bottom: 1rem;
}

.stats-breakdown h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: #1f2937;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 0.25rem;
}

.breakdown-label {
  color: #6b7280;
  font-size: 0.875rem;
}

.breakdown-value {
  color: #1f2937;
  font-weight: 600;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .stats-summary {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
}
```

---

## Error Handling

### Error Boundary Component

```typescript
// components/AIChat/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AI Chat Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>🤖 Oops! Something went wrong</h2>
          <p>The AI assistant encountered an error. Please refresh the page and try again.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### Usage with Error Boundary

```typescript
// App.tsx or parent component
import ErrorBoundary from './components/AIChat/ErrorBoundary';
import AIChat from './components/AIChat/AIChat';

function App() {
  return (
    <ErrorBoundary>
      <AIChat />
    </ErrorBoundary>
  );
}
```

---

## Best Practices

### 1. **Performance Optimization**

```typescript
// Use React.memo for expensive components
const TransactionCard = React.memo<TransactionCardProps>(({ transaction }) => {
  // Component implementation
});

// Debounce input for better performance
import { debounce } from 'lodash';

const debouncedSend = debounce((message: string) => {
  // Send message
}, 300);
```

### 2. **Accessibility**

```typescript
// Add ARIA labels
<div role="log" aria-live="polite" aria-label="Chat messages">
  <MessageList messages={messages} />
</div>

// Keyboard navigation
<button
  aria-label="Send message"
  onClick={sendMessage}
  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
>
  Send
</button>
```

### 3. **Loading States**

```typescript
// Show skeleton loaders while data is loading
{isLoading && (
  <div className="skeleton-loader">
    <div className="skeleton-avatar"></div>
    <div className="skeleton-text"></div>
  </div>
)}
```

### 4. **Error Handling**

```typescript
// Handle different error types
try {
  const response = await aiService.chat(request);
} catch (error: any) {
  if (error.response?.status === 401) {
    // Redirect to login
    navigate('/login');
  } else if (error.response?.status === 429) {
    // Rate limit error
    showToast('Too many requests. Please wait a moment.');
  } else {
    // Generic error
    showToast('An error occurred. Please try again.');
  }
}
```

### 5. **State Persistence**

```typescript
// Save conversation history to localStorage
useEffect(() => {
  localStorage.setItem('ai-chat-history', JSON.stringify(messages));
}, [messages]);

// Load on mount
useEffect(() => {
  const saved = localStorage.getItem('ai-chat-history');
  if (saved) {
    setMessages(JSON.parse(saved));
  }
}, []);
```

---

## Testing

### Unit Tests Example

```typescript
// AIChat.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIChat from './AIChat';
import { aiService } from '../../services/aiService';

jest.mock('../../services/aiService');

describe('AIChat', () => {
  it('renders chat interface', () => {
    render(<AIChat />);
    expect(screen.getByText('HISA AI Assistant')).toBeInTheDocument();
  });

  it('sends message on button click', async () => {
    const mockResponse = {
      data: {
        message: 'Your balance is ₦10,000',
        metadata: { conversation_history: [], tokens_used: 50 },
      },
    };

    (aiService.chat as jest.Mock).mockResolvedValue(mockResponse);

    render(<AIChat />);
    
    const input = screen.getByPlaceholderText(/Ask me anything/i);
    const sendButton = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'What is my balance?' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Your balance is ₦10,000')).toBeInTheDocument();
    });
  });
});
```

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] API base URL set correctly
- [ ] Authentication token handling implemented
- [ ] Error boundaries in place
- [ ] Loading states implemented
- [ ] Responsive design tested
- [ ] Accessibility features added
- [ ] Performance optimized
- [ ] Unit tests written
- [ ] Integration tests completed

---

## Support & Resources

- **API Documentation**: `/docs/AI/AI_SETUP.md`
- **User Guide**: `/docs/AI/AI_USER_GUIDE.md`
- **Backend Repository**: Contact development team
- **Support**: Create a ticket through the AI assistant

---

**Version**: 1.0.0  
**Last Updated**: January 2024
