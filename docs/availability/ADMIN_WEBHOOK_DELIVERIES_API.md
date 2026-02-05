# Admin Webhook Deliveries API Documentation

## Overview

This document describes the API endpoint required for the admin webhook deliveries feature. This endpoint allows administrators to view all webhook delivery logs across all partners with advanced filtering capabilities.

---

## Endpoint

**GET** `/api/admin/webhook-deliveries`

---

## Authentication

Requires admin authentication (rank > 0).

**Headers:**
```
Authorization: Bearer {admin_token}
```

---

## Query Parameters

All query parameters are optional and used for filtering:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `user_id` | integer | Filter by specific user/partner ID | `?user_id=123` |
| `status` | string | Filter by delivery status | `?status=success` |
| `service` | string | Filter by service type | `?service=electricity` |
| `from` | string | Start date (ISO 8601 or YYYY-MM-DD) | `?from=2026-02-01` |
| `to` | string | End date (ISO 8601 or YYYY-MM-DD) | `?to=2026-02-05` |
| `limit` | integer | Number of records per page (default: 50) | `?limit=100` |
| `offset` | integer | Number of records to skip (default: 0) | `?offset=50` |

### Valid Values

- **status**: `success`, `failed`, `pending`
- **service**: `electricity`, `airtime`, `data`, `cable`

---

## Response Format

### Success Response (200 OK)

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
      "user_id": 8,
      "user_email": "partner@example.com",
      "webhook_url": "https://partner.example.com/webhooks/service-status",
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
      "partner_webhook_id": 2,
      "event_id": 22,
      "status": "failed",
      "response_code": 0,
      "response_body": "",
      "error_message": "Request failed: dial tcp: lookup partner.example.com: no such host",
      "attempt_count": 3,
      "created_at": "2026-02-04T14:20:15Z",
      "user_id": 12,
      "user_email": "another-partner@example.com",
      "webhook_url": "https://another-partner.example.com/webhooks/status",
      "event": {
        "service": "data",
        "provider": "mtn",
        "event_type": "service_restored",
        "previous_state": 70,
        "new_state": 100
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_records": 234,
    "limit": 50,
    "offset": 0
  }
}
```

### Error Responses

**401 Unauthorized**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

**403 Forbidden**
```json
{
  "error": "Forbidden",
  "message": "Admin access required"
}
```

**400 Bad Request**
```json
{
  "error": "Bad Request",
  "message": "Invalid query parameter: status must be one of [success, failed, pending]"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal Server Error",
  "message": "An error occurred while fetching webhook deliveries"
}
```

---

## Response Fields

### Main Response Object

| Field | Type | Description |
|-------|------|-------------|
| `data` | array | Array of webhook delivery objects |
| `pagination` | object | Pagination metadata |

### Webhook Delivery Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | Yes | Unique delivery ID |
| `partner_webhook_id` | integer | Yes | ID of the partner's webhook configuration |
| `event_id` | integer | Yes | ID of the availability change event |
| `status` | string | Yes | Delivery status: `success`, `failed`, or `pending` |
| `response_code` | integer | No | HTTP response code from partner's webhook (0 if no response) |
| `response_body` | string | No | Response body from partner's webhook |
| `error_message` | string | No | Error message if delivery failed |
| `attempt_count` | integer | Yes | Number of delivery attempts made |
| `created_at` | string | Yes | ISO 8601 timestamp of first delivery attempt |
| `user_id` | integer | Yes | Partner's user ID |
| `user_email` | string | Yes | Partner's email address |
| `webhook_url` | string | Yes | Partner's webhook URL |
| `event` | object | Yes | Details of the availability change event |

### Event Object

| Field | Type | Description |
|-------|------|-------------|
| `service` | string | Service type: `electricity`, `airtime`, `data`, `cable` |
| `provider` | string | Provider name (lowercase) |
| `event_type` | string | Event type: `service_down` or `service_restored` |
| `previous_state` | integer | Previous availability percentage (0-100) |
| `new_state` | integer | New availability percentage (0-100) |

### Pagination Object

| Field | Type | Description |
|-------|------|-------------|
| `current_page` | integer | Current page number (1-indexed) |
| `total_pages` | integer | Total number of pages |
| `total_records` | integer | Total number of records matching filters |
| `limit` | integer | Number of records per page |
| `offset` | integer | Number of records skipped |

---

## Example Requests

### Get All Webhook Deliveries

```bash
curl -X GET "https://api.yourservice.com/api/admin/webhook-deliveries" \
  -H "Authorization: Bearer {admin_token}"
```

### Filter by Status

```bash
curl -X GET "https://api.yourservice.com/api/admin/webhook-deliveries?status=failed" \
  -H "Authorization: Bearer {admin_token}"
```

### Filter by User and Service

```bash
curl -X GET "https://api.yourservice.com/api/admin/webhook-deliveries?user_id=8&service=electricity" \
  -H "Authorization: Bearer {admin_token}"
```

### Filter by Date Range

```bash
curl -X GET "https://api.yourservice.com/api/admin/webhook-deliveries?from=2026-02-01&to=2026-02-05" \
  -H "Authorization: Bearer {admin_token}"
```

### Pagination Example

```bash
# Get second page with 100 records per page
curl -X GET "https://api.yourservice.com/api/admin/webhook-deliveries?limit=100&offset=100" \
  -H "Authorization: Bearer {admin_token}"
```

### Combined Filters

```bash
curl -X GET "https://api.yourservice.com/api/admin/webhook-deliveries?status=failed&service=electricity&from=2026-02-01&limit=50" \
  -H "Authorization: Bearer {admin_token}"
```

---

## Implementation Notes

### Database Query Considerations

1. **Join Requirements:**
   - Join `webhook_deliveries` with `partner_webhooks` to get `webhook_url`
   - Join with `users` table to get `user_email`
   - Join with `availability_events` table to get event details

2. **Indexing Recommendations:**
   - Index on `status` for filtering
   - Index on `user_id` for filtering
   - Index on `created_at` for date range queries
   - Composite index on `(status, created_at)` for common queries

3. **Performance:**
   - Default limit should be reasonable (e.g., 50)
   - Maximum limit should be enforced (e.g., 500)
   - Consider caching for frequently accessed data

### Business Logic

1. **Authorization:**
   - Only users with `rank > 0` should access this endpoint
   - Verify admin status before processing request

2. **Data Privacy:**
   - Include user email but consider masking sensitive data if needed
   - Log admin access for audit purposes

3. **Sorting:**
   - Default sort by `created_at DESC` (newest first)
   - Consider allowing sort parameter in future versions

---

## Related Endpoints

This endpoint complements the partner-facing webhook deliveries endpoint:

- **Partner Endpoint:** `GET /api/webhooks/{id}/deliveries` - Partners can only see their own deliveries
- **Admin Endpoint:** `GET /api/admin/webhook-deliveries` - Admins can see all deliveries across all partners

---

## Sample SQL Query (Reference)

```sql
SELECT 
    wd.id,
    wd.partner_webhook_id,
    wd.event_id,
    wd.status,
    wd.response_code,
    wd.response_body,
    wd.error_message,
    wd.attempt_count,
    wd.created_at,
    u.id as user_id,
    u.email as user_email,
    pw.webhook_url,
    ae.service,
    ae.provider,
    ae.event_type,
    ae.previous_state,
    ae.new_state
FROM webhook_deliveries wd
INNER JOIN partner_webhooks pw ON wd.partner_webhook_id = pw.id
INNER JOIN users u ON pw.user_id = u.id
INNER JOIN availability_events ae ON wd.event_id = ae.id
WHERE 
    (? IS NULL OR wd.status = ?)
    AND (? IS NULL OR u.id = ?)
    AND (? IS NULL OR ae.service = ?)
    AND (? IS NULL OR wd.created_at >= ?)
    AND (? IS NULL OR wd.created_at <= ?)
ORDER BY wd.created_at DESC
LIMIT ? OFFSET ?;
```

---

## Testing

### Test Cases

1. **Basic Retrieval:**
   - Verify endpoint returns all deliveries without filters
   - Verify pagination works correctly

2. **Filtering:**
   - Test each filter parameter individually
   - Test combined filters
   - Test invalid filter values return 400

3. **Authorization:**
   - Test with admin token (should succeed)
   - Test with partner token (should fail with 403)
   - Test with no token (should fail with 401)

4. **Edge Cases:**
   - Test with no deliveries in database
   - Test with very large offset
   - Test with invalid date formats

### Sample Test Data

```json
{
  "test_scenarios": [
    {
      "name": "Successful delivery",
      "status": "success",
      "response_code": 200,
      "attempt_count": 1
    },
    {
      "name": "Failed delivery after retries",
      "status": "failed",
      "response_code": 0,
      "error_message": "Connection timeout",
      "attempt_count": 3
    },
    {
      "name": "Pending delivery",
      "status": "pending",
      "response_code": 0,
      "attempt_count": 1
    }
  ]
}
```

---

## Version History

- **v1.0** (2026-02-05): Initial API specification

---

## Support

For questions or issues with this API endpoint, contact the backend development team or refer to the main integration guide at `docs/availability/PARTNER_INTEGRATION_GUIDE.md`.
