# Admin User Management - UI Implementation Guide

## Overview

This guide provides comprehensive documentation for implementing the admin user management UI. The system allows administrators to:

1. **Approve Users** - Set `approved_at` and `email_verified_at` timestamps
2. **View API Keys** - View any user's API key
3. **Refresh API Keys** - Generate new API keys on behalf of users
4. **Block Wallets** - Prevent users from making transactions
5. **Unblock Wallets** - Restore transaction capabilities

## Table of Contents

- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [UI Implementation Guide](#ui-implementation-guide)
- [Complete API Reference](#complete-api-reference)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

---

## Authentication

All endpoints require admin authentication. Include the authorization token in the request header:

```http
Authorization: Bearer {token}
```

**Base URL**: `/api/admin`

**Required Permission**: Staff or Admin role

---

## Data Models

### User Model (Relevant Fields)

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  email_verified_at?: string;      // ISO 8601 timestamp
  approved_at?: string;             // ISO 8601 timestamp
  approved_by?: number;             // Admin user ID
  rank: number;                     // 0=user, 1=staff, 2=admin
  api_key?: string;
  ban_code: number;                 // 0=no ban, >0=banned
  ban_admin_remarks?: string;
  created_at: string;
  wallet: Wallet;
}
```

### Wallet Model

```typescript
interface Wallet {
  id: number;
  user_id: number;
  balance: number;                  // In kobo (1/100 of currency)
  commission: number;               // In kobo
  bonus: number;                    // In kobo
  account_number?: string;
  account_name?: string;
  bank_name?: string;
  is_account_active: boolean;       // false = blocked
  block_reason?: string;
  blocked_at?: string;              // ISO 8601 timestamp
}
```

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/user/:userID/approve` | Approve user and verify email |
| GET | `/user/:userID/api-key` | View user's API key |
| POST | `/user/:userID/refresh-api-key` | Generate new API key for user |
| POST | `/user/:userID/block-wallet` | Block user's wallet |
| POST | `/user/:userID/unblock-wallet` | Unblock user's wallet |

---

## Complete API Reference

### 1. Approve User

**Endpoint**: `POST /api/admin/user/:userID/approve`

**Description**: Approve a user account and verify their email. This sets both `approved_at` and `email_verified_at` to the current timestamp.

**Request**:
```http
POST /api/admin/user/24/approve
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "message": "Successful",
  "data": {
    "id": 24,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+2348012345678",
    "email_verified_at": "2024-03-19T16:30:00Z",
    "approved_at": "2024-03-19T16:30:00Z",
    "approved_by": 1,
    "rank": 0,
    "ban_code": 0,
    "created_at": "2024-03-01T10:00:00Z",
    "wallet": {
      "balance": 500000,
      "commission": 15000,
      "bonus": 0,
      "account_number": "1234567890",
      "account_name": "John Doe",
      "bank_name": "Wema Bank",
      "is_account_active": true
    },
    "ban_admin_remarks": null,
    "deleted_at": null,
    "deleted_reason": null,
    "updated_at": "2024-03-19T16:30:00Z"
  }
}
```

**Notes**:
- If user is already approved, the endpoint returns success without changes
- Sets both `approved_at` and `email_verified_at` simultaneously
- Records the admin user ID who approved the account

---

### 2. Get User API Key

**Endpoint**: `GET /api/admin/user/:userID/api-key`

**Description**: View a user's API key. This is useful for troubleshooting or providing support.

**Request**:
```http
GET /api/admin/user/24/api-key
Authorization: Bearer {token}
```

**Response** (200 OK):
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

**Security Considerations**:
- API keys are sensitive credentials
- Only display to authorized admin users
- Consider masking part of the key in the UI (e.g., `john@...***...f6g7h`)
- Log all API key views for audit purposes

---

### 3. Refresh User API Key

**Endpoint**: `POST /api/admin/user/:userID/refresh-api-key`

**Description**: Generate a new API key for a user. This invalidates the old API key immediately.

**Request**:
```http
POST /api/admin/user/24/refresh-api-key
Authorization: Bearer {token}
```

**Response** (200 OK):
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

**Important Notes**:
- **The old API key is immediately invalidated**
- All existing integrations using the old key will fail
- User must update their applications with the new key
- Cache is automatically cleared for the old key
- Consider notifying the user via email about the key change

**Use Cases**:
- User reports compromised API key
- User lost their API key
- Security audit requires key rotation
- User requests key refresh

---

### 4. Block Wallet

**Endpoint**: `POST /api/admin/user/:userID/block-wallet`

**Description**: Block a user's wallet to prevent all transactions. When blocked, the user cannot make any purchases or transfers.

**Request**:
```http
POST /api/admin/user/24/block-wallet
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Suspicious activity detected - multiple failed transactions"
}
```

**Request Body**:
```typescript
{
  reason: string;  // Required - Reason for blocking the wallet
}
```

**Response** (200 OK):
```json
{
  "message": "Wallet blocked successfully",
  "data": {
    "id": 24,
    "name": "John Doe",
    "email": "john@example.com",
    "wallet": {
      "balance": 500000,
      "commission": 15000,
      "bonus": 0,
      "account_number": "1234567890",
      "account_name": "John Doe",
      "bank_name": "Wema Bank",
      "is_account_active": false,
      "block_reason": "Suspicious activity detected - multiple failed transactions",
      "blocked_at": "2024-03-19T16:45:00Z"
    }
  }
}
```

**Error Response** (400 Bad Request - Already Blocked):
```json
{
  "message": "Wallet is already blocked",
  "error": "Wallet is already blocked"
}
```

**Transaction Blocking Behavior**:
When a wallet is blocked (`is_account_active = false`), the following occurs:

1. **All transaction attempts fail** with error: `"wallet is blocked"`
2. **Affected operations**:
   - Airtime purchases
   - Data purchases
   - Cable TV subscriptions
   - Electricity payments
   - Any debit from wallet balance

3. **Unaffected operations**:
   - Viewing balance
   - Viewing transaction history
   - Admin crediting the wallet
   - Receiving funds (if applicable)

**Important Notes**:
- Blocking is immediate - takes effect instantly
- User can still log in and view their account
- User cannot perform any transactions
- Admin can still credit/debit the wallet manually
- Block reason is stored for audit purposes

---

### 5. Unblock Wallet

**Endpoint**: `POST /api/admin/user/:userID/unblock-wallet`

**Description**: Unblock a user's wallet to restore transaction capabilities.

**Request**:
```http
POST /api/admin/user/24/unblock-wallet
Authorization: Bearer {token}
Content-Type: application/json

{
  "remark": "Issue resolved - verified with user"
}
```

**Request Body**:
```typescript
{
  remark: string;  // Required - Reason for unblocking the wallet
}
```

**Response** (200 OK):
```json
{
  "message": "Wallet unblocked successfully",
  "data": {
    "id": 24,
    "name": "John Doe",
    "email": "john@example.com",
    "wallet": {
      "balance": 500000,
      "commission": 15000,
      "bonus": 0,
      "account_number": "1234567890",
      "account_name": "John Doe",
      "bank_name": "Wema Bank",
      "is_account_active": true,
      "block_reason": "BLOCKED: Suspicious activity detected - multiple failed transactions | UNBLOCKED: Issue resolved - verified with user",
      "blocked_at": "2024-03-19T16:45:00Z"
    }
  }
}
```

**Error Response** (400 Bad Request - Not Blocked):
```json
{
  "message": "Wallet is not blocked",
  "error": "Wallet is already active"
}
```

**Important Notes**:
- Unblocking is immediate - user can transact right away
- Block history is preserved in `block_reason` field
- Format: `"BLOCKED: {original_reason} | UNBLOCKED: {unblock_remark}"`
- Original `blocked_at` timestamp is retained for audit

---

## UI Implementation Guide

### Page Structure

The user management UI should consist of the following components:

#### 1. User Profile View

Display user information with action buttons for admin operations.

**Sample React Component**:

```tsx
import React, { useState, useEffect } from 'react';

interface UserProfileProps {
  userId: number;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/user/${userId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setUser(data.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="user-profile">
      <h2>User Profile</h2>
      
      <div className="user-info">
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Phone:</strong> {user.phone}</p>
        <p><strong>User ID:</strong> {user.id}</p>
        
        <div className="status-badges">
          {user.email_verified_at ? (
            <span className="badge badge-success">Email Verified</span>
          ) : (
            <span className="badge badge-warning">Email Not Verified</span>
          )}
          
          {user.approved_at ? (
            <span className="badge badge-success">Approved</span>
          ) : (
            <span className="badge badge-warning">Pending Approval</span>
          )}
          
          {user.wallet.is_account_active ? (
            <span className="badge badge-success">Wallet Active</span>
          ) : (
            <span className="badge badge-danger">Wallet Blocked</span>
          )}
        </div>
      </div>

      <div className="wallet-info">
        <h3>Wallet Information</h3>
        <p><strong>Balance:</strong> ₦{(user.wallet.balance / 100).toFixed(2)}</p>
        <p><strong>Commission:</strong> ₦{(user.wallet.commission / 100).toFixed(2)}</p>
        <p><strong>Account Number:</strong> {user.wallet.account_number}</p>
        <p><strong>Bank:</strong> {user.wallet.bank_name}</p>
        
        {!user.wallet.is_account_active && (
          <div className="alert alert-danger">
            <strong>Wallet Blocked</strong>
            <p>Reason: {user.wallet.block_reason}</p>
            <p>Blocked At: {new Date(user.wallet.blocked_at).toLocaleString()}</p>
          </div>
        )}
      </div>

      <UserActions user={user} onUpdate={fetchUserProfile} />
    </div>
  );
};
```

#### 2. User Actions Component

Provide action buttons for admin operations.

```tsx
interface UserActionsProps {
  user: User;
  onUpdate: () => void;
}

const UserActions: React.FC<UserActionsProps> = ({ user, onUpdate }) => {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (!confirm('Approve this user? This will verify their email and activate their account.')) {
      return;
    }

    setLoading(true);
    try {
      await fetch(`/api/admin/user/${user.id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      alert('User approved successfully');
      onUpdate();
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockWallet = async () => {
    const reason = prompt('Enter reason for blocking wallet:');
    if (!reason) return;

    setLoading(true);
    try {
      await fetch(`/api/admin/user/${user.id}/block-wallet`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      alert('Wallet blocked successfully');
      onUpdate();
    } catch (error) {
      console.error('Error blocking wallet:', error);
      alert('Failed to block wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockWallet = async () => {
    const remark = prompt('Enter reason for unblocking wallet:');
    if (!remark) return;

    setLoading(true);
    try {
      await fetch(`/api/admin/user/${user.id}/unblock-wallet`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ remark })
      });
      alert('Wallet unblocked successfully');
      onUpdate();
    } catch (error) {
      console.error('Error unblocking wallet:', error);
      alert('Failed to unblock wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-actions">
      <h3>Admin Actions</h3>
      
      {!user.approved_at && (
        <button 
          onClick={handleApprove} 
          disabled={loading}
          className="btn btn-primary"
        >
          Approve User
        </button>
      )}

      {user.wallet.is_account_active ? (
        <button 
          onClick={handleBlockWallet} 
          disabled={loading}
          className="btn btn-danger"
        >
          Block Wallet
        </button>
      ) : (
        <button 
          onClick={handleUnblockWallet} 
          disabled={loading}
          className="btn btn-success"
        >
          Unblock Wallet
        </button>
      )}

      <ApiKeyManager userId={user.id} />
    </div>
  );
};
```

#### 3. API Key Manager Component

Manage user API keys with view and refresh capabilities.

```tsx
interface ApiKeyManagerProps {
  userId: number;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ userId }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchApiKey = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/user/${userId}/api-key`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setApiKey(data.data.api_key);
      setShowKey(true);
    } catch (error) {
      console.error('Error fetching API key:', error);
      alert('Failed to fetch API key');
    } finally {
      setLoading(false);
    }
  };

  const refreshApiKey = async () => {
    if (!confirm('Refresh API key? This will invalidate the current key immediately. The user will need to update their integrations.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/user/${userId}/refresh-api-key`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setApiKey(data.data.api_key);
      setShowKey(true);
      alert('API key refreshed successfully. Please provide the new key to the user.');
    } catch (error) {
      console.error('Error refreshing API key:', error);
      alert('Failed to refresh API key');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    alert('API key copied to clipboard');
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 20) return key;
    return `${key.substring(0, 10)}...${key.substring(key.length - 10)}`;
  };

  return (
    <div className="api-key-manager">
      <h4>API Key Management</h4>
      
      {!showKey ? (
        <button 
          onClick={fetchApiKey} 
          disabled={loading}
          className="btn btn-secondary"
        >
          View API Key
        </button>
      ) : (
        <div className="api-key-display">
          <div className="key-container">
            <code>{maskApiKey(apiKey)}</code>
            <button onClick={copyToClipboard} className="btn btn-sm">
              Copy Full Key
            </button>
          </div>
          
          <div className="alert alert-warning">
            <strong>Security Notice:</strong> API keys are sensitive credentials. 
            Only share with the user through secure channels.
          </div>
        </div>
      )}

      <button 
        onClick={refreshApiKey} 
        disabled={loading}
        className="btn btn-warning"
      >
        Refresh API Key
      </button>
    </div>
  );
};
```

---

## Complete Workflow Examples

### Scenario 1: Approving a New User

1. **Admin reviews new user registration**
   ```javascript
   GET /api/admin/users/unapproved
   ```

2. **Admin views user profile**
   ```javascript
   GET /api/admin/user/24
   ```

3. **Admin approves user**
   ```javascript
   POST /api/admin/user/24/approve
   ```

4. **Result**: User's `approved_at` and `email_verified_at` are set, user can now access full platform features

### Scenario 2: Handling Compromised API Key

1. **User reports API key compromise**

2. **Admin views current API key**
   ```javascript
   GET /api/admin/user/24/api-key
   ```

3. **Admin refreshes API key**
   ```javascript
   POST /api/admin/user/24/refresh-api-key
   ```

4. **Admin provides new key to user** (via secure channel)

5. **Old key is immediately invalidated**, all requests with old key fail

### Scenario 3: Blocking Suspicious Account

1. **Fraud detection system flags account**

2. **Admin reviews account activity**

3. **Admin blocks wallet**
   ```javascript
   POST /api/admin/user/24/block-wallet
   {
     "reason": "Multiple failed transactions from different IPs - suspected fraud"
   }
   ```

4. **User's transaction attempts fail** with error: "wallet is blocked"

5. **Admin investigates and resolves issue**

6. **Admin unblocks wallet**
   ```javascript
   POST /api/admin/user/24/unblock-wallet
   {
     "remark": "Verified with user - legitimate activity confirmed"
   }
   ```

7. **User can transact again immediately**

---

## Error Handling

### Common Error Responses

**400 Bad Request** - Invalid input or state
```json
{
  "message": "Wallet is already blocked",
  "error": "Wallet is already blocked"
}
```

**404 Not Found** - User or resource not found
```json
{
  "message": "Invalid user ID",
  "error": "Invalid user ID",
  "errors": {
    "user_id": ["Invalid user ID"]
  }
}
```

**422 Unprocessable Entity** - Validation error
```json
{
  "message": "Validation failed",
  "error": "Validation error",
  "errors": {
    "reason": ["The reason field is required"]
  }
}
```

**500 Internal Server Error** - Server error
```json
{
  "message": "Failed to block wallet",
  "error": "database connection error"
}
```

### Error Handling in UI

```typescript
const handleApiCall = async (apiCall: () => Promise<Response>) => {
  try {
    const response = await apiCall();
    const data = await response.json();
    
    if (!response.ok) {
      if (data.errors) {
        // Validation errors
        const errorMessages = Object.values(data.errors).flat().join(', ');
        throw new Error(errorMessages);
      }
      throw new Error(data.message || 'An error occurred');
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message);
    } else {
      alert('An unexpected error occurred');
    }
    throw error;
  }
};
```

---

## Best Practices

### 1. User Approval

**When to Approve**:
- User has completed KYC verification
- User's email has been verified (if separate process)
- User meets platform requirements
- No red flags in initial screening

**Approval Process**:
1. Review user information
2. Verify email address is valid
3. Check for duplicate accounts
4. Approve with single action (sets both timestamps)

### 2. API Key Management

**Security Best Practices**:
- **Never log API keys** in plain text
- **Mask keys in UI** - show only first/last characters
- **Use HTTPS only** for key transmission
- **Audit all key views** - log who viewed which keys
- **Notify users** when their key is refreshed
- **Provide secure channel** for sharing new keys (email, encrypted message)

**When to Refresh**:
- User reports key compromise
- Security audit requires rotation
- User loses access to key
- Suspicious activity detected
- Regular security policy (e.g., every 90 days)

### 3. Wallet Blocking

**When to Block**:
- Suspicious transaction patterns
- Multiple failed transactions
- User reports unauthorized access
- Compliance requirements
- Fraud detection alerts
- User requests temporary suspension

**Blocking Best Practices**:
- **Always provide clear reason** - helps with audit trail
- **Document thoroughly** - include ticket numbers, investigation details
- **Notify user** - send email explaining the block
- **Set timeline** - inform user of resolution timeframe
- **Monitor impact** - check if block affects legitimate operations

**When to Unblock**:
- Issue resolved and verified
- User identity confirmed
- Fraud investigation complete
- User request with valid reason
- Compliance requirements met

### 4. Audit Trail

**Log All Actions**:
- User approvals (who, when, which user)
- API key views (who viewed, when)
- API key refreshes (who, when, old key, new key)
- Wallet blocks (who, when, reason)
- Wallet unblocks (who, when, remark)

**Audit Log Format**:
```typescript
{
  action: 'wallet_blocked',
  admin_user_id: 1,
  target_user_id: 24,
  timestamp: '2024-03-19T16:45:00Z',
  details: {
    reason: 'Suspicious activity detected',
    previous_state: 'active',
    new_state: 'blocked'
  }
}
```

### 5. UI/UX Recommendations

**Display**:
- Use color-coded badges for status (green=active, red=blocked, yellow=pending)
- Show timestamps for all state changes
- Display block reasons prominently
- Provide quick actions for common operations

**Confirmations**:
- Require confirmation for destructive actions (block, refresh key)
- Show impact of action before confirming
- Provide undo option where possible

**Feedback**:
- Show loading states during API calls
- Display success/error messages clearly
- Auto-refresh data after updates
- Provide detailed error messages

**Security**:
- Mask sensitive data (API keys, partial account numbers)
- Require re-authentication for sensitive operations
- Log all admin actions for audit
- Implement role-based access control

---

## Transaction Blocking Details

### How Wallet Blocking Works

When a wallet is blocked (`is_account_active = false`), the `DebitForTransaction` method in the User model checks the wallet status:

```go
func (u *User) DebitForTransaction(amount int64, transactionID string, description string) (int64, error) {
    wallet := u.GetWallet()
    balanceBefore := wallet.Balance

    // Check if wallet is blocked
    if !wallet.IsAccountActive {
        return balanceBefore, fmt.Errorf("wallet is blocked")
    }

    // ... rest of transaction logic
}
```

### Blocked Operations

When wallet is blocked, these operations **FAIL**:
- ✗ Airtime purchases
- ✗ Data purchases
- ✗ Cable TV payments
- ✗ Electricity payments
- ✗ Any transaction requiring wallet debit

### Allowed Operations

When wallet is blocked, these operations **STILL WORK**:
- ✓ Viewing account balance
- ✓ Viewing transaction history
- ✓ Viewing commission earnings
- ✓ Admin manual credit/debit
- ✓ Receiving bank transfers (if applicable)
- ✓ Viewing profile information

---

## Testing Guide

### Test Cases

#### 1. Approve User
```bash
# Test approving unapproved user
POST /api/admin/user/24/approve

# Expected: approved_at and email_verified_at are set

# Test approving already approved user
POST /api/admin/user/24/approve

# Expected: Returns success without changes
```

#### 2. API Key Management
```bash
# Test viewing API key
GET /api/admin/user/24/api-key

# Expected: Returns current API key

# Test refreshing API key
POST /api/admin/user/24/refresh-api-key

# Expected: Returns new API key, old key invalidated
```

#### 3. Wallet Blocking
```bash
# Test blocking active wallet
POST /api/admin/user/24/block-wallet
{"reason": "Test block"}

# Expected: Wallet blocked, transactions fail

# Test blocking already blocked wallet
POST /api/admin/user/24/block-wallet
{"reason": "Test block"}

# Expected: Error - wallet already blocked

# Test unblocking blocked wallet
POST /api/admin/user/24/unblock-wallet
{"remark": "Test unblock"}

# Expected: Wallet unblocked, transactions work

# Test transaction with blocked wallet
POST /api/airtime
{"network": "MTN", "amount": 100, "phone": "08012345678"}

# Expected: Error - "wallet is blocked"
```

---

## Sample JavaScript Helper Class

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
```

---

## Related Documentation

- **User Management**: Existing user ban/unban functionality
- **Commission Management**: `ADMIN_COMMISSION_MANAGEMENT_UI_GUIDE.md`
- **Transaction Management**: `ADMIN_TRANSACTION_MANAGEMENT_API.md`

---

## Support and Troubleshooting

### Common Issues

**Issue**: User approved but still can't transact
- **Check**: Verify wallet is not blocked (`is_account_active = true`)
- **Check**: Verify user has sufficient balance
- **Check**: Check for user ban (`ban_code = 0`)

**Issue**: API key refresh doesn't work
- **Solution**: Verify old key is being invalidated from cache
- **Solution**: Check user email format is valid
- **Solution**: Ensure token secret is generated correctly

**Issue**: Wallet block doesn't prevent transactions
- **Solution**: Verify `DebitForTransaction` is being called
- **Solution**: Check wallet status is being fetched correctly
- **Solution**: Ensure database update was successful

**Issue**: Cannot unblock wallet
- **Solution**: Verify wallet is actually blocked
- **Solution**: Check for database constraints
- **Solution**: Ensure proper permissions

---

## Conclusion

This guide provides everything needed to implement a comprehensive admin user management UI. The API is designed to be secure, auditable, and easy to integrate.

Key features:
- ✓ One-click user approval with email verification
- ✓ Secure API key management with view and refresh
- ✓ Instant wallet blocking/unblocking
- ✓ Complete audit trail
- ✓ Clear error handling
- ✓ Transaction-level blocking enforcement

For additional support or questions, refer to the related documentation or contact the development team.
