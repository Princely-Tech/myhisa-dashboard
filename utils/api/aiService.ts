import axios from 'axios';
import apiEndpoints from './apiEndpoints';

const API_BASE_URL = apiEndpoints.base;

const aiApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

aiApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(apiEndpoints.tokenSetUrl);
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

export interface ToolCallResult {
  tool_name: string;
  result: any;
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

export interface Ticket {
  id: number;
  ticket_code: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  source: string;
  assigned_to?: number;
  resolved_at?: string;
  resolved_by?: number;
  resolution?: string;
  created_at: string;
  updated_at: string;
  messages?: TicketMessage[];
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  user_id: number;
  message: string;
  is_staff: boolean;
  created_at: string;
}

export interface TicketListParams {
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreateTicketRequest {
  subject: string;
  description: string;
  category: 'ai_query' | 'transaction_issue' | 'data_plan_issue' | 'payment_issue' | 'general';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export const aiService = {
  chat: async (data: ChatRequest): Promise<ChatResponse> => {
    const response = await aiApi.post('/ai/chat', data);
    return response.data;
  },

  getTools: async () => {
    const response = await aiApi.get('/ai/tools');
    return response.data;
  },

  createTicket: async (data: CreateTicketRequest) => {
    const response = await aiApi.post('/tickets', data);
    return response.data;
  },

  getTickets: async (params?: TicketListParams) => {
    const response = await aiApi.get('/tickets', { params });
    return response.data;
  },

  getTicket: async (code: string) => {
    const response = await aiApi.get(`/tickets/${code}`);
    return response.data;
  },

  addTicketMessage: async (ticketId: number, message: string) => {
    const response = await aiApi.post(`/tickets/${ticketId}/messages`, { message });
    return response.data;
  },
};

export default aiService;
