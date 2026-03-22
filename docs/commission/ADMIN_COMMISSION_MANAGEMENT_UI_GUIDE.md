# Admin Commission Management - UI Implementation Guide

## Overview

This guide provides comprehensive documentation for implementing the admin commission management UI. The system allows administrators to view and manage commission rates for users at two levels:

1. **CommissionRate**: General commission rates for services (Airtime, Data, Cable, Electricity, etc.)
2. **BillerCommissionRate**: Specific commission rates per biller (e.g., individual electricity distribution companies)

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

```
Authorization: Bearer {token}
```

**Base URL**: `/api/admin`

**Required Permission**: Staff or Admin role

---

## Data Models

### CommissionRate Model

```typescript
interface CommissionRate {
  id: number;
  user_id: number;
  mtn: number;                    // Percentage (e.g., 3.5 for 3.5%)
  airtel: number;                 // Percentage
  ninemobile: number;             // Percentage
  glo: number;                    // Percentage
  dstv: number;                   // Percentage
  gotv: number;                   // Percentage
  startimes: number;              // Percentage
  spectranet: number;             // Percentage
  smile: number;                  // Percentage
  electricity: number;            // Percentage (fallback for electricity)
  no_bill_fee: boolean;           // If true, no bill fee is added
  use_commission_wallet: boolean; // If false, commission is reduced from amount to pay
  created_at: string;
  updated_at: string;
}
```

### BillerCommissionRate Model

```typescript
interface BillerCommissionRate {
  id: number;
  user_id: number;
  transaction_type: string;       // e.g., "Electricity"
  biller_code: string;            // e.g., "AEDC_PREPAID"
  rate: number;                   // Percentage (e.g., 0.5 for 0.5%)
  created_at: string;
  updated_at: string;
}
```

### ElectricityBiller Model

```typescript
interface ElectricityBiller {
  code: string;                   // e.g., "AEDC_PREPAID"
  name: string;                   // e.g., "Abuja Electricity Distribution Company (AEDC) - Prepaid"
  description: string;
  logo_url: string;
  disco: string;                  // e.g., "AEDC"
  meter_type: string;             // "prepaid" or "postpaid"
  providers: {
    bp: {
      code: string;
      supported: boolean;
    };
    cydene: {
      code: string;
      supported: boolean;
    };
  };
}
```

---

## API Endpoints

### 1. Get User Commission Rate

**Endpoint**: `GET /api/admin/user/:userID/commission-rate`

**Description**: Retrieve the general commission rate settings for a specific user.

**Request**:
```http
GET /api/admin/user/24/commission-rate
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
    "commission_rate": {
      "id": 1,
      "user_id": 24,
      "mtn": 3.5,
      "airtel": 3.0,
      "ninemobile": 2.5,
      "glo": 3.0,
      "dstv": 1.5,
      "gotv": 1.5,
      "startimes": 1.5,
      "spectranet": 2.0,
      "smile": 2.0,
      "electricity": 0.5,
      "no_bill_fee": false,
      "use_commission_wallet": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-03-19T14:20:00Z"
    }
  }
}
```

---

### 2. Update User Commission Rate

**Endpoint**: `PUT /api/admin/user/:userID/commission-rate`

**Description**: Update the general commission rate for a user. Only include fields you want to update.

**Request**:
```http
PUT /api/admin/user/24/commission-rate
Authorization: Bearer {token}
Content-Type: application/json

{
  "mtn": 4.0,
  "airtel": 3.5,
  "electricity": 0.8,
  "use_commission_wallet": true
}
```

**Response** (200 OK):
```json
{
  "message": "Commission rate updated successfully",
  "data": {
    "id": 1,
    "user_id": 24,
    "mtn": 4.0,
    "airtel": 3.5,
    "ninemobile": 2.5,
    "glo": 3.0,
    "dstv": 1.5,
    "gotv": 1.5,
    "startimes": 1.5,
    "spectranet": 2.0,
    "smile": 2.0,
    "electricity": 0.8,
    "no_bill_fee": false,
    "use_commission_wallet": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-03-19T15:45:00Z"
  }
}
```

---

### 3. Get User Biller Commission Rates

**Endpoint**: `GET /api/admin/user/:userID/biller-commission-rates`

**Description**: Retrieve all biller-specific commission rates for a user.

**Query Parameters**:
- `transaction_type` (optional, default: "Electricity"): Filter by transaction type

**Request**:
```http
GET /api/admin/user/24/biller-commission-rates?transaction_type=Electricity
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
    "transaction_type": "Electricity",
    "rates": [
      {
        "id": 1,
        "user_id": 24,
        "transaction_type": "Electricity",
        "biller_code": "AEDC_PREPAID",
        "rate": 0.5,
        "created_at": "2024-03-01T10:00:00Z",
        "updated_at": "2024-03-01T10:00:00Z"
      },
      {
        "id": 2,
        "user_id": 24,
        "transaction_type": "Electricity",
        "biller_code": "EKEDC_PREPAID",
        "rate": 0.6,
        "created_at": "2024-03-01T10:00:00Z",
        "updated_at": "2024-03-15T14:30:00Z"
      }
    ],
    "total_rates": 2
  }
}
```

---

### 4. Add Biller Commission Rate

**Endpoint**: `POST /api/admin/user/:userID/biller-commission-rate`

**Description**: Add a new biller-specific commission rate for a user.

**Request**:
```http
POST /api/admin/user/24/biller-commission-rate
Authorization: Bearer {token}
Content-Type: application/json

{
  "transaction_type": "Electricity",
  "biller_code": "IKEDC_PREPAID",
  "rate": 0.7
}
```

**Response** (200 OK):
```json
{
  "message": "Biller commission rate added successfully",
  "data": {
    "user_id": 24,
    "user_name": "John Doe",
    "rate": {
      "id": 3,
      "user_id": 24,
      "transaction_type": "Electricity",
      "biller_code": "IKEDC_PREPAID",
      "rate": 0.7,
      "created_at": "2024-03-19T16:00:00Z",
      "updated_at": "2024-03-19T16:00:00Z"
    }
  }
}
```

---

### 5. Update Biller Commission Rate

**Endpoint**: `PUT /api/admin/user/:userID/biller-commission-rate`

**Description**: Update an existing biller-specific commission rate.

**Request**:
```http
PUT /api/admin/user/24/biller-commission-rate
Authorization: Bearer {token}
Content-Type: application/json

{
  "transaction_type": "Electricity",
  "biller_code": "IKEDC_PREPAID",
  "rate": 0.9
}
```

**Response** (200 OK):
```json
{
  "message": "Biller commission rate updated successfully",
  "data": {
    "user_id": 24,
    "user_name": "John Doe",
    "rate": {
      "id": 3,
      "user_id": 24,
      "transaction_type": "Electricity",
      "biller_code": "IKEDC_PREPAID",
      "rate": 0.9,
      "created_at": "2024-03-19T16:00:00Z",
      "updated_at": "2024-03-19T16:30:00Z"
    }
  }
}
```

---

### 6. Delete Biller Commission Rate

**Endpoint**: `DELETE /api/admin/user/:userID/biller-commission-rate`

**Description**: Delete a biller-specific commission rate.

**Request**:
```http
DELETE /api/admin/user/24/biller-commission-rate
Authorization: Bearer {token}
Content-Type: application/json

{
  "transaction_type": "Electricity",
  "biller_code": "IKEDC_PREPAID"
}
```

**Response** (200 OK):
```json
{
  "message": "Biller commission rate deleted successfully",
  "data": {
    "user_id": 24,
    "user_name": "John Doe",
    "transaction_type": "Electricity",
    "biller_code": "IKEDC_PREPAID"
  }
}
```

---

### 7. Bulk Update Biller Commission Rates

**Endpoint**: `POST /api/admin/user/:userID/biller-commission-rates/bulk`

**Description**: Update multiple biller commission rates in a single request. This is useful for setting default rates for all electricity billers.

**Request**:
```http
POST /api/admin/user/24/biller-commission-rates/bulk
Authorization: Bearer {token}
Content-Type: application/json

{
  "rates": [
    {
      "transaction_type": "Electricity",
      "biller_code": "AEDC_PREPAID",
      "rate": 0.5
    },
    {
      "transaction_type": "Electricity",
      "biller_code": "AEDC_POSTPAID",
      "rate": 0.5
    },
    {
      "transaction_type": "Electricity",
      "biller_code": "EKEDC_PREPAID",
      "rate": 0.6
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "message": "Biller commission rates updated successfully",
  "data": {
    "user_id": 24,
    "user_name": "John Doe",
    "total_rates": 3
  }
}
```

---

### 8. Get Electricity Billers (Full Details)

**Endpoint**: `GET /api/admin/electricity-billers`

**Description**: Retrieve the complete list of electricity billers with all details including provider information.

**Request**:
```http
GET /api/admin/electricity-billers
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "message": "Successful",
  "data": {
    "billers": [
      {
        "code": "AEDC_PREPAID",
        "name": "Abuja Electricity Distribution Company (AEDC) - Prepaid",
        "description": "Prepaid electricity for Abuja region",
        "logo_url": "",
        "disco": "AEDC",
        "meter_type": "prepaid",
        "providers": {
          "bp": {
            "code": "ABUJA",
            "supported": true
          },
          "cydene": {
            "code": "abuja_electric_prepaid",
            "supported": true
          }
        }
      },
      {
        "code": "AEDC_POSTPAID",
        "name": "Abuja Electricity Distribution Company (AEDC) - Postpaid",
        "description": "Postpaid electricity for Abuja region",
        "logo_url": "",
        "disco": "AEDC",
        "meter_type": "postpaid",
        "providers": {
          "bp": {
            "code": "ABUJA",
            "supported": true
          },
          "cydene": {
            "code": "abuja_electric_postpaid",
            "supported": true
          }
        }
      }
    ],
    "total_billers": 24
  }
}
```

---

### 9. Get Electricity Biller Codes (Simplified)

**Endpoint**: `GET /api/admin/electricity-biller-codes`

**Description**: Retrieve a simplified list of electricity biller codes for dropdowns and selection lists.

**Request**:
```http
GET /api/admin/electricity-biller-codes
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "message": "Successful",
  "data": {
    "biller_codes": [
      {
        "code": "AEDC_PREPAID",
        "name": "Abuja Electricity Distribution Company (AEDC) - Prepaid",
        "description": "Prepaid electricity for Abuja region",
        "disco": "AEDC",
        "meter_type": "prepaid"
      },
      {
        "code": "AEDC_POSTPAID",
        "name": "Abuja Electricity Distribution Company (AEDC) - Postpaid",
        "description": "Postpaid electricity for Abuja region",
        "disco": "AEDC",
        "meter_type": "postpaid"
      },
      {
        "code": "EKEDC_PREPAID",
        "name": "Eko Electricity Distribution Company (EKEDC) - Prepaid",
        "description": "Prepaid electricity for Eko region",
        "disco": "EKEDC",
        "meter_type": "prepaid"
      }
    ],
    "total_billers": 24
  }
}
```

---

## UI Implementation Guide

### Page Structure

The commission management UI should consist of the following components:

#### 1. User Selection Component

```typescript
// Component to search and select a user
interface UserSelectorProps {
  onUserSelect: (userId: number) => void;
}
```

**Features**:
- Search users by name or email
- Display user ID, name, and email
- Select user to manage commissions

#### 2. General Commission Rate Form

Display and edit the `CommissionRate` for the selected user.

**Form Fields**:
- **Airtime Services**:
  - MTN (%)
  - Airtel (%)
  - 9mobile (%)
  - Glo (%)

- **Cable Services**:
  - DSTV (%)
  - GOTV (%)
  - Startimes (%)

- **Internet Services**:
  - Spectranet (%)
  - Smile (%)

- **Electricity** (Fallback):
  - Electricity (%)

- **Settings**:
  - No Bill Fee (checkbox)
  - Use Commission Wallet (checkbox)

**Sample React Component**:

```tsx
import React, { useState, useEffect } from 'react';

interface CommissionRateFormProps {
  userId: number;
}

const CommissionRateForm: React.FC<CommissionRateFormProps> = ({ userId }) => {
  const [commissionRate, setCommissionRate] = useState<CommissionRate | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCommissionRate();
  }, [userId]);

  const fetchCommissionRate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/user/${userId}/commission-rate`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      const data = await response.json();
      setCommissionRate(data.data.commission_rate);
    } catch (error) {
      console.error('Error fetching commission rate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updates: Partial<CommissionRate>) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/user/${userId}/commission-rate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      const data = await response.json();
      setCommissionRate(data.data);
      alert('Commission rate updated successfully');
    } catch (error) {
      console.error('Error updating commission rate:', error);
      alert('Failed to update commission rate');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!commissionRate) return <div>No commission rate found</div>;

  return (
    <div className="commission-rate-form">
      <h2>General Commission Rates</h2>
      
      <section>
        <h3>Airtime Services</h3>
        <div className="form-grid">
          <InputField
            label="MTN (%)"
            value={commissionRate.mtn}
            onChange={(value) => handleUpdate({ mtn: value })}
          />
          <InputField
            label="Airtel (%)"
            value={commissionRate.airtel}
            onChange={(value) => handleUpdate({ airtel: value })}
          />
          <InputField
            label="9mobile (%)"
            value={commissionRate.ninemobile}
            onChange={(value) => handleUpdate({ ninemobile: value })}
          />
          <InputField
            label="Glo (%)"
            value={commissionRate.glo}
            onChange={(value) => handleUpdate({ glo: value })}
          />
        </div>
      </section>

      <section>
        <h3>Cable Services</h3>
        <div className="form-grid">
          <InputField
            label="DSTV (%)"
            value={commissionRate.dstv}
            onChange={(value) => handleUpdate({ dstv: value })}
          />
          <InputField
            label="GOTV (%)"
            value={commissionRate.gotv}
            onChange={(value) => handleUpdate({ gotv: value })}
          />
          <InputField
            label="Startimes (%)"
            value={commissionRate.startimes}
            onChange={(value) => handleUpdate({ startimes: value })}
          />
        </div>
      </section>

      <section>
        <h3>Electricity (Fallback)</h3>
        <InputField
          label="Electricity (%)"
          value={commissionRate.electricity}
          onChange={(value) => handleUpdate({ electricity: value })}
        />
      </section>

      <section>
        <h3>Settings</h3>
        <CheckboxField
          label="No Bill Fee"
          checked={commissionRate.no_bill_fee}
          onChange={(checked) => handleUpdate({ no_bill_fee: checked })}
        />
        <CheckboxField
          label="Use Commission Wallet"
          checked={commissionRate.use_commission_wallet}
          onChange={(checked) => handleUpdate({ use_commission_wallet: checked })}
        />
      </section>
    </div>
  );
};
```

#### 3. Biller Commission Rate Manager

Manage biller-specific commission rates (e.g., for electricity billers).

**Features**:
- Display table of existing biller commission rates
- Add new biller commission rate
- Edit existing rates
- Delete rates
- Bulk update all billers with a default rate

**Sample React Component**:

```tsx
import React, { useState, useEffect } from 'react';

interface BillerCommissionManagerProps {
  userId: number;
}

const BillerCommissionManager: React.FC<BillerCommissionManagerProps> = ({ userId }) => {
  const [billerRates, setBillerRates] = useState<BillerCommissionRate[]>([]);
  const [billers, setBillers] = useState<ElectricityBiller[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBillerRates();
    fetchElectricityBillers();
  }, [userId]);

  const fetchBillerRates = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/user/${userId}/biller-commission-rates?transaction_type=Electricity`,
        {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        }
      );
      const data = await response.json();
      setBillerRates(data.data.rates);
    } catch (error) {
      console.error('Error fetching biller rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchElectricityBillers = async () => {
    try {
      const response = await fetch('/api/admin/electricity-biller-codes', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setBillers(data.data.biller_codes);
    } catch (error) {
      console.error('Error fetching billers:', error);
    }
  };

  const addBillerRate = async (billerCode: string, rate: number) => {
    try {
      await fetch(`/api/admin/user/${userId}/biller-commission-rate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transaction_type: 'Electricity',
          biller_code: billerCode,
          rate: rate
        })
      });
      fetchBillerRates();
      alert('Biller rate added successfully');
    } catch (error) {
      console.error('Error adding biller rate:', error);
      alert('Failed to add biller rate');
    }
  };

  const updateBillerRate = async (billerCode: string, rate: number) => {
    try {
      await fetch(`/api/admin/user/${userId}/biller-commission-rate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transaction_type: 'Electricity',
          biller_code: billerCode,
          rate: rate
        })
      });
      fetchBillerRates();
      alert('Biller rate updated successfully');
    } catch (error) {
      console.error('Error updating biller rate:', error);
      alert('Failed to update biller rate');
    }
  };

  const deleteBillerRate = async (billerCode: string) => {
    if (!confirm('Are you sure you want to delete this rate?')) return;
    
    try {
      await fetch(`/api/admin/user/${userId}/biller-commission-rate`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transaction_type: 'Electricity',
          biller_code: billerCode
        })
      });
      fetchBillerRates();
      alert('Biller rate deleted successfully');
    } catch (error) {
      console.error('Error deleting biller rate:', error);
      alert('Failed to delete biller rate');
    }
  };

  const bulkUpdateRates = async (defaultRate: number) => {
    const rates = billers.map(biller => ({
      transaction_type: 'Electricity',
      biller_code: biller.code,
      rate: defaultRate
    }));

    try {
      await fetch(`/api/admin/user/${userId}/biller-commission-rates/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rates })
      });
      fetchBillerRates();
      alert(`Successfully set ${rates.length} biller rates to ${defaultRate}%`);
    } catch (error) {
      console.error('Error bulk updating rates:', error);
      alert('Failed to bulk update rates');
    }
  };

  return (
    <div className="biller-commission-manager">
      <h2>Electricity Biller Commission Rates</h2>
      
      <div className="bulk-actions">
        <BulkUpdateForm onSubmit={bulkUpdateRates} />
      </div>

      <table className="biller-rates-table">
        <thead>
          <tr>
            <th>Biller Code</th>
            <th>Biller Name</th>
            <th>Rate (%)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {billers.map(biller => {
            const existingRate = billerRates.find(r => r.biller_code === biller.code);
            return (
              <BillerRateRow
                key={biller.code}
                biller={biller}
                rate={existingRate}
                onAdd={addBillerRate}
                onUpdate={updateBillerRate}
                onDelete={deleteBillerRate}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
```

---

## Complete Workflow Example

### Scenario: Setting up commissions for a new user

1. **Fetch User's Commission Rate**
   ```javascript
   GET /api/admin/user/24/commission-rate
   ```

2. **Update General Commission Rates**
   ```javascript
   PUT /api/admin/user/24/commission-rate
   {
     "mtn": 3.5,
     "airtel": 3.0,
     "electricity": 0.5,
     "use_commission_wallet": true
   }
   ```

3. **Fetch Electricity Billers**
   ```javascript
   GET /api/admin/electricity-biller-codes
   ```

4. **Set Default Rate for All Electricity Billers**
   ```javascript
   POST /api/admin/user/24/biller-commission-rates/bulk
   {
     "rates": [
       { "transaction_type": "Electricity", "biller_code": "AEDC_PREPAID", "rate": 0.5 },
       { "transaction_type": "Electricity", "biller_code": "AEDC_POSTPAID", "rate": 0.5 },
       // ... all 24 billers
     ]
   }
   ```

5. **Update Specific Biller Rate**
   ```javascript
   PUT /api/admin/user/24/biller-commission-rate
   {
     "transaction_type": "Electricity",
     "biller_code": "EKEDC_PREPAID",
     "rate": 0.8
   }
   ```

6. **Verify Biller Rates**
   ```javascript
   GET /api/admin/user/24/biller-commission-rates?transaction_type=Electricity
   ```

---

## Error Handling

### Common Error Responses

**400 Bad Request** - Invalid input
```json
{
  "message": "Invalid request body",
  "error": "Key: 'rate' Error:Field validation for 'rate' failed on the 'required' tag"
}
```

**404 Not Found** - User or resource not found
```json
{
  "message": "User not found",
  "error": "User not found"
}
```

**500 Internal Server Error** - Server error
```json
{
  "message": "Failed to update commission rate",
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

### 1. Commission Rate Hierarchy

The system uses a hierarchical approach for determining commission rates:

1. **BillerCommissionRate** (highest priority): If a specific biller rate exists, it's used
2. **CommissionRate.electricity** (fallback): If no biller-specific rate exists, the general electricity rate is used

**Example**:
- User has `CommissionRate.electricity = 0.5%`
- User has `BillerCommissionRate` for `EKEDC_PREPAID = 0.8%`
- Transaction for EKEDC_PREPAID → Uses **0.8%**
- Transaction for IKEDC_PREPAID (no specific rate) → Uses **0.5%**

### 2. Bulk Updates

When setting up a new user or changing default rates:
- Use the bulk update endpoint to set all billers at once
- Then use individual updates for exceptions

### 3. Validation

Always validate:
- Rate values are between 0 and 100
- User exists before making updates
- Biller codes are valid (check against electricity billers list)

### 4. Caching

The backend caches commission rates. After updates:
- Cache is automatically invalidated
- Fresh data is returned in the response
- No need to manually refresh

### 5. UI/UX Recommendations

**Display**:
- Show both general and biller-specific rates on the same page
- Use tabs or sections to organize different service types
- Highlight billers with custom rates vs. those using fallback

**Editing**:
- Inline editing for quick updates
- Bulk actions for setting default rates
- Confirmation dialogs for deletions

**Feedback**:
- Show loading states during API calls
- Display success/error messages
- Auto-refresh data after updates

---

## Available Electricity Billers

The system supports 24 electricity billers across 12 distribution companies:

| DISCO | Prepaid Code | Postpaid Code |
|-------|--------------|---------------|
| AEDC (Abuja) | AEDC_PREPAID | AEDC_POSTPAID |
| EKEDC (Eko) | EKEDC_PREPAID | EKEDC_POSTPAID |
| IKEDC (Ikeja) | IKEDC_PREPAID | IKEDC_POSTPAID |
| IBEDC (Ibadan) | IBEDC_PREPAID | IBEDC_POSTPAID |
| EEDC (Enugu) | EEDC_PREPAID | EEDC_POSTPAID |
| PHED (Port Harcourt) | PHED_PREPAID | PHED_POSTPAID |
| JEDC (Jos) | JEDC_PREPAID | JEDC_POSTPAID |
| KAEDCO (Kaduna) | KAEDCO_PREPAID | KAEDCO_POSTPAID |
| KEDCO (Kano) | KEDCO_PREPAID | KEDCO_POSTPAID |
| YEDC (Yola) | YEDC_PREPAID | YEDC_POSTPAID |
| BEDC (Benin) | BEDC_PREPAID | BEDC_POSTPAID |
| YEDCO (Borno) | YEDCO_PREPAID | YEDCO_POSTPAID |
| ABA Power | ABA_PREPAID | ABA_POSTPAID |

---

## Sample Seeder Usage

To seed default commission rates for a user using the command-line seeder:

```bash
# Set default rate for all electricity billers
USER_ID=24 DEFAULT_RATE=0.5 go run cmd/seeder/electricity_commission_seeder.go
```

This will set a 0.5% commission rate for all 24 electricity billers for user ID 24.

---

## Support and Troubleshooting

### Common Issues

**Issue**: Commission not being applied to transactions
- **Check**: Verify `use_commission_wallet` is set correctly
- **Check**: Ensure rate is greater than 0
- **Check**: Verify transaction type matches

**Issue**: Biller rate not found
- **Solution**: Check biller code matches exactly (case-sensitive)
- **Solution**: Verify transaction type is "Electricity"

**Issue**: Bulk update fails
- **Solution**: Ensure all biller codes are valid
- **Solution**: Check rate values are valid numbers

---

## Conclusion

This guide provides everything needed to implement a comprehensive commission management UI. The API is designed to be flexible and efficient, supporting both individual and bulk operations.

For additional support or questions, refer to the related documentation:
- `BILLER_COMMISSION_QUICK_START.md` - Quick start guide for biller commissions
- `cmd/seeder/README.md` - Seeder documentation
- `models/biller_commission_rate.go` - Model implementation details
