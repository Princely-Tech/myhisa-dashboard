# Admin API Documentation

This document provides comprehensive documentation for the new admin endpoints that allow administrators to view user credit history, transactions, and commissions.

## Table of Contents
1. [Authentication](#authentication)
2. [Credit History Endpoints](#credit-history-endpoints)
3. [Transaction Endpoints](#transaction-endpoints)
4. [Commission Endpoints](#commission-endpoints)
5. [Response Formats](#response-formats)
6. [Error Handling](#error-handling)

---

## Authentication

All admin endpoints require:
- **Authentication**: Bearer token in the `Authorization` header
- **Authorization**: User must have staff or admin role (enforced by `StaffOrAdmin()` middleware)

**Header Format:**
```
Authorization: Bearer <your_token_here>
```

---

## Credit History Endpoints

### 1. Get User Credit History

View the complete credit history for any user, including who credited them.

**Endpoint:** `GET /api/admin/user/:userID/credit-history`

**URL Parameters:**
- `userID` (required): The ID of the user whose credit history you want to view

**Query Parameters:**
- `page` (optional, default: 1): Page number for pagination
- `per_page` (optional, default: 100, max: 10000): Number of records per page
- `from_date` (optional): Start date in YYYY-MM-DD format
- `to_date` (optional): End date in YYYY-MM-DD format

**Date Range Restrictions:**
- Maximum date range: 6 months (186 days)
- Both `from_date` and `to_date` must be provided together

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/admin/user/123/credit-history?page=1&per_page=50&from_date=2024-01-01&to_date=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200 OK):**
```json
{
  "message": "Successful",
  "data": {
    "user": {
      "id": 123,
      "name": "John Doe",
      "email": "john@example.com"
    },
    "total_records": 45,
    "records": [
      {
        "id": 1001,
        "wallet_id": 456,
        "amount": 500000,
        "action": "credit",
        "provider": "Admin",
        "ref": "TXN123456789",
        "description": "Manual credit by admin",
        "balance_before": 1000000,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
        "credited_by": "Admin User Name"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 1,
      "next_page": 2,
      "prev_page": 0,
      "next_page_url": "/api/admin/user/123/credit-history?page=2&per_page=50",
      "prev_page_url": ""
    }
  }
}
```

**Error Responses:**

*Invalid User ID (422):*
```json
{
  "message": "Invalid user ID",
  "error": "Invalid user ID",
  "errors": {
    "user_id": ["Invalid user ID"]
  }
}
```

*Invalid Date Format (400):*
```json
{
  "error": "Invalid 'from_date' format. Use YYYY-mm-dd",
  "message": "Invalid 'from_date' format. Use YYYY-mm-dd"
}
```

*Date Range Too Large (400):*
```json
{
  "error": "Date range cannot be more than 6 months apart",
  "message": "Date range cannot be more than 6 months apart"
}
```

---

## Transaction Endpoints

### 2. Get User Transactions (Admin)

View transactions for any user with advanced filtering options.

**Endpoint:** `GET /api/admin/transactions`

**Query Parameters:**
- `user_id` (optional): Filter by specific user ID
- `type` (optional): Transaction type(s), comma-separated (e.g., "airtime,data")
- `network` (optional): Network(s), comma-separated (e.g., "mtn,glo,airtel")
- `status` (optional): Transaction status (e.g., "Successful", "Failed", "Pending")
- `from_date` (optional): Start date in YYYY-MM-DD format
- `to_date` (optional): End date in YYYY-MM-DD format
- `min_amount` (optional): Minimum transaction amount in kobo
- `max_amount` (optional): Maximum transaction amount in kobo
- `page` (optional, default: 1): Page number
- `per_page` (optional, default: 100, max: 10000): Records per page

**Date Range Restrictions:**
- Maximum date range: 6 months (186 days)
- Both `from_date` and `to_date` must be provided together

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/admin/transactions?user_id=123&type=airtime,data&network=mtn&status=Successful&from_date=2024-01-01&to_date=2024-01-31&min_amount=100000&max_amount=500000&page=1&per_page=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200 OK):**
```json
{
  "message": "Successful",
  "data": {
    "total_records": 150,
    "records": [
      {
        "id": 5001,
        "user_id": 123,
        "transaction_id": "TXN202401150001",
        "amount": 200000,
        "airtime_bonus_to_user": 0,
        "fee": 0,
        "network": "mtn",
        "msisdn": "08012345678",
        "type": "airtime",
        "volume": 1,
        "data_bundle_code": "",
        "data_bundle_desc": "",
        "external_ref": "EXT123",
        "ref_to_telco": "TXN202401150001",
        "status": "Successful",
        "status_code": "00",
        "created_at": "2024-01-15T10:30:00Z",
        "balance_before": 1000000,
        "commission_amount": 5000,
        "commission_to": "user",
        "remark": null,
        "connection": 1,
        "beneficiary_name": null,
        "beneficiary_details": null,
        "token": "",
        "unit": "",
        "instruction": "",
        "refunded_at": null,
        "user_name": "John Doe",
        "user_email": "john@example.com"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 3,
      "next_page": 2,
      "prev_page": 0,
      "next_page_url": "/api/admin/transactions?page=2&per_page=50",
      "prev_page_url": ""
    }
  }
}
```

**Error Responses:**

*Invalid User ID (400):*
```json
{
  "message": "Invalid user_id",
  "error": "Invalid user_id format"
}
```

*Invalid Amount (400):*
```json
{
  "message": "Invalid min_amount",
  "error": "Invalid min_amount format"
}
```

---

## Commission Endpoints

### 3. Get Commission Summary

View commission summary grouped by user with optional filters.

**Endpoint:** `GET /api/admin/commissions/summary`

**Query Parameters:**
- `from_date` (required): Start date in YYYY-MM-DD format
- `to_date` (required): End date in YYYY-MM-DD format
- `types` (optional): Transaction type(s), comma-separated (e.g., "airtime,data,cable")
- `user_id` (optional): Filter by specific user ID

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/admin/commissions/summary?from_date=2024-01-01&to_date=2024-01-31&types=airtime,data" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200 OK):**
```json
{
  "message": "Successful",
  "data": {
    "summaries": [
      {
        "user_id": 123,
        "user_name": "John Doe",
        "user_email": "john@example.com",
        "total_transactions": 450,
        "total_amount": 45000000,
        "total_commission": 225000,
        "average_commission": 500
      },
      {
        "user_id": 124,
        "user_name": "Jane Smith",
        "user_email": "jane@example.com",
        "total_transactions": 320,
        "total_amount": 32000000,
        "total_commission": 160000,
        "average_commission": 500
      }
    ],
    "totals": {
      "total_transactions": 770,
      "total_amount": 77000000,
      "total_commission": 385000
    },
    "period": {
      "from": "2024-01-01",
      "to": "2024-01-31"
    }
  }
}
```

**Error Responses:**

*Missing Required Dates (400):*
```json
{
  "message": "from_date and to_date are required"
}
```

*Invalid Date Format (400):*
```json
{
  "message": "Invalid start date format. Use YYYY-MM-DD"
}
```

---

### 4. Get Commission Details

View detailed commission records with pagination.

**Endpoint:** `GET /api/admin/commissions/details`

**Query Parameters:**
- `from_date` (required): Start date in YYYY-MM-DD format
- `to_date` (required): End date in YYYY-MM-DD format
- `types` (optional): Transaction type(s), comma-separated
- `user_id` (optional): Filter by specific user ID
- `network` (optional): Network(s), comma-separated
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 50): Records per page

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/admin/commissions/details?from_date=2024-01-01&to_date=2024-01-31&user_id=123&page=1&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200 OK):**
```json
{
  "message": "Successful",
  "data": [
    {
      "transaction_id": "TXN202401150001",
      "user_id": 123,
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "type": "airtime",
      "network": "mtn",
      "amount": 200000,
      "commission_amount": 5000,
      "status": "Successful",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 450,
    "total_pages": 9
  }
}
```

---

### 5. Get Commission by Biller

View commission breakdown by biller/network and transaction type.

**Endpoint:** `GET /api/admin/commissions/by-biller`

**Query Parameters:**
- `from_date` (required): Start date in YYYY-MM-DD format
- `to_date` (required): End date in YYYY-MM-DD format
- `types` (optional): Transaction type(s), comma-separated
- `user_id` (optional): Filter by specific user ID

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/admin/commissions/by-biller?from_date=2024-01-01&to_date=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200 OK):**
```json
{
  "message": "Successful",
  "data": {
    "summaries": [
      {
        "biller": "mtn",
        "type": "airtime",
        "total_transactions": 250,
        "total_amount": 25000000,
        "total_commission": 125000,
        "average_commission": 500
      },
      {
        "biller": "glo",
        "type": "data",
        "total_transactions": 180,
        "total_amount": 18000000,
        "total_commission": 90000,
        "average_commission": 500
      },
      {
        "biller": "N/A",
        "type": "cable",
        "total_transactions": 50,
        "total_amount": 5000000,
        "total_commission": 25000,
        "average_commission": 500
      }
    ],
    "totals": {
      "total_transactions": 480,
      "total_amount": 48000000,
      "total_commission": 240000
    },
    "period": {
      "from": "2024-01-01",
      "to": "2024-01-31"
    }
  }
}
```

---

## Response Formats

### Amount Fields
All amount fields are in **kobo** (1 Naira = 100 kobo):
- `amount`: Transaction amount
- `balance_before`: Balance before transaction
- `commission_amount`: Commission earned
- `fee`: Transaction fee

**Example Conversion:**
- 500000 kobo = ₦5,000.00
- 1000 kobo = ₦10.00

### Date Formats
- **Input dates**: YYYY-MM-DD (e.g., "2024-01-15")
- **Output dates**: ISO 8601 format (e.g., "2024-01-15T10:30:00Z")

### Pagination
All paginated endpoints return:
```json
{
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "next_page": 2,
    "prev_page": 0,
    "next_page_url": "...",
    "prev_page_url": "..."
  }
}
```

---

## Error Handling

### Common HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 422 | Unprocessable Entity (invalid user ID) |
| 500 | Internal Server Error |

### Error Response Format
```json
{
  "message": "Error description",
  "error": "Detailed error message",
  "errors": {
    "field_name": ["Error for this field"]
  }
}
```

---

## Common Use Cases

### 1. View a User's Complete Credit History
```bash
GET /api/admin/user/123/credit-history?from_date=2024-01-01&to_date=2024-12-31
```

### 2. Find All Failed Transactions in a Date Range
```bash
GET /api/admin/transactions?status=Failed&from_date=2024-01-01&to_date=2024-01-31
```

### 3. View High-Value Transactions (> ₦10,000)
```bash
GET /api/admin/transactions?min_amount=1000000&from_date=2024-01-01&to_date=2024-01-31
```

### 4. Get Commission Report for a Specific User
```bash
GET /api/admin/commissions/summary?user_id=123&from_date=2024-01-01&to_date=2024-01-31
```

### 5. View MTN Airtime Transactions Only
```bash
GET /api/admin/transactions?type=airtime&network=mtn&from_date=2024-01-01&to_date=2024-01-31
```

### 6. Get Commission Breakdown by Network
```bash
GET /api/admin/commissions/by-biller?from_date=2024-01-01&to_date=2024-01-31
```

---

## Notes

1. **Performance**: Large date ranges may take longer to process. Use pagination for better performance.
2. **Caching**: Consider implementing caching on the frontend for frequently accessed data.
3. **Rate Limiting**: Be mindful of API rate limits when making multiple requests.
4. **Data Consistency**: All amounts are in kobo. Always convert to Naira for display (divide by 100).
5. **Time Zones**: All timestamps are in UTC. Convert to local time zone as needed.

---

## Support

For issues or questions about these endpoints, contact the development team or refer to the main API documentation.
