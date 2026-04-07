# HISA AI Assistant - React Quick Start

## 5-Minute Integration Guide

This guide will help you integrate the HISA AI Assistant into your React application in just a few minutes.

## Prerequisites

- React 16.8+ (Hooks support)
- Axios or Fetch API
- Authentication token available

## Step 1: Install Dependencies

```bash
npm install axios
# or
yarn add axios
```

## Step 2: Create API Service

Create `src/services/aiService.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const aiApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token
aiApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const sendMessage = async (message, history = []) => {
  const response = await aiApi.post('/ai/chat', { message, history });
  return response.data;
};

export default { sendMessage };
```

## Step 3: Create Simple Chat Component

Create `src/components/SimpleAIChat.jsx`:

```javascript
import React, { useState } from 'react';
import { sendMessage } from '../services/aiService';
import './SimpleAIChat.css';

export default function SimpleAIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendMessage(input);
      const aiMsg = { 
        role: 'assistant', 
        content: response.data.message,
        data: response.data.data 
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-chat">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="avatar">{msg.role === 'user' ? '👤' : '🤖'}</div>
            <div className="content">
              <p>{msg.content}</p>
              {msg.data && (
                <div className="data">
                  {JSON.stringify(msg.data, null, 2)}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="loading">AI is thinking...</div>}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
```

## Step 4: Add Basic Styling

Create `src/components/SimpleAIChat.css`:

```css
.ai-chat {
  display: flex;
  flex-direction: column;
  height: 600px;
  max-width: 800px;
  margin: 0 auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: #f9fafb;
}

.message {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.message.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: #fff;
}

.content {
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  background: #fff;
}

.message.user .content {
  background: #667eea;
  color: white;
}

.data {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f3f4f6;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  overflow-x: auto;
}

.loading {
  text-align: center;
  color: #6b7280;
  font-style: italic;
}

.input-area {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  background: white;
  border-top: 1px solid #e5e7eb;
}

.input-area input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
}

.input-area button {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
}

.input-area button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## Step 5: Use the Component

In your `App.js` or any page:

```javascript
import React from 'react';
import SimpleAIChat from './components/SimpleAIChat';

function App() {
  return (
    <div className="App">
      <h1>HISA AI Assistant</h1>
      <SimpleAIChat />
    </div>
  );
}

export default App;
```

## Step 6: Set Environment Variables

Create `.env` file:

```env
REACT_APP_API_URL=http://localhost:8080/api
```

## Step 7: Run Your App

```bash
npm start
# or
yarn start
```

## Test Queries

Try these queries to test the AI:

- "What's my balance?"
- "Show me my transactions from last week"
- "Find MTN data plans under 2000 naira"
- "How much did I spend this month?"

## Next Steps

For a more complete implementation with:
- Transaction cards
- Data plan cards
- Balance display
- Ticket management
- Advanced styling

See the full **[React Implementation Guide](./REACT_IMPLEMENTATION_GUIDE.md)**

## Common Issues

### 401 Unauthorized Error

Make sure your auth token is set:

```javascript
localStorage.setItem('authToken', 'your-jwt-token-here');
```

### CORS Error

Add CORS middleware to your backend or use a proxy in `package.json`:

```json
{
  "proxy": "http://localhost:8080"
}
```

### API Not Responding

Check that:
1. Backend server is running
2. API URL is correct
3. Network tab shows the request being sent

## Support

For detailed documentation, see:
- [Full React Implementation Guide](./REACT_IMPLEMENTATION_GUIDE.md)
- [API Setup Guide](./AI_SETUP.md)
- [User Guide](./AI_USER_GUIDE.md)

---

**Happy coding! 🚀**
