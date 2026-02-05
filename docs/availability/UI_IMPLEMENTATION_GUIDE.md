# UI Implementation Guide: Service Availability & Webhook Management

## Overview

This guide provides detailed UI specifications for implementing service availability monitoring and webhook management features.

## User Roles & Permissions

| Feature | Partner | Admin |
|---------|-------------|-------|
| View Availability List | ✅ | ✅ |
| Configure Webhooks | ✅ | ✅ |
| View Own Delivery History  ✅ | ✅ |
| Update Availability | ❌ | ✅ |
| View All Delivery History | ❌ | ✅ |

---

## 1. Availability List (All Users)

**Route:** `/availability`

**API:** `GET /api/availability/all`

### UI Components

Display grouped services with status indicators:
- 🟢 Green (100%): Available
- 🟡 Yellow (80-99%): Degraded  
- 🟠 Orange (50-79%): Limited
- 🔴 Red (0-49%): Down

### Features
- Auto-refresh every 2 minutes
- Manual refresh button
- Last updated timestamp
- Grouped by service type (Airtime, Data, Cable, Electricity)

---

## 2. Webhook Configuration (Partners)

**Route:** `/settings/webhooks`

**APIs:**
- `GET /api/webhooks` - List webhooks
- `POST /api/webhooks` - Create webhook
- `PUT /api/webhooks/{id}` - Update webhook
- `DELETE /api/webhooks/{id}` - Delete webhook

### Form Fields
- **Webhook URL** (required): HTTPS URL
- **Authorization Token** (required): Secret token for authentication
- **Description** (optional): Webhook description
- **Active** (checkbox): Enable/disable webhook

### Validation
- URL must be HTTPS
- Token is required for new webhooks
- Show confirmation before deletion

---

## 3. Delivery History (Partners)

**Route:** `/webhooks/{id}/deliveries`

**API:** `GET /api/webhooks/{id}/deliveries`

### Display Information
- Delivery status (Success/Failed/Pending)
- Timestamp
- Event details (service, provider, state change)
- Response code and body
- Error messages for failures
- Attempt count

### Features
- Filter by status
- View detailed request/response
- Pagination for large datasets
- Retry failed deliveries

---

## 4. Availability Update (Admin Only)

**Route:** `/admin/availability`

**API:** `POST /api/admin/availability`

### Form Fields
- **Service Type** (dropdown): electricity, airtime, data, cable
- **Provider** (dropdown): Dynamically loaded based on service
- **Availability** (slider): 0-100%
- **Note** (textarea): Reason for change

### Features
- Show current status before update
- Real-time status preview
- Warning when crossing 80% threshold (triggers webhooks)
- Confirmation dialog before updating

### Service-Provider Mapping
```
electricity: [aedc, ekedc, ikedc, ibedc, eedc, phed, jedc, kaedco, kedco, yedc, bedc, yedco, aba]
airtime: [mtn, airtel, glo, 9mobile]
data: [mtn, airtel, glo, 9mobile]
cable: [dstv, gotv, startimes]
```

---

## 5. Admin Delivery History View

**Route:** `/admin/webhook-deliveries`

**API:** `GET /api/admin/webhook-deliveries`

### Query Parameters
- `user_id`: Filter by user
- `status`: success/failed/pending
- `service`: Service type
- `from`, `to`: Date range
- `limit`, `offset`: Pagination

### Display Information
- User email and ID
- Webhook URL
- Delivery status and details
- Summary statistics (total, success rate, failure rate)

### Features
- Advanced filtering
- Export to CSV
- View details for any delivery
- Retry failed deliveries

---

## API Reference Summary

### Public Endpoints (Authenticated Users)
```
GET  /api/availability/all
GET  /api/availability/{service}
GET  /api/availability/{service}?provider={provider}
GET  /api/webhooks
POST /api/webhooks
GET  /api/webhooks/{id}
PUT  /api/webhooks/{id}
DELETE /api/webhooks/{id}
GET  /api/webhooks/{id}/deliveries
```

### Admin Endpoints
```
POST /api/admin/availability
GET  /api/admin/webhook-deliveries
```

---

## UI/UX Best Practices

1. **Loading States**: Show spinners during API calls
2. **Error Handling**: Display user-friendly error messages
3. **Confirmations**: Ask before destructive actions (delete, update)
4. **Real-time Updates**: Auto-refresh availability data
5. **Responsive Design**: Mobile-friendly layouts
6. **Accessibility**: Proper labels, ARIA attributes
7. **Visual Feedback**: Success/error toasts after actions

---

## Sample Implementations

See the full implementation guide with React code examples at:
`/docs/PARTNER_INTEGRATION_GUIDE.md`

This includes complete working code for all components with proper state management, API integration, and error handling.
