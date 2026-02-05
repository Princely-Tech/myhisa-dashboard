# Partner Integration Guide: Service Availability & Webhooks

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Service Availability API](#service-availability-api)
4. [Webhook Integration](#webhook-integration)
5. [Complete Integration Examples](#complete-integration-examples)
6. [Testing & Troubleshooting](#testing--troubleshooting)

---

## Overview

This guide helps partners integrate with the service availability monitoring and webhook notification system. Partners can:
- **Query service availability** in real-time to display on their platform
- **Receive automatic notifications** when services go down or are restored
- **Proactively manage** service availability on their frontend

---

## Authentication

All API requests require authentication using a Bearer token in the Authorization header:

```http
Authorization: Bearer YOUR_API_KEY
```

To obtain your API key:
1. Log in to your partner account
2. Navigate to Settings → API Keys
3. Generate a new API key or use your existing key

---

## Service Availability API

### 1. Get All Services Availability

**Endpoint:** `GET /api/availability/all`

**Request:**
```bash
curl -X GET "https://api.yourservice.com/api/availability/all" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "count": 23,
  "data": [
    {
      "service": "airtime",
      "provider": "mtn",
      "percent": 100
    },
    {
      "service": "airtime",
      "provider": "airtel",
      "percent": 100
    },
    {
      "service": "airtime",
      "provider": "glo",
      "percent": 95
    },
    {
      "service": "data",
      "provider": "mtn",
      "percent": 100
    },
    {
      "service": "data",
      "provider": "airtel",
      "percent": 100
    },
    {
      "service": "data",
      "provider": "glo",
      "percent": 100
    },
    {
      "service": "cable",
      "provider": "dstv",
      "percent": 100
    },
    {
      "service": "cable",
      "provider": "gotv",
      "percent": 100
    },
    {
      "service": "cable",
      "provider": "startimes",
      "percent": 100
    },
    {
      "service": "electricity",
      "provider": "aedc",
      "percent": 100
    },
    {
      "service": "electricity",
      "provider": "ekedc",
      "percent": 85
    },
    {
      "service": "electricity",
      "provider": "ikedc",
      "percent": 100
    },
    {
      "service": "electricity",
      "provider": "ibedc",
      "percent": 100
    },
    {
      "service": "electricity",
      "provider": "eedc",
      "percent": 100
    },
    {
      "service": "electricity",
      "provider": "phed",
      "percent": 100
    },
    {
      "service": "electricity",
      "provider": "jedc",
      "percent": 100
    },
    {
      "service": "electricity",
      "provider": "kaedco",
      "percent": 100
    },
    {
      "service": "electricity",
      "provider": "kedco",
      "percent": 100
    },
    {
      "service": "electricity",
      "provider": "yedc",
      "percent": 100
    },
    {
      "service": "electricity",
      "provider": "bedc",
      "percent": 100
    },
    {
      "service": "electricity",
      "provider": "yedco",
      "percent": 100
    },
    {
      "service": "electricity",
      "provider": "aba",
      "percent": 100
    }
  ]
}
```

### 2. Get Availability by Service Type

**Endpoint:** `GET /api/availability/{service}`

**Available Services:**
- `electricity`
- `airtime`
- `data`
- `cable`

**Example - Get All Electricity Providers:**
```bash
curl -X GET "https://api.yourservice.com/api/availability/electricity" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "data": [
    {
      "service": "electricity",
      "provider": "aedc",
      "percent": 100
    },
    {
      "service": "electricity",
      "provider": "ekedc",
      "percent": 85
    },
    {
      "service": "electricity",
      "provider": "ikedc",
      "percent": 100
    },
    {
      "service": "electricity",
      "provider": "ibedc",
      "percent": 100
    },
    {
      "service": "electricity",
      "provider": "eedc",
      "percent": 100
    },
    {
      "service": "electricity",
      "provider": "phed",
      "percent": 100
    },
    {
      "service": "electricity",
      "provider": "jedc",
      "percent": 100
    },
    {
      "service": "electricity",
      "provider": "kaedco",
      "percent": 100
    },
    {
      "service": "electricity",
      "provider": "kedco",
      "percent": 100
    },
    {
      "service": "electricity",
      "provider": "yedc",
      "percent": 100
    },
    {
      "service": "electricity",
      "provider": "bedc",
      "percent": 100
    },
    {
      "service": "electricity",
      "provider": "yedco",
      "percent": 100
    },
    {
      "service": "electricity",
      "provider": "aba",
      "percent": 100
    }
  ]
}
```

### 3. Get Specific Provider Availability

**Endpoint:** `GET /api/availability/{service}?provider={provider_name}`

**Example - Check AEDC Electricity:**
```bash
curl -X GET "https://api.yourservice.com/api/availability/electricity?provider=aedc" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "data": {
    "service": "electricity",
    "provider": "aedc",
    "percent": 85
  }
}
```

### 4. Availability Interpretation

| Percent | Status | Recommendation |
|---------|--------|----------------|
| 100% | Fully Available | ✅ Display service normally |
| 80-99% | Degraded | ⚠️ Show warning, allow transactions |
| 50-79% | Limited | ⚠️ Show warning, consider disabling |
| 0-49% | Down | ❌ Disable service, show maintenance message |

**Best Practice:** Disable services below 80% availability to prevent failed transactions.

---

## Webhook Integration

### Step 1: Register Your Webhook

**Endpoint:** `POST /api/webhooks`

**Request:**
```bash
curl -X POST "https://api.yourservice.com/api/webhooks" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_url": "https://partner.example.com/webhooks/service-status",
    "auth_token": "your_secure_webhook_secret_token_12345",
    "description": "Production webhook for service status notifications"
  }'
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "user_id": 123,
    "webhook_url": "https://partner.example.com/webhooks/service-status",
    "is_active": true,
    "description": "Production webhook for service status notifications",
    "created_at": "2026-02-04T15:30:00Z",
    "updated_at": "2026-02-04T15:30:00Z"
  }
}
```

**Important Notes:**
- `auth_token`: This is YOUR secret token that will be sent in the `Authorization` header when we call your webhook
- `webhook_url`: Must be HTTPS in production
- Keep your `auth_token` secure - it authenticates our requests to your endpoint

### Step 2: Implement Webhook Endpoint

Your webhook endpoint must:
1. Accept POST requests
2. Verify the Authorization header matches your `auth_token`
3. Process the webhook payload
4. Return HTTP 200-299 for success

**Sample Implementation (Node.js/Express):**

```javascript
const express = require('express');
const app = express();

app.use(express.json());

// Your webhook endpoint
app.post('/webhooks/service-status', (req, res) => {
  // 1. Verify authorization
  const authHeader = req.headers.authorization;
  const expectedToken = 'Bearer your_secure_webhook_secret_token_12345';
  
  if (authHeader !== expectedToken) {
    console.error('Unauthorized webhook request');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // 2. Parse webhook payload
  const event = req.body;
  console.log('Received webhook:', JSON.stringify(event, null, 2));
  
  // 3. Process the event
  if (event.event_type === 'service_down') {
    handleServiceDown(event);
  } else if (event.event_type === 'service_restored') {
    handleServiceRestored(event);
  }
  
  // 4. Return success
  res.status(200).json({ message: 'Webhook received successfully' });
});

function handleServiceDown(event) {
  console.log(`🔴 SERVICE DOWN: ${event.service}/${event.provider}`);
  console.log(`   Previous: ${event.previous_state}% → New: ${event.new_state}%`);
  console.log(`   Note: ${event.note}`);
  
  // Disable service on your platform
  disableService(event.service, event.provider);
  
  // Notify your users
  notifyUsers({
    title: 'Service Temporarily Unavailable',
    message: `${event.service} (${event.provider}) is currently experiencing issues. We'll notify you when it's restored.`,
    service: event.service,
    provider: event.provider
  });
}

function handleServiceRestored(event) {
  console.log(`🟢 SERVICE RESTORED: ${event.service}/${event.provider}`);
  console.log(`   Previous: ${event.previous_state}% → New: ${event.new_state}%`);
  
  // Re-enable service on your platform
  enableService(event.service, event.provider);
  
  // Notify your users
  notifyUsers({
    title: 'Service Restored',
    message: `${event.service} (${event.provider}) is now available again!`,
    service: event.service,
    provider: event.provider
  });
}

function disableService(service, provider) {
  // Update your database to mark service as unavailable
  // Example: UPDATE services SET is_available = false WHERE service = ? AND provider = ?
  console.log(`Disabling ${service}/${provider} in database...`);
}

function enableService(service, provider) {
  // Update your database to mark service as available
  // Example: UPDATE services SET is_available = true WHERE service = ? AND provider = ?
  console.log(`Enabling ${service}/${provider} in database...`);
}

function notifyUsers(notification) {
  // Send push notification, email, or in-app notification to users
  console.log('Sending notification to users:', notification);
}

app.listen(3000, () => {
  console.log('Webhook server listening on port 3000');
});
```

**Sample Implementation (Python/Flask):**

```python
from flask import Flask, request, jsonify
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

WEBHOOK_SECRET = 'your_secure_webhook_secret_token_12345'

@app.route('/webhooks/service-status', methods=['POST'])
def handle_service_status():
    # 1. Verify authorization
    auth_header = request.headers.get('Authorization')
    expected_token = f'Bearer {WEBHOOK_SECRET}'
    
    if auth_header != expected_token:
        logging.error('Unauthorized webhook request')
        return jsonify({'error': 'Unauthorized'}), 401
    
    # 2. Parse webhook payload
    event = request.json
    logging.info(f'Received webhook: {event}')
    
    # 3. Process the event
    if event['event_type'] == 'service_down':
        handle_service_down(event)
    elif event['event_type'] == 'service_restored':
        handle_service_restored(event)
    
    # 4. Return success
    return jsonify({'message': 'Webhook received successfully'}), 200

def handle_service_down(event):
    logging.warning(f"🔴 SERVICE DOWN: {event['service']}/{event['provider']}")
    logging.warning(f"   Previous: {event['previous_state']}% → New: {event['new_state']}%")
    logging.warning(f"   Note: {event['note']}")
    
    # Disable service on your platform
    disable_service(event['service'], event['provider'])
    
    # Notify your users
    notify_users(
        title='Service Temporarily Unavailable',
        message=f"{event['service']} ({event['provider']}) is currently experiencing issues.",
        service=event['service'],
        provider=event['provider']
    )

def handle_service_restored(event):
    logging.info(f"🟢 SERVICE RESTORED: {event['service']}/{event['provider']}")
    logging.info(f"   Previous: {event['previous_state']}% → New: {event['new_state']}%")
    
    # Re-enable service on your platform
    enable_service(event['service'], event['provider'])
    
    # Notify your users
    notify_users(
        title='Service Restored',
        message=f"{event['service']} ({event['provider']}) is now available again!",
        service=event['service'],
        provider=event['provider']
    )

def disable_service(service, provider):
    # Update your database to mark service as unavailable
    logging.info(f'Disabling {service}/{provider} in database...')
    # db.execute("UPDATE services SET is_available = 0 WHERE service = ? AND provider = ?", 
    #            (service, provider))

def enable_service(service, provider):
    # Update your database to mark service as available
    logging.info(f'Enabling {service}/{provider} in database...')
    # db.execute("UPDATE services SET is_available = 1 WHERE service = ? AND provider = ?", 
    #            (service, provider))

def notify_users(title, message, service, provider):
    # Send push notification, email, or in-app notification to users
    logging.info(f'Sending notification: {title} - {message}')

if __name__ == '__main__':
    app.run(port=3000)
```

**Sample Implementation (PHP/Laravel):**

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    private $webhookSecret = 'your_secure_webhook_secret_token_12345';
    
    public function handleServiceStatus(Request $request)
    {
        // 1. Verify authorization
        $authHeader = $request->header('Authorization');
        $expectedToken = 'Bearer ' . $this->webhookSecret;
        
        if ($authHeader !== $expectedToken) {
            Log::error('Unauthorized webhook request');
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        // 2. Parse webhook payload
        $event = $request->all();
        Log::info('Received webhook', $event);
        
        // 3. Process the event
        if ($event['event_type'] === 'service_down') {
            $this->handleServiceDown($event);
        } elseif ($event['event_type'] === 'service_restored') {
            $this->handleServiceRestored($event);
        }
        
        // 4. Return success
        return response()->json(['message' => 'Webhook received successfully'], 200);
    }
    
    private function handleServiceDown($event)
    {
        Log::warning("🔴 SERVICE DOWN: {$event['service']}/{$event['provider']}");
        Log::warning("   Previous: {$event['previous_state']}% → New: {$event['new_state']}%");
        Log::warning("   Note: {$event['note']}");
        
        // Disable service on your platform
        $this->disableService($event['service'], $event['provider']);
        
        // Notify your users
        $this->notifyUsers([
            'title' => 'Service Temporarily Unavailable',
            'message' => "{$event['service']} ({$event['provider']}) is currently experiencing issues.",
            'service' => $event['service'],
            'provider' => $event['provider']
        ]);
    }
    
    private function handleServiceRestored($event)
    {
        Log::info("🟢 SERVICE RESTORED: {$event['service']}/{$event['provider']}");
        Log::info("   Previous: {$event['previous_state']}% → New: {$event['new_state']}%");
        
        // Re-enable service on your platform
        $this->enableService($event['service'], $event['provider']);
        
        // Notify your users
        $this->notifyUsers([
            'title' => 'Service Restored',
            'message' => "{$event['service']} ({$event['provider']}) is now available again!",
            'service' => $event['service'],
            'provider' => $event['provider']
        ]);
    }
    
    private function disableService($service, $provider)
    {
        // Update your database to mark service as unavailable
        Log::info("Disabling {$service}/{$provider} in database...");
        // DB::table('services')
        //     ->where('service', $service)
        //     ->where('provider', $provider)
        //     ->update(['is_available' => false]);
    }
    
    private function enableService($service, $provider)
    {
        // Update your database to mark service as available
        Log::info("Enabling {$service}/{$provider} in database...");
        // DB::table('services')
        //     ->where('service', $service)
        //     ->where('provider', $provider)
        //     ->update(['is_available' => true]);
    }
    
    private function notifyUsers($notification)
    {
        // Send push notification, email, or in-app notification to users
        Log::info('Sending notification to users', $notification);
    }
}
```

### Step 3: Webhook Payload Structure

**Complete Webhook Payload:**

```json
{
  "event_type": "service_down",
  "service": "electricity",
  "provider": "aedc",
  "previous_state": 100,
  "new_state": 45,
  "timestamp": "2026-02-04T15:43:27Z",
  "note": "Upstream provider experiencing connectivity issues"
}
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `event_type` | string | Either `"service_down"` or `"service_restored"` |
| `service` | string | Service type: `"electricity"`, `"airtime"`, `"data"`, `"cable"` |
| `provider` | string | Provider name (lowercase): `"aedc"`, `"mtn"`, `"dstv"`, etc. |
| `previous_state` | integer | Previous availability percentage (0-100) |
| `new_state` | integer | New availability percentage (0-100) |
| `timestamp` | string | ISO 8601 timestamp of the event |
| `note` | string | Optional context about the status change |

**Event Types:**

1. **`service_down`**: Triggered when availability drops from ≥80% to <80%
   - Action: Disable the service on your platform
   - Notify users about the outage

2. **`service_restored`**: Triggered when availability returns from <80% to ≥80%
   - Action: Re-enable the service on your platform
   - Notify users that service is restored

### Step 4: Webhook Headers

When we call your webhook, we send these headers:

```http
POST /webhooks/service-status HTTP/1.1
Host: partner.example.com
Content-Type: application/json
Authorization: Bearer your_secure_webhook_secret_token_12345
X-Webhook-Event: service_status_change
User-Agent: HISA-Webhook/1.0
```

**Header Descriptions:**
- `Content-Type`: Always `application/json`
- `Authorization`: Bearer token with your `auth_token`
- `X-Webhook-Event`: Always `service_status_change`

---

## Complete Integration Examples

### Example 1: Real-time Service Status Display

**Frontend (React):**

```javascript
import React, { useState, useEffect } from 'react';

function ServiceStatusDashboard() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServiceStatus();
    // Refresh every 5 minutes
    const interval = setInterval(fetchServiceStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchServiceStatus = async () => {
    try {
      const response = await fetch('https://api.yourservice.com/api/availability/all', {
        headers: {
          'Authorization': 'Bearer YOUR_API_KEY'
        }
      });
      const data = await response.json();
      setServices(data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching service status:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (percent) => {
    if (percent >= 100) return 'green';
    if (percent >= 80) return 'yellow';
    if (percent >= 50) return 'orange';
    return 'red';
  };

  const getStatusText = (percent) => {
    if (percent >= 100) return 'Available';
    if (percent >= 80) return 'Degraded';
    if (percent >= 50) return 'Limited';
    return 'Down';
  };

  const isServiceAvailable = (percent) => percent >= 80;

  if (loading) return <div>Loading service status...</div>;

  // Group services by type
  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.service]) acc[service.service] = [];
    acc[service.service].push(service);
    return acc;
  }, {});

  return (
    <div className="service-status-dashboard">
      <h2>Service Status</h2>
      {Object.entries(groupedServices).map(([serviceType, providers]) => (
        <div key={serviceType} className="service-group">
          <h3>{serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}</h3>
          <div className="providers-grid">
            {providers.map((provider) => (
              <div 
                key={`${provider.service}-${provider.provider}`}
                className={`provider-card ${getStatusColor(provider.percent)}`}
              >
                <div className="provider-name">
                  {provider.provider.toUpperCase()}
                </div>
                <div className="provider-status">
                  <span className={`status-badge ${getStatusColor(provider.percent)}`}>
                    {getStatusText(provider.percent)}
                  </span>
                  <span className="status-percent">{provider.percent}%</span>
                </div>
                {!isServiceAvailable(provider.percent) && (
                  <div className="status-warning">
                    ⚠️ Service temporarily unavailable
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ServiceStatusDashboard;
```

### Example 2: Disable Service Based on Availability

**Backend Logic:**

```javascript
// Before processing a transaction
async function canProcessTransaction(service, provider) {
  try {
    const response = await fetch(
      `https://api.yourservice.com/api/availability/${service}?provider=${provider}`,
      {
        headers: {
          'Authorization': 'Bearer YOUR_API_KEY'
        }
      }
    );
    
    const data = await response.json();
    const availability = data.data.percent;
    
    // Only allow transactions if availability is 80% or higher
    if (availability < 80) {
      return {
        allowed: false,
        reason: `${service} service for ${provider} is currently unavailable (${availability}% availability). Please try again later.`
      };
    }
    
    return {
      allowed: true,
      availability: availability
    };
  } catch (error) {
    console.error('Error checking service availability:', error);
    // Fail safe: allow transaction if availability check fails
    return {
      allowed: true,
      availability: null
    };
  }
}

// Usage in transaction endpoint
app.post('/api/transactions/electricity', async (req, res) => {
  const { provider, amount, meter_number } = req.body;
  
  // Check service availability before processing
  const availabilityCheck = await canProcessTransaction('electricity', provider);
  
  if (!availabilityCheck.allowed) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: availabilityCheck.reason
    });
  }
  
  // Process transaction...
  // ...
});
```

### Example 3: Webhook-Driven Service Toggle

**Database Schema:**

```sql
CREATE TABLE service_availability (
  id INT PRIMARY KEY AUTO_INCREMENT,
  service VARCHAR(50) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  availability_percent INT DEFAULT 100,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  note TEXT,
  UNIQUE KEY unique_service_provider (service, provider)
);
```

**Webhook Handler with Database Update:**

```javascript
app.post('/webhooks/service-status', async (req, res) => {
  const authHeader = req.headers.authorization;
  const expectedToken = 'Bearer your_secure_webhook_secret_token_12345';
  
  if (authHeader !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const event = req.body;
  
  try {
    // Update database
    await db.query(`
      INSERT INTO service_availability (service, provider, is_available, availability_percent, note)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        is_available = VALUES(is_available),
        availability_percent = VALUES(availability_percent),
        note = VALUES(note),
        last_updated = CURRENT_TIMESTAMP
    `, [
      event.service,
      event.provider,
      event.new_state >= 80, // Available if >= 80%
      event.new_state,
      event.note
    ]);
    
    // Log the event
    console.log(`Service ${event.service}/${event.provider} updated: ${event.previous_state}% → ${event.new_state}%`);
    
    // Send real-time update to connected clients via WebSocket
    io.emit('service_status_update', {
      service: event.service,
      provider: event.provider,
      is_available: event.new_state >= 80,
      percent: event.new_state,
      event_type: event.event_type
    });
    
    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

## Testing & Troubleshooting

### Testing Your Webhook

1. **Use a webhook testing tool:**
   - [webhook.site](https://webhook.site) - Get a temporary URL to see incoming webhooks
   - [ngrok](https://ngrok.com) - Expose your local server to the internet

2. **Test with ngrok:**
```bash
# Start your local server on port 3000
npm start

# In another terminal, start ngrok
ngrok http 3000

# Use the ngrok URL in your webhook registration
# Example: https://abc123.ngrok.io/webhooks/service-status
```

3. **Request a test webhook:**
```bash
curl -X POST "https://api.yourservice.com/api/webhooks/1/test" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Viewing Webhook Delivery History

**Get delivery logs for your webhook:**

```bash
curl -X GET "https://api.yourservice.com/api/webhooks/1/deliveries" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "data": [
    {
      "id": 45,
      "partner_webhook_id": 1,
      "event_id": 23,
      "status": "success",
      "response_code": 200,
      "response_body": "{\"message\":\"Webhook received successfully\"}",
      "error_message": "",
      "attempt_count": 1,
      "created_at": "2026-02-04T15:43:30Z",
      "event": {
        "service": "electricity",
        "provider": "aedc",
        "event_type": "service_down",
        "previous_state": 100,
        "new_state": 45
      }
    },
    {
      "id": 44,
      "partner_webhook_id": 1,
      "event_id": 22,
      "status": "failed",
      "response_code": 0,
      "response_body": "",
      "error_message": "Request failed: dial tcp: lookup partner.example.com: no such host",
      "attempt_count": 3,
      "created_at": "2026-02-04T14:20:15Z",
      "event": {
        "service": "data",
        "provider": "mtn",
        "event_type": "service_restored",
        "previous_state": 70,
        "new_state": 100
      }
    }
  ]
}
```

### Common Issues & Solutions

**Issue 1: Webhook not receiving requests**
- ✅ Verify your webhook URL is publicly accessible
- ✅ Check firewall rules allow incoming HTTPS traffic
- ✅ Ensure your server is running and listening on the correct port
- ✅ Verify webhook is active: `GET /api/webhooks/1`

**Issue 2: Receiving 401 Unauthorized**
- ✅ Check your webhook endpoint is verifying the Authorization header correctly
- ✅ Ensure the token matches exactly (including "Bearer " prefix)
- ✅ Token is case-sensitive

**Issue 3: Webhook timing out**
- ✅ Your endpoint must respond within 10 seconds
- ✅ Process webhook asynchronously if it takes longer
- ✅ Return 200 immediately, then process in background

**Issue 4: Missing webhook notifications**
- ✅ Check delivery history for errors
- ✅ Verify webhook is active (`is_active: true`)
- ✅ Failed deliveries are retried up to 3 times

### Best Practices

1. **Security:**
   - Always use HTTPS for webhook URLs
   - Keep your auth_token secret
   - Verify the Authorization header on every request
   - Implement rate limiting on your webhook endpoint

2. **Reliability:**
   - Return HTTP 200 quickly (within 10 seconds)
   - Process webhooks asynchronously
   - Implement idempotency (handle duplicate webhooks gracefully)
   - Log all webhook requests for debugging

3. **Monitoring:**
   - Monitor webhook delivery success rate
   - Alert on consecutive failures
   - Check delivery history regularly
   - Test webhook endpoint periodically

4. **Performance:**
   - Cache service availability locally
   - Refresh cache on webhook notifications
   - Don't query availability API on every transaction
   - Use database to store current availability state

---

## Support

For technical support or questions:
- **Email:** support@yourservice.com
- **Documentation:** https://docs.yourservice.com
- **Status Page:** https://status.yourservice.com

For webhook-specific issues, include:
- Your webhook ID
- Timestamp of the issue
- Delivery logs (from `/api/webhooks/:id/deliveries`)
- Your webhook endpoint logs
