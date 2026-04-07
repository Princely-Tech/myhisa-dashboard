# HISA AI Assistant - API Reference

Complete API documentation for integrating with the HISA AI Assistant.

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

## Endpoints

### 1. Chat with AI

Send a message to the AI assistant and receive a response.

**Endpoint:** `POST /ai/chat`

**Request Body:**

```json
{
  "message": "What's my balance?",
  "history": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant",
      "content": "Hi! How can I help you today?"
    }
  ]
}
```

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message | string | Yes | User's message to the AI |
| history | array | No | Previous conversation messages for context |

**Response:**

```json
{
  "data": {
    "message": "Your current balance is ₦15,450.00. You also have ₦2,300.00 in commission and ₦500.00 in bonus.",
    "data": [
      {
        "balance": 15450.00,
        "commission": 2300.00,
        "bonus": 500.00,
        "account_number": "1234567890",
        "account_name": "John Doe",
        "bank_name": "Wema Bank",
        "is_active": true
      }
    ],
    "tool_calls": [
      {
        "tool_name": "get_user_balance",
        "result": { ... }
      }
    ],
    "metadata": {
      "conversation_history": [ ... ],
      "tokens_used": 450
    }
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| message | string | AI's text response |
| data | array | Structured data (transactions, plans, balance, etc.) |
| tool_calls | array | Tools executed by the AI |
| metadata.conversation_history | array | Full conversation history including tool calls |
| metadata.tokens_used | number | Total tokens consumed |

**Example cURL:**

```bash
curl -X POST http://localhost:8080/api/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me my transactions from last week"
  }'
```

**Status Codes:**

- `200 OK` - Success
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Missing or invalid token
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

### 2. Get Available Tools

Retrieve a list of all available AI tools and their descriptions.

**Endpoint:** `GET /ai/tools`

**Response:**

```json
{
  "data": [
    {
      "name": "search_transactions",
      "description": "Search and filter user's transactions by date range, type, status, network, amount range, etc.",
      "parameters": {
        "type": "object",
        "properties": {
          "start_date": {
            "type": "string",
            "description": "Start date in YYYY-MM-DD format"
          },
          "end_date": {
            "type": "string",
            "description": "End date in YYYY-MM-DD format"
          },
          "type": {
            "type": "string",
            "description": "Transaction type: airtime, data, cable, electricity"
          },
          "status": {
            "type": "string",
            "description": "Transaction status: successful, pending, failed"
          },
          "network": {
            "type": "string",
            "description": "Network provider: mtn, glo, airtel, 9mobile"
          },
          "min_amount": {
            "type": "number",
            "description": "Minimum amount in Naira"
          },
          "max_amount": {
            "type": "number",
            "description": "Maximum amount in Naira"
          },
          "limit": {
            "type": "integer",
            "description": "Maximum number of results (default: 10, max: 50)"
          }
        }
      }
    }
  ]
}
```

**Example cURL:**

```bash
curl -X GET http://localhost:8080/api/ai/tools \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Get User Tickets

Retrieve user's support tickets.

**Endpoint:** `GET /tickets`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status: open, in_progress, resolved, closed |
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Items per page (default: 20, max: 100) |

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "ticket_code": "TKT-1705432100-123",
      "subject": "Refund Request",
      "description": "I need a refund for transaction TXN123456",
      "category": "transaction_issue",
      "priority": "medium",
      "status": "open",
      "source": "ai",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "messages": []
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

---

### 4. Get Specific Ticket

Retrieve details of a specific ticket.

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
    "subject": "Refund Request",
    "description": "I need a refund for transaction TXN123456",
    "category": "transaction_issue",
    "priority": "medium",
    "status": "open",
    "source": "ai",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "messages": [
      {
        "id": 1,
        "user_id": 123,
        "message": "I need a refund for transaction TXN123456",
        "is_staff": false,
        "created_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

**Example cURL:**

```bash
curl -X GET http://localhost:8080/api/tickets/TKT-1705432100-123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 5. Add Message to Ticket

Add a message to an existing ticket.

**Endpoint:** `POST /tickets/:id/messages`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Ticket ID |

**Request Body:**

```json
{
  "message": "I have additional information about this issue..."
}
```

**Response:**

```json
{
  "data": {
    "id": 2,
    "ticket_id": 1,
    "user_id": 123,
    "message": "I have additional information about this issue...",
    "is_staff": false,
    "created_at": "2024-01-15T11:00:00Z"
  },
  "message": "Message added successfully"
}
```

**Example cURL:**

```bash
curl -X POST http://localhost:8080/api/tickets/1/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have additional information..."
  }'
```

---

## Admin Endpoints

All admin endpoints require staff or admin role.

### 6. Get All Tickets (Admin)

**Endpoint:** `GET /admin/tickets`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status |
| priority | string | No | Filter by priority |
| source | string | No | Filter by source |
| category | string | No | Filter by category |
| page | integer | No | Page number |
| limit | integer | No | Items per page |

**Response:** Same as user tickets endpoint but includes all users' tickets.

---

### 7. Get Ticket Details (Admin)

**Endpoint:** `GET /admin/tickets/:id`

**Response:** Same as user ticket endpoint but includes full user details.

---

### 8. Update Ticket Status (Admin)

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

### 9. Assign Ticket (Admin)

**Endpoint:** `PUT /admin/tickets/:id/assign`

**Request Body:**

```json
{
  "assigned_to": 5
}
```

---

### 10. Resolve Ticket (Admin)

**Endpoint:** `PUT /admin/tickets/:id/resolve`

**Request Body:**

```json
{
  "resolution": "Issue has been resolved. Transaction was successfully processed."
}
```

---

### 11. Reply to Ticket (Admin)

**Endpoint:** `POST /admin/tickets/:id/messages`

**Request Body:**

```json
{
  "message": "We are looking into this issue and will update you shortly."
}
```

---

## Data Types

### Transaction Object

```typescript
{
  transaction_id: string;
  type: string;              // airtime, data, cable, electricity
  amount: number;            // in Naira
  fee: number;               // in Naira
  network: string;           // mtn, glo, airtel, 9mobile
  msisdn: string;            // phone number
  status: string;            // successful, pending, failed
  created_at: string;        // ISO 8601 datetime
  external_ref?: string;
  description?: string;
  balance_before?: number;
  balance_after?: number;
  commission?: number;
}
```

### Data Plan Object

```typescript
{
  code: string;
  network: string;           // mtn, glo, airtel, 9mobile
  description: string;
  price: number;             // in Naira
  validity: string;          // e.g., "30 days", "1 week"
  bundle_type: string;       // daily, weekly, monthly, yearly
}
```

### Balance Object

```typescript
{
  balance: number;           // in Naira
  commission: number;        // in Naira
  bonus: number;             // in Naira
  account_number?: string;
  account_name?: string;
  bank_name?: string;
  is_active: boolean;
}
```

### Statistics Object

```typescript
{
  total_transactions: number;
  total_amount: number;      // in Naira
  successful: number;
  pending: number;
  failed: number;
  success_rate?: number;     // percentage
  by_type?: Record<string, number>;
  by_network?: Record<string, number>;
}
```

### Ticket Object

```typescript
{
  id: number;
  ticket_code: string;
  subject: string;
  description: string;
  category: string;          // ai_query, transaction_issue, data_plan_issue, payment_issue, general
  priority: string;          // low, medium, high, urgent
  status: string;            // open, in_progress, resolved, closed
  source: string;            // ai, manual, email, chat
  assigned_to?: number;
  resolved_at?: string;
  resolved_by?: number;
  resolution?: string;
  created_at: string;
  updated_at: string;
  messages?: TicketMessage[];
}
```

### Service Availability Object

```typescript
{
  service: string;           // airtime, data, cable, electricity
  provider: string;
  available: boolean;
  percent: number;           // 0-100
  note?: string;
  updated_at: string;
}
```

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
- `"AI service is temporarily unavailable"` - AI API is down
- `"Too many requests"` - Rate limit exceeded

---

## Rate Limiting

- **Chat endpoint**: 30 requests per minute per user
- **Other endpoints**: 60 requests per minute per user

When rate limited, you'll receive a `429 Too Many Requests` response.

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Response includes meta:**

```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

---

## Best Practices

1. **Always include conversation history** for better context
2. **Handle rate limits** with exponential backoff
3. **Cache tool definitions** instead of fetching repeatedly
4. **Implement retry logic** for transient errors
5. **Validate responses** before displaying to users
6. **Use TypeScript** for type safety
7. **Log errors** for debugging

---

## Example Integration

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' }
});

// Add auth interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Add retry logic
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 429) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);

// Usage
const chat = async (message, history = []) => {
  try {
    const { data } = await api.post('/ai/chat', { message, history });
    return data;
  } catch (error) {
    console.error('Chat error:', error);
    throw error;
  }
};
```

---

## Support

For issues or questions:
- Check [Setup Guide](./AI_SETUP.md)
- Review [React Implementation Guide](./REACT_IMPLEMENTATION_GUIDE.md)
- Contact development team

---

**Version**: 1.0.0  
**Last Updated**: January 2024
