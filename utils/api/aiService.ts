import axios from 'axios';
import apiEndpoints from './apiEndpoints';
import { forceReLogin } from '../session';

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

// A 401 here means the token itself is dead (expired/revoked), not just
// this one call unauthorized (that's a 403 - handled per-page) - same
// "wipe the session and send them back to log in" behavior AxiosHandler
// uses everywhere else, so this instance doesn't silently strand the user
// on a page where every action fails the same way.
aiApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      forceReLogin();
    }
    return Promise.reject(error);
  }
);

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

// Minimal shape of the User record the backend embeds on admin ticket
// responses (Preload("User")/"AssignedUser"/"ResolvedUser") - only what the
// ticket UI actually reads, not the full account model.
export interface TicketUserSummary {
  id: number;
  name: string;
  email: string;
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
  // Only present on admin endpoints (AdminGetTickets/AdminGetTicket) -
  // absent on the self-service /tickets responses.
  user?: TicketUserSummary;
  assigned_user?: TicketUserSummary;
  resolved_user?: TicketUserSummary;
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  user_id: number;
  message: string;
  is_staff: boolean;
  created_at: string;
  // Only present on admin endpoints (Preload("Messages.User")).
  user?: TicketUserSummary;
}

export interface TicketListParams {
  status?: string;
  page?: number;
  limit?: number;
}

export interface AdminTicketListParams extends TicketListParams {
  priority?: string;
  source?: string;
  category?: string;
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

  // Admin/staff ticket management - all gated server-side behind the
  // tickets.manage staff permission (see /admin/tickets* in main.go).
  adminGetTickets: async (params?: AdminTicketListParams) => {
    const response = await aiApi.get('/admin/tickets', { params });
    return response.data;
  },

  adminGetTicket: async (ticketId: number | string) => {
    const response = await aiApi.get(`/admin/tickets/${ticketId}`);
    return response.data;
  },

  adminUpdateTicketStatus: async (ticketId: number | string, status: string) => {
    const response = await aiApi.put(`/admin/tickets/${ticketId}/status`, { status });
    return response.data;
  },

  adminAssignTicket: async (ticketId: number | string, assignedTo: number) => {
    const response = await aiApi.put(`/admin/tickets/${ticketId}/assign`, { assigned_to: assignedTo });
    return response.data;
  },

  adminResolveTicket: async (ticketId: number | string, resolution: string) => {
    const response = await aiApi.put(`/admin/tickets/${ticketId}/resolve`, { resolution });
    return response.data;
  },

  adminReplyToTicket: async (ticketId: number | string, message: string) => {
    const response = await aiApi.post(`/admin/tickets/${ticketId}/messages`, { message });
    return response.data;
  },
};

export default aiService;
