# HISA Ticket System - API Reference

Complete API documentation for the support ticket system.

## Base URL

```
http://localhost:8080/api
```

## Authentication

All endpoints require JWT authentication via Bearer token:

```
Authorization: Bearer <your-jwt-token>
```

---

## User Endpoints

### 1. Create Ticket

Create a new support ticket manually.

**Endpoint:** `POST /tickets`

**Request Body:**

```json
{
  "subject": "Failed transaction needs refund",
  "description": "My transaction TXN123456 failed but I was debited. Please help with a refund.",
  "category": "transaction_issue",
  "priority": "high"
}
```

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| subject | string | Yes | Ticket subject (5-255 characters) |
| description | string | Yes | Detailed description (minimum 10 characters) |
| category | string | Yes | One of: `ai_query`, `transaction_issue`, `data_plan_issue`, `payment_issue`, `general` |
| priority | string | No | One of: `low`, `medium`, `high`, `urgent` (default: `medium`) |

**Response:**

```json
{
  "data": {
    "id": 1,
    "ticket_code": "TKT-1705432100-123",
    "subject": "Failed transaction needs refund",
    "description": "My transaction TXN123456 failed but I was debited. Please help with a refund.",
    "category": "transaction_issue",
    "priority": "high",
    "status": "open",
    "source": "manual",
    "assigned_to": null,
    "resolved_at": null,
    "resolved_by": null,
    "resolution": null,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "messages": [
      {
        "id": 1,
        "ticket_id": 1,
        "user_id": 123,
        "message": "My transaction TXN123456 failed but I was debited. Please help with a refund.",
        "is_staff": false,
        "created_at": "2024-01-15T10:30:00Z"
      }
    ]
  },
  "message": "Ticket created successfully. Our support team will review it shortly."
}
```

**Status Codes:**

- `201 Created` - Ticket created successfully
- `400 Bad Request` - Invalid request body or validation error
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Server error

**Example cURL:**

```bash
curl -X POST http://localhost:8080/api/tickets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Failed transaction needs refund",
    "description": "My transaction TXN123456 failed but I was debited. Please help with a refund.",
    "category": "transaction_issue",
    "priority": "high"
  }'
```

**Example JavaScript:**

```javascript
const createTicket = async (ticketData) => {
  const response = await fetch('/api/tickets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ticketData),
  });
  return response.json();
};

// Usage
const ticket = await createTicket({
  subject: "Failed transaction needs refund",
  description: "My transaction TXN123456 failed but I was debited.",
  category: "transaction_issue",
  priority: "high"
});
```

---

### 2. Get My Tickets

Retrieve all tickets created by the authenticated user.

**Endpoint:** `GET /tickets`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status: `open`, `in_progress`, `resolved`, `closed` |
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Items per page (default: 20, max: 100) |

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "ticket_code": "TKT-1705432100-123",
      "subject": "Failed transaction needs refund",
      "description": "My transaction TXN123456 failed but I was debited.",
      "category": "transaction_issue",
      "priority": "high",
      "status": "open",
      "source": "manual",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "messages": [...]
    },
    {
      "id": 2,
      "ticket_code": "TKT-1705432200-123",
      "subject": "Question about data plans",
      "description": "I need help understanding the MTN data plans.",
      "category": "data_plan_issue",
      "priority": "medium",
      "status": "in_progress",
      "source": "ai",
      "created_at": "2024-01-15T11:00:00Z",
      "updated_at": "2024-01-15T11:30:00Z",
      "messages": [...]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

**Example cURL:**

```bash
curl -X GET "http://localhost:8080/api/tickets?status=open&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example JavaScript:**

```javascript
const getMyTickets = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/tickets?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
};

// Usage
const tickets = await getMyTickets({ status: 'open', page: 1, limit: 20 });
```

---

### 3. Get Specific Ticket

Retrieve details of a specific ticket by ticket code.

**Endpoint:** `GET /tickets/:code`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| code | string | Yes | Ticket code (e.g., TKT-1705432100-123) |

**Response:**

```json
{
  "data": {
    "id": 1,
    "ticket_code": "TKT-1705432100-123",
    "subject": "Failed transaction needs refund",
    "description": "My transaction TXN123456 failed but I was debited.",
    "category": "transaction_issue",
    "priority": "high",
    "status": "in_progress",
    "source": "manual",
    "assigned_to": 5,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T11:00:00Z",
    "messages": [
      {
        "id": 1,
        "ticket_id": 1,
        "user_id": 123,
        "message": "My transaction TXN123456 failed but I was debited.",
        "is_staff": false,
        "created_at": "2024-01-15T10:30:00Z",
        "user": {
          "id": 123,
          "name": "John Doe",
          "email": "john@example.com"
        }
      },
      {
        "id": 2,
        "ticket_id": 1,
        "user_id": 5,
        "message": "We are looking into this issue. Please provide your transaction reference.",
        "is_staff": true,
        "created_at": "2024-01-15T10:45:00Z",
        "user": {
          "id": 5,
          "name": "Support Agent",
          "email": "support@hisa.com"
        }
      },
      {
        "id": 3,
        "ticket_id": 1,
        "user_id": 123,
        "message": "The transaction reference is TXN123456",
        "is_staff": false,
        "created_at": "2024-01-15T10:50:00Z",
        "user": {
          "id": 123,
          "name": "John Doe",
          "email": "john@example.com"
        }
      }
    ]
  }
}
```

**Status Codes:**

- `200 OK` - Success
- `404 Not Found` - Ticket not found or doesn't belong to user
- `401 Unauthorized` - Missing or invalid token

**Example cURL:**

```bash
curl -X GET http://localhost:8080/api/tickets/TKT-1705432100-123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example JavaScript:**

```javascript
const getTicket = async (ticketCode) => {
  const response = await fetch(`/api/tickets/${ticketCode}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
};

// Usage
const ticket = await getTicket('TKT-1705432100-123');
```

---

### 4. Add Message to Ticket

Add a message/reply to an existing ticket.

**Endpoint:** `POST /tickets/:id/messages`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Ticket ID (not ticket code) |

**Request Body:**

```json
{
  "message": "The transaction reference is TXN123456. Please help."
}
```

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message | string | Yes | Message content |

**Response:**

```json
{
  "data": {
    "id": 3,
    "ticket_id": 1,
    "user_id": 123,
    "message": "The transaction reference is TXN123456. Please help.",
    "is_staff": false,
    "created_at": "2024-01-15T10:50:00Z"
  },
  "message": "Message added successfully"
}
```

**Status Codes:**

- `200 OK` - Message added successfully
- `400 Bad Request` - Invalid request body
- `404 Not Found` - Ticket not found or doesn't belong to user
- `401 Unauthorized` - Missing or invalid token

**Example cURL:**

```bash
curl -X POST http://localhost:8080/api/tickets/1/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "The transaction reference is TXN123456. Please help."
  }'
```

**Example JavaScript:**

```javascript
const addTicketMessage = async (ticketId, message) => {
  const response = await fetch(`/api/tickets/${ticketId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });
  return response.json();
};

// Usage
const reply = await addTicketMessage(1, "The transaction reference is TXN123456");
```

---

## Admin Endpoints

All admin endpoints require staff or admin role.

### 5. Get All Tickets (Admin)

**Endpoint:** `GET /admin/tickets`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status |
| priority | string | No | Filter by priority |
| source | string | No | Filter by source: `ai`, `manual` |
| category | string | No | Filter by category |
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Items per page (default: 20, max: 100) |

**Response:** Same as user tickets endpoint but includes all users' tickets with user details.

---

### 6. Get Ticket Details (Admin)

**Endpoint:** `GET /admin/tickets/:id`

**Response:** Same as user ticket endpoint but includes full user details and assignment information.

---

### 7. Update Ticket Status (Admin)

**Endpoint:** `PUT /admin/tickets/:id/status`

**Request Body:**

```json
{
  "status": "in_progress"
}
```

**Valid Status Values:**
- `open`
- `in_progress`
- `resolved`
- `closed`

---

### 8. Assign Ticket (Admin)

**Endpoint:** `PUT /admin/tickets/:id/assign`

**Request Body:**

```json
{
  "assigned_to": 5
}
```

---

### 9. Resolve Ticket (Admin)

**Endpoint:** `PUT /admin/tickets/:id/resolve`

**Request Body:**

```json
{
  "resolution": "Issue has been resolved. Transaction was successfully processed and refund initiated."
}
```

---

### 10. Reply to Ticket (Admin)

**Endpoint:** `POST /admin/tickets/:id/messages`

**Request Body:**

```json
{
  "message": "We are looking into this issue and will update you shortly."
}
```

---

## Data Types

### Ticket Object

```typescript
interface Ticket {
  id: number;
  ticket_code: string;
  subject: string;
  description: string;
  category: 'ai_query' | 'transaction_issue' | 'data_plan_issue' | 'payment_issue' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  source: 'ai' | 'manual';
  assigned_to?: number;
  resolved_at?: string;
  resolved_by?: number;
  resolution?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  user?: User;
  assigned_user?: User;
  resolved_user?: User;
  messages?: TicketMessage[];
}
```

### TicketMessage Object

```typescript
interface TicketMessage {
  id: number;
  ticket_id: number;
  user_id: number;
  message: string;
  is_staff: boolean;
  created_at: string;
  user?: User;
  ticket?: Ticket;
}
```

### User Object (Simplified)

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}
```

---

## Category Descriptions

| Category | Description | Example Use Cases |
|----------|-------------|-------------------|
| `ai_query` | Questions or issues related to AI assistant | AI gave wrong information, AI not responding |
| `transaction_issue` | Problems with transactions | Failed transaction, wrong amount debited, refund request |
| `data_plan_issue` | Issues with data plans or bundles | Data not received, wrong plan activated |
| `payment_issue` | Payment or wallet related problems | Payment failed, wallet not credited |
| `general` | General inquiries or other issues | Account questions, feature requests |

---

## Priority Levels

| Priority | Description | Response Time |
|----------|-------------|---------------|
| `low` | Minor issues, general questions | 48-72 hours |
| `medium` | Standard issues (default) | 24-48 hours |
| `high` | Important issues affecting service | 12-24 hours |
| `urgent` | Critical issues requiring immediate attention | 2-4 hours |

---

## Status Flow

```
open → in_progress → resolved → closed
  ↓         ↓           ↓
  └─────────┴───────────┘
       (can reopen)
```

- **open** - Ticket created, awaiting review
- **in_progress** - Ticket assigned and being worked on
- **resolved** - Issue resolved, awaiting user confirmation
- **closed** - Ticket closed and archived

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common Error Messages:**

- `"User not authenticated"` - Missing or invalid auth token
- `"Invalid request body"` - Malformed JSON or missing required fields
- `"Ticket not found"` - Ticket doesn't exist or user doesn't have access
- `"Invalid category. Must be one of: ..."` - Invalid category value
- `"Invalid priority. Must be one of: ..."` - Invalid priority value
- `"Failed to create ticket"` - Server error during creation
- `"Failed to add message"` - Server error during message creation

---

## Complete React Example

```typescript
// services/ticketService.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const ticketApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
ticketApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface CreateTicketRequest {
  subject: string;
  description: string;
  category: 'ai_query' | 'transaction_issue' | 'data_plan_issue' | 'payment_issue' | 'general';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
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
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export const ticketService = {
  // Create a new ticket
  createTicket: async (data: CreateTicketRequest) => {
    const response = await ticketApi.post<{ data: Ticket; message: string }>('/tickets', data);
    return response.data;
  },

  // Get user's tickets
  getMyTickets: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await ticketApi.get<{ data: Ticket[]; meta: any }>('/tickets', { params });
    return response.data;
  },

  // Get specific ticket
  getTicket: async (ticketCode: string) => {
    const response = await ticketApi.get<{ data: Ticket }>(`/tickets/${ticketCode}`);
    return response.data;
  },

  // Add message to ticket
  addMessage: async (ticketId: number, message: string) => {
    const response = await ticketApi.post<{ data: TicketMessage; message: string }>(
      `/tickets/${ticketId}/messages`,
      { message }
    );
    return response.data;
  },
};

export default ticketService;
```

```typescript
// components/CreateTicketForm.tsx
import React, { useState } from 'react';
import { ticketService, CreateTicketRequest } from '../services/ticketService';

const CreateTicketForm: React.FC = () => {
  const [formData, setFormData] = useState<CreateTicketRequest>({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const result = await ticketService.createTicket(formData);
      setSuccess(true);
      console.log('Ticket created:', result.data);
      // Reset form or redirect
      setFormData({
        subject: '',
        description: '',
        category: 'general',
        priority: 'medium',
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ticket-form">
      <h2>Create Support Ticket</h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Ticket created successfully!</div>}

      <div className="form-group">
        <label htmlFor="subject">Subject *</label>
        <input
          id="subject"
          type="text"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          required
          minLength={5}
          maxLength={255}
          placeholder="Brief description of your issue"
        />
      </div>

      <div className="form-group">
        <label htmlFor="category">Category *</label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
          required
        >
          <option value="general">General Inquiry</option>
          <option value="transaction_issue">Transaction Issue</option>
          <option value="data_plan_issue">Data Plan Issue</option>
          <option value="payment_issue">Payment Issue</option>
          <option value="ai_query">AI Assistant Issue</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="priority">Priority</label>
        <select
          id="priority"
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          minLength={10}
          rows={6}
          placeholder="Please provide detailed information about your issue..."
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Ticket'}
      </button>
    </form>
  );
};

export default CreateTicketForm;
```

```typescript
// components/TicketList.tsx
import React, { useEffect, useState } from 'react';
import { ticketService, Ticket } from '../services/ticketService';

const TicketList: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadTickets();
  }, [filter]);

  const loadTickets = async () => {
    try {
      const result = await ticketService.getMyTickets({ 
        status: filter || undefined,
        page: 1,
        limit: 20 
      });
      setTickets(result.data);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'blue';
      case 'in_progress': return 'orange';
      case 'resolved': return 'green';
      case 'closed': return 'gray';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  if (loading) return <div>Loading tickets...</div>;

  return (
    <div className="ticket-list">
      <div className="ticket-header">
        <h2>My Support Tickets</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Tickets</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {tickets.length === 0 ? (
        <div className="no-tickets">No tickets found</div>
      ) : (
        <div className="tickets">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="ticket-card">
              <div className="ticket-card-header">
                <h3>{ticket.subject}</h3>
                <div className="ticket-badges">
                  <span className={`badge status-${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                  <span className={`badge priority-${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </div>
              </div>
              <div className="ticket-card-body">
                <p className="ticket-code">#{ticket.ticket_code}</p>
                <p className="ticket-category">{ticket.category.replace('_', ' ')}</p>
                <p className="ticket-date">
                  Created: {new Date(ticket.created_at).toLocaleString()}
                </p>
              </div>
              <div className="ticket-card-footer">
                <a href={`/tickets/${ticket.ticket_code}`}>View Details →</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketList;
```

---

## Best Practices

1. **Always validate input** - Check subject length, category, and priority before submitting
2. **Handle errors gracefully** - Display user-friendly error messages
3. **Show loading states** - Indicate when operations are in progress
4. **Auto-refresh ticket lists** - Poll for updates or use WebSockets
5. **Display ticket codes prominently** - Users need them for reference
6. **Highlight urgent tickets** - Use visual indicators for priority
7. **Enable real-time messaging** - Consider WebSocket for live chat experience
8. **Implement pagination** - Don't load all tickets at once
9. **Cache ticket data** - Reduce API calls for frequently accessed tickets
10. **Provide search/filter** - Help users find specific tickets quickly

---

## Support

For issues or questions:
- Check [AI Setup Guide](./AI_SETUP.md)
- Review [React Implementation Guide](./REACT_IMPLEMENTATION_GUIDE.md)
- Contact development team

---

**Version**: 1.0.0  
**Last Updated**: January 2024
