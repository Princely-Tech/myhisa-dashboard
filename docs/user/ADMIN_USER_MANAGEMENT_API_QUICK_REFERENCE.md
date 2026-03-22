# Admin User Management API - Quick Reference

## Base URL

```
/api/admin
```

## Authentication

All endpoints require admin/staff authentication via Bearer token.

---

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/user/:userID/approve` | Approve user and verify email |
| GET | `/user/:userID/api-key` | View user's API key |
| POST | `/user/:userID/refresh-api-key` | Generate new API key |
| POST | `/user/:userID/block-wallet` | Block user's wallet |
| POST | `/user/:userID/unblock-wallet` | Unblock user's wallet |

---

## Quick Examples

### Approve User

```bash
curl -X POST "http://localhost:8080/api/admin/user/24/approve" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Effect**: Sets `approved_at` and `email_verified_at` to current timestamp.

---

### Get User API Key

```bash
curl -X GET "http://localhost:8080/api/admin/user/24/api-key" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "message": "Successful",
  "data": {
    "user_id": 24,
    "user_name": "John Doe",
    "user_email": "john@example.com",
    "api_key": "john@example.com_a1b2c3d4e5f6g7h"
  }
}
```

---

### Refresh User API Key

```bash
curl -X POST "http://localhost:8080/api/admin/user/24/refresh-api-key" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Effect**: Generates new API key, invalidates old key immediately.

**Response**:
```json
{
  "message": "API key refreshed successfully",
  "data": {
    "user_id": 24,
    "user_name": "John Doe",
    "user_email": "john@example.com",
    "api_key": "john@example.com_x9y8z7w6v5u4t3s"
  }
}
```

---

### Block Wallet

```bash
curl -X POST "http://localhost:8080/api/admin/user/24/block-wallet" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Suspicious activity detected"
  }'
```

**Effect**: Sets `is_account_active = false`, prevents all transactions.

---

### Unblock Wallet

```bash
curl -X POST "http://localhost:8080/api/admin/user/24/unblock-wallet" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "remark": "Issue resolved"
  }'
```

**Effect**: Sets `is_account_active = true`, restores transaction capabilities.

---

## Wallet Blocking Behavior

### When Blocked (`is_account_active = false`)

**Blocked Operations** ❌:
- Airtime purchases
- Data purchases
- Cable TV payments
- Electricity payments
- All wallet debits

**Allowed Operations** ✅:
- View balance
- View transaction history
- Admin manual credit/debit
- Receive bank transfers

### Error Message

When user attempts transaction with blocked wallet:
```
"wallet is blocked"
```

---

## Sample JavaScript Helper

```javascript
class AdminUserAPI {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async approveUser(userId) {
    const response = await fetch(`${this.baseUrl}/user/${userId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }

  async getUserApiKey(userId) {
    const response = await fetch(`${this.baseUrl}/user/${userId}/api-key`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }

  async refreshUserApiKey(userId) {
    const response = await fetch(`${this.baseUrl}/user/${userId}/refresh-api-key`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }

  async blockWallet(userId, reason) {
    const response = await fetch(`${this.baseUrl}/user/${userId}/block-wallet`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
    return response.json();
  }

  async unblockWallet(userId, remark) {
    const response = await fetch(`${this.baseUrl}/user/${userId}/unblock-wallet`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ remark })
    });
    return response.json();
  }
}

// Usage
const api = new AdminUserAPI('/api/admin', 'your-token');
await api.approveUser(24);
await api.blockWallet(24, 'Suspicious activity');
const apiKeyData = await api.getUserApiKey(24);
```

---

## Common Workflows

### 1. Onboard New User

```bash
# 1. Approve user
POST /api/admin/user/24/approve

# Result: approved_at and email_verified_at are set
```

### 2. Handle Compromised API Key

```bash
# 1. View current key
GET /api/admin/user/24/api-key

# 2. Refresh key
POST /api/admin/user/24/refresh-api-key

# 3. Provide new key to user (via secure channel)
```

### 3. Handle Suspicious Activity

```bash
# 1. Block wallet immediately
POST /api/admin/user/24/block-wallet
{"reason": "Multiple failed transactions"}

# 2. Investigate

# 3. Unblock after resolution
POST /api/admin/user/24/unblock-wallet
{"remark": "Verified with user - legitimate"}
```

---

## Response Format

### Success Response

```json
{
  "message": "Successful",
  "data": { ... }
}
```

### Error Response

```json
{
  "message": "Error description",
  "error": "Detailed error message"
}
```

---

## Important Notes

### User Approval
- Sets both `approved_at` and `email_verified_at`
- Records admin user ID in `approved_by`
- Idempotent - can be called multiple times safely

### API Key Management
- **Old key invalidated immediately** on refresh
- Cache automatically cleared
- Format: `{email}_{random_secret}`
- Notify user when key is refreshed

### Wallet Blocking
- **Immediate effect** - blocks all transactions instantly
- Block reason stored for audit
- User can still view account
- Admin can still credit/debit manually
- Unblock history preserved in `block_reason`

---

## Related Documentation

- **Full UI Guide**: `ADMIN_USER_MANAGEMENT_UI_GUIDE.md`
- **Commission Management**: `ADMIN_COMMISSION_MANAGEMENT_UI_GUIDE.md`
- **Transaction Management**: `ADMIN_TRANSACTION_MANAGEMENT_API.md`
