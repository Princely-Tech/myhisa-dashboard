# Test Beneficiary System - API Documentation

## Overview

The Test Beneficiary System allows partners to test services (Airtime, Data, Cable, Electricity) on pre-registered beneficiaries with a maximum transaction limit of **₦5,000 per transaction**. This system requires OTP verification for adding beneficiaries, similar to the bulk airtime campaign process.

---

## Table of Contents

- [Features](#features)
- [Authentication](#authentication)
- [Beneficiary Management](#beneficiary-management)
- [Test Transactions](#test-transactions)
- [Transaction History](#transaction-history)
- [Error Handling](#error-handling)
- [Complete Examples](#complete-examples)

---

## Features

### ✅ Key Capabilities

1. **Add Beneficiaries**: Register phone numbers, smartcard numbers, or meter numbers for testing
2. **OTP Verification**: Secure verification via SMS OTP (4-digit, 10-minute validity)
3. **Transaction Limits**: Maximum ₦5,000 per test transaction
4. **Service Support**: Airtime, Data, Cable TV, and Electricity
5. **Usage Tracking**: Track total spent and usage count per beneficiary
6. **Transaction History**: View all test transactions with detailed information

### ✅ Transaction Limits

- **Maximum per transaction**: ₦5,000.00 (500,000 kobo)
- **Minimum Airtime**: ₦50.00
- **Minimum Electricity**: ₦1,000.00
- **Data/Cable**: Product-dependent (must not exceed ₦5,000)

---

## Authentication

All endpoints require authentication via Bearer token in the Authorization header.

```bash
Authorization: Bearer YOUR_API_KEY
```

---

## Beneficiary Management

### 1. Add Beneficiary

**Endpoint**: `POST /api/test/beneficiaries`

**Description**: Creates a new test beneficiary and sends OTP for verification.

**Request Body**:

```json
{
  "type": "airtime",           // Required: airtime, data, cable, electricity
  "identifier": "08012345678", // Required: phone, smartcard, or meter number
  "network": "mtn",            // Required for airtime/data: mtn, airtel, glo, 9mobile
  "biller_code": "dstv",       // Required for cable/electricity
  "name": "John Doe"           // Optional: beneficiary name
}
```

**Success Response (200 OK)**:

```json
{
  "message": "Beneficiary created. Please verify with OTP sent to your phone",
  "beneficiary": {
    "id": 123,
    "type": "airtime",
    "identifier": "08012345678",
    "network": "mtn",
    "biller_code": "",
    "name": "John Doe",
    "is_verified": false,
    "otp_expires_at": "2026-03-27T10:25:00Z"
  }
}
```

**Error Responses**:

```json
// Duplicate beneficiary
{
  "error": "This beneficiary already exists",
  "beneficiary_id": 123
}

// Invalid type
{
  "error": "Invalid beneficiary type. Must be one of: airtime, data, cable, electricity"
}

// Invalid phone number
{
  "error": "invalid phone number: 080123"
}
```

**Example Requests**:

```bash
# Add airtime beneficiary
curl -X POST https://api.airtimereport.com/api/test/beneficiaries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "airtime",
    "identifier": "08012345678",
    "network": "mtn",
    "name": "Test User"
  }'

# Add cable beneficiary
curl -X POST https://api.airtimereport.com/api/test/beneficiaries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "cable",
    "identifier": "1234567890",
    "biller_code": "dstv",
    "name": "My DSTV"
  }'

# Add electricity beneficiary
curl -X POST https://api.airtimereport.com/api/test/beneficiaries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "electricity",
    "identifier": "12345678901234",
    "biller_code": "ekedc",
    "name": "Home Meter"
  }'
```

---

### 2. Verify Beneficiary

**Endpoint**: `POST /api/test/beneficiaries/verify`

**Description**: Verifies a beneficiary using the OTP sent via SMS.

**Request Body**:

```json
{
  "beneficiary_id": 123,
  "otp": "1234"
}
```

**Success Response (200 OK)**:

```json
{
  "message": "Beneficiary verified successfully",
  "beneficiary": {
    "id": 123,
    "type": "airtime",
    "identifier": "08012345678",
    "network": "mtn",
    "biller_code": "",
    "name": "John Doe",
    "is_verified": true,
    "verified_at": "2026-03-27T10:20:00Z"
  }
}
```

**Error Responses**:

```json
// Invalid OTP
{
  "error": "Invalid OTP"
}

// Expired OTP
{
  "error": "OTP has expired"
}

// Already verified
{
  "error": "Beneficiary already verified"
}

// Not found
{
  "error": "Beneficiary not found"
}
```

**Example**:

```bash
curl -X POST https://api.airtimereport.com/api/test/beneficiaries/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiary_id": 123,
    "otp": "1234"
  }'
```

---

### 3. List Beneficiaries

**Endpoint**: `GET /api/test/beneficiaries`

**Description**: Retrieves all test beneficiaries for the authenticated user.

**Query Parameters**:
- `type` (optional): Filter by type (airtime, data, cable, electricity)

**Success Response (200 OK)**:

```json
{
  "beneficiaries": [
    {
      "id": 123,
      "type": "airtime",
      "identifier": "08012345678",
      "network": "mtn",
      "biller_code": "",
      "name": "John Doe",
      "is_verified": true,
      "verified_at": "2026-03-27T10:20:00Z",
      "last_used_at": "2026-03-27T11:00:00Z",
      "usage_count": 5,
      "total_spent": 15000.00,
      "created_at": "2026-03-27T10:15:00Z"
    },
    {
      "id": 124,
      "type": "cable",
      "identifier": "1234567890",
      "network": "",
      "biller_code": "dstv",
      "name": "My DSTV",
      "is_verified": true,
      "verified_at": "2026-03-27T10:25:00Z",
      "last_used_at": null,
      "usage_count": 0,
      "total_spent": 0.00,
      "created_at": "2026-03-27T10:20:00Z"
    }
  ],
  "total": 2
}
```

**Examples**:

```bash
# Get all beneficiaries
curl -X GET https://api.airtimereport.com/api/test/beneficiaries \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get only airtime beneficiaries
curl -X GET "https://api.airtimereport.com/api/test/beneficiaries?type=airtime" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get only cable beneficiaries
curl -X GET "https://api.airtimereport.com/api/test/beneficiaries?type=cable" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Delete Beneficiary

**Endpoint**: `DELETE /api/test/beneficiaries/:id`

**Description**: Deletes a test beneficiary.

**Success Response (200 OK)**:

```json
{
  "message": "Beneficiary deleted successfully"
}
```

**Error Response**:

```json
{
  "error": "Beneficiary not found"
}
```

**Example**:

```bash
curl -X DELETE https://api.airtimereport.com/api/test/beneficiaries/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Test Transactions

### 1. Test Airtime Purchase

**Endpoint**: `POST /api/test/airtime`

**Description**: Purchases airtime for a verified beneficiary (max ₦5,000).

**Request Body**:

```json
{
  "beneficiary_id": 123,
  "amount": 100000  // Amount in kobo (₦1,000.00)
}
```

**Success Response (200 OK)**:

```json
{
  "message": "Test airtime purchase successful",
  "transaction": {
    "transaction_id": "3690857966504513536",
    "beneficiary_id": 123,
    "phone": "08012345678",
    "network": "mtn",
    "amount": 1000.00,
    "status": "successful",
    "external_ref": "EXT123456"
  }
}
```

**Error Responses**:

```json
// Exceeds limit
{
  "error": "Amount exceeds maximum test limit of ₦5,000.00"
}

// Below minimum
{
  "error": "Minimum amount is ₦50"
}

// Not verified
{
  "error": "beneficiary not verified. Please verify with OTP first"
}

// Type mismatch
{
  "error": "beneficiary type mismatch. Expected airtime, got data"
}

// Purchase failed
{
  "error": "Airtime purchase failed: insufficient balance",
  "transaction_id": "3690857966504513536"
}
```

**Example**:

```bash
# Purchase ₦1,000 airtime
curl -X POST https://api.airtimereport.com/api/test/airtime \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiary_id": 123,
    "amount": 100000
  }'
```

---

### 2. Test Data Purchase

**Endpoint**: `POST /api/test/data`

**Description**: Purchases data for a verified beneficiary (max ₦5,000).

**Request Body**:

```json
{
  "beneficiary_id": 124,
  "product_code": "M1"  // Data product code
}
```

**Success Response (200 OK)**:

```json
{
  "message": "Test data purchase successful",
  "transaction": {
    "transaction_id": "3690857966504513537",
    "beneficiary_id": 124,
    "phone": "08012345678",
    "network": "mtn",
    "product": "1GB - 30 Days",
    "amount": 500.00,
    "status": "successful",
    "external_ref": "EXT123457"
  }
}
```

**Error Responses**:

```json
// Product exceeds limit
{
  "error": "Data product amount exceeds maximum test limit of ₦5,000.00"
}

// Invalid product
{
  "error": "Invalid data product"
}
```

**Example**:

```bash
curl -X POST https://api.airtimereport.com/api/test/data \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiary_id": 124,
    "product_code": "M1"
  }'
```

---

### 3. Test Cable Subscription

**Endpoint**: `POST /api/test/cable`

**Description**: Subscribes to cable TV for a verified beneficiary (max ₦5,000).

**Request Body**:

```json
{
  "beneficiary_id": 125,
  "product_code": "DSTV-COMPACT"
}
```

**Success Response (200 OK)**:

```json
{
  "message": "Test cable subscription successful",
  "transaction": {
    "transaction_id": "3690857966504513538",
    "beneficiary_id": 125,
    "smartcard": "1234567890",
    "biller": "dstv",
    "product": "DStv Compact",
    "amount": 4500.00,
    "status": "successful",
    "external_ref": "EXT123458"
  }
}
```

**Error Responses**:

```json
// Product exceeds limit
{
  "error": "Cable product amount exceeds maximum test limit of ₦5,000.00"
}

// Invalid product
{
  "error": "Invalid cable product"
}
```

**Example**:

```bash
curl -X POST https://api.airtimereport.com/api/test/cable \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiary_id": 125,
    "product_code": "DSTV-COMPACT"
  }'
```

---

### 4. Test Electricity Purchase

**Endpoint**: `POST /api/test/electricity`

**Description**: Purchases electricity for a verified beneficiary (max ₦5,000).

**Request Body**:

```json
{
  "beneficiary_id": 126,
  "amount": 300000  // Amount in kobo (₦3,000.00)
}
```

**Success Response (200 OK)**:

```json
{
  "message": "Test electricity purchase successful",
  "transaction": {
    "transaction_id": "3690857966504513539",
    "beneficiary_id": 126,
    "meter_number": "12345678901234",
    "biller": "ekedc",
    "amount": 3000.00,
    "status": "successful",
    "token": "1234-5678-9012-3456-7890",
    "external_ref": "EXT123459"
  }
}
```

**Error Responses**:

```json
// Exceeds limit
{
  "error": "Amount exceeds maximum test limit of ₦5,000.00"
}

// Below minimum
{
  "error": "Minimum amount is ₦1,000"
}
```

**Example**:

```bash
curl -X POST https://api.airtimereport.com/api/test/electricity \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiary_id": 126,
    "amount": 300000
  }'
```

---

## Transaction History

### Get Test Transactions

**Endpoint**: `GET /api/test/beneficiaries/transactions`

**Description**: Retrieves all test transactions for the authenticated user.

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `beneficiary_id` (optional): Filter by beneficiary ID

**Success Response (200 OK)**:

```json
{
  "transactions": [
    {
      "id": 1,
      "transaction_id": "3690857966504513536",
      "beneficiary_id": 123,
      "type": "airtime",
      "amount": 1000.00,
      "service_amount": 1000.00,
      "status": "successful",
      "network": "mtn",
      "biller_code": "",
      "product_code": "",
      "identifier": "08012345678",
      "beneficiary_name": "John Doe",
      "external_ref": "EXT123456",
      "error_message": null,
      "created_at": "2026-03-27T11:00:00Z"
    },
    {
      "id": 2,
      "transaction_id": "3690857966504513537",
      "beneficiary_id": 124,
      "type": "data",
      "amount": 500.00,
      "service_amount": 500.00,
      "status": "successful",
      "network": "mtn",
      "biller_code": "",
      "product_code": "M1",
      "identifier": "08012345678",
      "beneficiary_name": "John Doe",
      "external_ref": "EXT123457",
      "error_message": null,
      "created_at": "2026-03-27T11:05:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "total_pages": 2
  }
}
```

**Examples**:

```bash
# Get all test transactions
curl -X GET https://api.airtimereport.com/api/test/beneficiaries/transactions \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get transactions for specific beneficiary
curl -X GET "https://api.airtimereport.com/api/test/beneficiaries/transactions?beneficiary_id=123" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Pagination
curl -X GET "https://api.airtimereport.com/api/test/beneficiaries/transactions?page=2&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Error Handling

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid input or validation error |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - User doesn't own the resource |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error - Server-side error |

### Error Response Format

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Validation Errors

```json
// Invalid beneficiary type
{
  "error": "Invalid beneficiary type. Must be one of: airtime, data, cable, electricity"
}

// Invalid network
{
  "error": "Invalid network. Must be one of: mtn, airtel, glo, 9mobile"
}

// Invalid phone number
{
  "error": "invalid phone number: 080123"
}

// Amount exceeds limit
{
  "error": "Amount exceeds maximum test limit of ₦5,000.00"
}

// Beneficiary not verified
{
  "error": "beneficiary not verified. Please verify with OTP first"
}

// Type mismatch
{
  "error": "beneficiary type mismatch. Expected airtime, got data"
}
```

---

## Complete Examples

### Complete Flow: Add and Use Airtime Beneficiary

```javascript
// 1. Add beneficiary
const addResponse = await fetch('https://api.airtimereport.com/api/test/beneficiaries', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'airtime',
    identifier: '08012345678',
    network: 'mtn',
    name: 'Test User'
  })
});

const addData = await addResponse.json();
console.log('Beneficiary created:', addData.beneficiary.id);
console.log('OTP sent, expires at:', addData.beneficiary.otp_expires_at);

// 2. User receives OTP via SMS, then verify
const verifyResponse = await fetch('https://api.airtimereport.com/api/test/beneficiaries/verify', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    beneficiary_id: addData.beneficiary.id,
    otp: '1234' // OTP from SMS
  })
});

const verifyData = await verifyResponse.json();
console.log('Beneficiary verified:', verifyData.message);

// 3. Purchase airtime
const purchaseResponse = await fetch('https://api.airtimereport.com/api/test/airtime', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    beneficiary_id: addData.beneficiary.id,
    amount: 100000 // ₦1,000.00
  })
});

const purchaseData = await purchaseResponse.json();
console.log('Transaction ID:', purchaseData.transaction.transaction_id);
console.log('Status:', purchaseData.transaction.status);
```

### Complete Flow: Cable Subscription

```javascript
// 1. Add cable beneficiary
const response1 = await fetch('https://api.airtimereport.com/api/test/beneficiaries', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'cable',
    identifier: '1234567890',
    biller_code: 'dstv',
    name: 'My DSTV'
  })
});

const data1 = await response1.json();
const beneficiaryId = data1.beneficiary.id;

// 2. Verify with OTP
const response2 = await fetch('https://api.airtimereport.com/api/test/beneficiaries/verify', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    beneficiary_id: beneficiaryId,
    otp: '1234'
  })
});

// 3. Subscribe to cable
const response3 = await fetch('https://api.airtimereport.com/api/test/cable', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    beneficiary_id: beneficiaryId,
    product_code: 'DSTV-COMPACT'
  })
});

const data3 = await response3.json();
console.log('Subscription successful:', data3.transaction);
```

### View Transaction History

```javascript
// Get all test transactions
const response = await fetch('https://api.airtimereport.com/api/test/beneficiaries/transactions?page=1&limit=20', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

const data = await response.json();
console.log('Total transactions:', data.pagination.total);
data.transactions.forEach(tx => {
  console.log(`${tx.type}: ₦${tx.amount} - ${tx.status}`);
});
```

---

## Best Practices

### 1. OTP Handling

- OTP is valid for **10 minutes**
- Store `beneficiary_id` and `otp_expires_at` from add response
- Show countdown timer in UI
- Allow resending OTP by calling add endpoint again with same details

### 2. Amount Validation

Always validate amounts client-side before sending:

```javascript
function validateTestAmount(amount, type) {
  const MAX_AMOUNT = 500000; // ₦5,000 in kobo
  const MIN_AIRTIME = 5000;  // ₦50 in kobo
  const MIN_ELECTRICITY = 100000; // ₦1,000 in kobo
  
  if (amount > MAX_AMOUNT) {
    return 'Amount exceeds maximum test limit of ₦5,000';
  }
  
  if (type === 'airtime' && amount < MIN_AIRTIME) {
    return 'Minimum airtime amount is ₦50';
  }
  
  if (type === 'electricity' && amount < MIN_ELECTRICITY) {
    return 'Minimum electricity amount is ₦1,000';
  }
  
  return null; // Valid
}
```

### 3. Error Handling

```javascript
async function testAirtimePurchase(beneficiaryId, amount) {
  try {
    const response = await fetch('https://api.airtimereport.com/api/test/airtime', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ beneficiary_id: beneficiaryId, amount })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Handle error
      throw new Error(data.error || 'Purchase failed');
    }
    
    return data.transaction;
  } catch (error) {
    console.error('Test purchase error:', error.message);
    throw error;
  }
}
```

### 4. UI Display

```javascript
// Format beneficiary for display
function formatBeneficiary(beneficiary) {
  return {
    id: beneficiary.id,
    displayName: beneficiary.name || beneficiary.identifier,
    type: beneficiary.type.toUpperCase(),
    identifier: beneficiary.identifier,
    verified: beneficiary.is_verified,
    usageInfo: `Used ${beneficiary.usage_count} times, Total: ₦${beneficiary.total_spent.toFixed(2)}`
  };
}

// Format transaction for display
function formatTransaction(tx) {
  return {
    id: tx.transaction_id,
    type: tx.type.toUpperCase(),
    amount: `₦${tx.amount.toFixed(2)}`,
    status: tx.status,
    date: new Date(tx.created_at).toLocaleString(),
    recipient: tx.identifier
  };
}
```

---

## Summary

The Test Beneficiary System provides a secure way for partners to test services with these key features:

✅ **OTP Verification**: Secure beneficiary registration
✅ **Transaction Limits**: Maximum ₦5,000 per transaction
✅ **Multiple Services**: Airtime, Data, Cable, Electricity
✅ **Usage Tracking**: Monitor spending and usage per beneficiary
✅ **Complete History**: View all test transactions
✅ **Real Processing**: Uses actual service APIs (not simulated)

**Important Notes**:
- All test transactions are processed through real APIs
- Costs are debited from the user's wallet
- Maximum ₦5,000 per transaction enforced at API level
- Beneficiaries must be verified before use
- OTP expires after 10 minutes

For production use, partners should use the regular transaction endpoints without the `/test` prefix.
