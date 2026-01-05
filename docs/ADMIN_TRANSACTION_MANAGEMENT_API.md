# Admin Transaction Management API Documentation

## Overview
This document provides comprehensive API documentation for admin transaction management endpoints. These endpoints allow administrators to query, update, and reverse transactions across all transaction types (Airtime, Data, Gift-Data, Electricity, Cable).

## Authentication
All endpoints require:
- Staff or Admin authentication via middleware

**Base URL:** `/api/admin`

---

## Endpoints

### 1. Query and Update Transaction Status (Consolidated)

**Endpoint:** `POST /admin/transactions/query-and-update-status`

**Description:** Queries the status of transactions from their respective providers (telco or bill payment) and updates the database accordingly. Works for all transaction types (Airtime, Data, Gift-Data, Electricity, Cable).

**Query Parameters:**
- `transaction_refs` (required): Comma-separated or newline-separated list of transaction IDs or external reference IDs

**Request Example:**
```
POST /api/admin/transactions/query-and-update-status?transaction_refs=TXN123456,TXN789012,EXT_REF_001
```

**Request Body:** None (uses query parameters)

**Response:**
```json
{
  "message": "Batch transaction query completed",
  "count": 3,
  "data": [
    {
      "transaction_id": "TXN123456",
      "external_ref": "EXT_REF_001",
      "status": "updated",
      "old_status": "Pending",
      "new_status": "Successful",
      "requery": {
        "transaction_id": "TXN123456",
        "status": "Successful",
        "response_http_code": 200,
        "response_status_code": "0",
        "response_message": "Transaction successful"
      }
    },
    {
      "transaction_id": "TXN789012",
      "external_ref": "EXT_REF_002",
      "status": "skipped",
      "message": "Transaction already finalized",
      "current_status": "Successful"
    },
    {
      "ref": "INVALID_REF",
      "status": "error",
      "message": "Transaction not found"
    }
  ]
}
```

**Status Values:**
- `updated`: Transaction status was successfully queried and updated
- `skipped`: Transaction already finalized (Successful/Failed)
- `error`: Transaction not found or query failed

**Processing Logic:**
1. Accepts both transaction IDs and external reference IDs
2. Automatically detects transaction type (Airtime/Data/Bills)
3. Queries appropriate provider (MTN/Airtel for telco, BuyPower for bills)
4. Updates transaction status in database
5. Triggers commission credit for successful transactions
6. Triggers reversal for failed/refundable transactions

---

### 2. Get Pending Transactions

**Endpoint:** `GET /admin/transactions/pending`

**Description:** Retrieves pending or processing transactions with flexible filtering options.

**Query Parameters:**
- `user_id` (optional): Filter by specific user ID
- `type` (optional): Filter by transaction type (`Airtime`, `Data`, `Gift-Data`, `Electricity`, `Cable`)
- `network` (optional): Filter by network (`mtn`, `airtel`, `glo`, `9mobile`)
- `from` (optional): Start date (formats: `YYYY-MM-DD` or `YYYY-MM-DD HH:MM:SS`)
- `to` (optional): End date (formats: `YYYY-MM-DD` or `YYYY-MM-DD HH:MM:SS`)
- `limit` (optional): Number of records to return (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Request Example:**
```
GET /api/admin/transactions/pending?type=Airtime&from=2025-01-01&to=2025-01-31&limit=50&offset=0
```

**Response:**
```json
{
  "data": {
    "filters": {
      "user_id": "",
      "type": "Airtime",
      "network": "",
      "from": "2025-01-01",
      "to": "2025-01-31",
      "limit": "50",
      "offset": "0"
    },
    "total_count": 125,
    "records_count": 50,
    "records": [
      {
        "user_id": 123,
        "transaction_id": "TXN123456",
        "external_ref": "EXT_REF_001",
        "amount": 100000,
        "network": "mtn",
        "msisdn": "2348012345678",
        "type": "Airtime",
        "status": "Pending",
        "status_code": "06",
        "created_at": "2025-01-15T10:30:00Z",
        "balance_before": 500000,
        "commission_amount": 2000,
        "remark": "Pending"
      }
    ]
  }
}
```

**Use Cases:**
- View all pending transactions across the system
- Filter pending transactions by user for investigation
- Filter by date range to identify stuck transactions
- Filter by type/network to check provider-specific issues

---

### 3. Get Transactions by References

**Endpoint:** `GET /admin/transactions/by-refs`

**Description:** Retrieves transaction details by transaction IDs or external reference IDs. Does not modify transactions.

**Query Parameters:**
- `transaction_refs` (required): Comma-separated or newline-separated list of transaction IDs or external reference IDs

**Request Example:**
```
GET /api/admin/transactions/by-refs?transaction_refs=TXN123456,EXT_REF_001,TXN789012
```

**Response:**
```json
{
  "message": "Transactions retrieved",
  "count": 3,
  "data": [
    {
      "status": "found",
      "transaction": {
        "user_id": 123,
        "transaction_id": "TXN123456",
        "external_ref": "EXT_REF_001",
        "amount": 100000,
        "network": "mtn",
        "msisdn": "2348012345678",
        "type": "Airtime",
        "status": "Pending",
        "status_code": "06",
        "created_at": "2025-01-15T10:30:00Z",
        "refunded_at": null
      },
      "telco_log": {
        "transaction_id": "TXN123456",
        "status": "Pending",
        "response_http_code": 200,
        "response_status_code": "06",
        "response_message": "Transaction pending",
        "connection": 1,
        "created_at": "2025-01-15T10:30:05Z"
      }
    },
    {
      "ref": "INVALID_REF",
      "status": "error",
      "message": "Transaction not found"
    }
  ]
}
```

**Use Cases:**
- Look up transaction details before taking action
- Verify transaction existence
- Check transaction logs and provider responses

---

### 4. Reverse Transactions

**Endpoint:** `POST /admin/transactions/reverse`

**Description:** Reverses transactions by marking them as failed and refunding the amount to the user's wallet. Does NOT check transaction status with provider - performs immediate reversal.

**Query Parameters:**
- `transaction_refs` (required): Comma-separated or newline-separated list of transaction IDs or external reference IDs
- `reason` (optional): Reason for reversal (default: "Admin reversal")

**Request Example:**
```
POST /api/admin/transactions/reverse?transaction_refs=TXN123456,EXT_REF_001&reason=Customer%20complaint%20-%20service%20not%20delivered
```

**Response:**
```json
{
  "message": "Batch reversal completed",
  "count": 2,
  "data": [
    {
      "transaction_id": "TXN123456",
      "external_ref": "EXT_REF_001",
      "status": "success",
      "message": "Success"
    },
    {
      "transaction_id": "TXN789012",
      "external_ref": "EXT_REF_002",
      "status": "skipped",
      "message": "Already refunded"
    }
  ]
}
```

**Status Values:**
- `success`: Transaction reversed and amount refunded
- `skipped`: Transaction already refunded
- `error`: Transaction not found or reversal failed

**Processing Logic:**
1. Marks transaction status as "Failed"
2. Sets `refunded_at` timestamp
3. Credits user's wallet with transaction amount
4. Logs reversal in `wallet_transaction_reversal_logs`
5. Updates transaction remark with provided reason

**⚠️ Important Notes:**
- This endpoint does NOT verify transaction status with provider
- Use this for manual reversals when you're certain the transaction failed
- For automatic status checking and reversal, use the "Query and Update" endpoint instead
- Cannot reverse already refunded transactions

---

## UI Implementation Guide

### Workflow 1: Query and Update Pending Transactions

**Step 1: Fetch Pending Transactions**
```javascript
// Get pending transactions with filters
const response = await fetch(
  `/api/admin/transactions/pending?from=2025-01-01&to=2025-01-31&limit=100&offset=0`
);
const data = await response.json();
const pendingTransactions = data.data.records;
```

**Step 2: Display in Table with Selection**
```javascript
// Display transactions in a table with checkboxes
// Allow admin to select specific transactions or "Select All"
const selectedTransactions = []; // Array of selected transaction IDs or external refs
```

**Step 3: Query and Update Selected Transactions**
```javascript
// Build comma-separated list of selected transaction refs
const transactionRefs = selectedTransactions.join(',');

// Query and update status
const updateResponse = await fetch(
  `/api/admin/transactions/query-and-update-status?transaction_refs=${transactionRefs}`,
  { method: 'POST' }
);
const updateResult = await updateResponse.json();

// Display results to admin
updateResult.data.forEach(result => {
  if (result.status === 'updated') {
    console.log(`✓ ${result.transaction_id}: ${result.old_status} → ${result.new_status}`);
  } else if (result.status === 'skipped') {
    console.log(`⊘ ${result.transaction_id}: ${result.message}`);
  } else {
    console.log(`✗ ${result.ref}: ${result.message}`);
  }
});
```

---

### Workflow 2: Manual Transaction Reversal

**Step 1: Look Up Transactions**
```javascript
// Admin pastes transaction IDs/refs (newline or comma separated)
const transactionRefs = document.getElementById('transaction-refs-input').value;

// Fetch transaction details
const lookupResponse = await fetch(
  `/api/admin/transactions/by-refs?transaction_refs=${encodeURIComponent(transactionRefs)}`
);
const lookupData = await lookupResponse.json();

// Display transaction details for review
displayTransactionDetails(lookupData.data);
```

**Step 2: Confirm and Reverse**
```javascript
// Admin confirms reversal with reason
const reason = document.getElementById('reversal-reason').value || 'Admin reversal';

// Perform reversal
const reversalResponse = await fetch(
  `/api/admin/transactions/reverse?transaction_refs=${encodeURIComponent(transactionRefs)}&reason=${encodeURIComponent(reason)}`,
  { method: 'POST' }
);
const reversalResult = await reversalResponse.json();

// Display results
reversalResult.data.forEach(result => {
  if (result.status === 'success') {
    console.log(`✓ Reversed: ${result.transaction_id}`);
  } else {
    console.log(`✗ ${result.transaction_id}: ${result.message}`);
  }
});
```

---

### Workflow 3: Bulk Transaction Processing

**Step 1: Upload Transaction List**
```javascript
// Admin uploads CSV or pastes newline-separated transaction IDs
const transactionList = `
TXN123456
TXN789012
EXT_REF_001
EXT_REF_002
`;

// Clean and prepare list
const cleanedRefs = transactionList
  .split(/[\n,;]/)
  .map(ref => ref.trim())
  .filter(ref => ref.length > 0)
  .join(',');
```

**Step 2: Query Status for All**
```javascript
const queryResponse = await fetch(
  `/api/admin/transactions/query-and-update-status?transaction_refs=${encodeURIComponent(cleanedRefs)}`,
  { method: 'POST' }
);
const queryResult = await queryResponse.json();

// Categorize results
const successful = queryResult.data.filter(r => r.new_status === 'Successful');
const failed = queryResult.data.filter(r => r.new_status === 'Failed');
const pending = queryResult.data.filter(r => r.status === 'skipped');
const errors = queryResult.data.filter(r => r.status === 'error');

// Display summary
console.log(`Processed: ${queryResult.count}`);
console.log(`Successful: ${successful.length}`);
console.log(`Failed: ${failed.length}`);
console.log(`Already Finalized: ${pending.length}`);
console.log(`Errors: ${errors.length}`);
```

---

## UI Components Recommendation

### 1. Pending Transactions Dashboard
**Features:**
- Filter panel (user ID, type, network, date range)
- Data table with sortable columns
- Checkbox selection (individual + select all)
- Bulk action buttons ("Query Status", "Reverse Selected")
- Pagination controls
- Export to CSV

**Columns:**
- Transaction ID
- External Ref
- User ID
- Type
- Network
- Amount
- Status
- Created At
- Actions

### 2. Transaction Lookup Tool
**Features:**
- Text area for pasting transaction IDs/refs (supports newline, comma, semicolon)
- "Look Up" button
- Results table showing transaction details
- "Query Status" button for each transaction
- "Reverse" button for each transaction
- Bulk actions for selected transactions

### 3. Reversal Confirmation Modal
**Features:**
- Transaction details preview
- Reason input field (required)
- Warning message about irreversibility
- Confirm/Cancel buttons
- Success/error feedback

### 4. Status Query Results Display
**Features:**
- Color-coded status badges (green=updated, yellow=skipped, red=error)
- Expandable rows showing full requery response
- Summary statistics at top
- Download results as JSON/CSV

---

## Error Handling

### Common Error Responses

**Missing Auth Key:**
```json
{
  "error": "Cannot honor"
}
```

**Missing Transaction Refs:**
```json
{
  "error": "transaction_refs required",
  "message": "Provide comma or newline separated transaction refs or IDs"
}
```

**Invalid Date Format:**
```json
{
  "error": "Invalid 'from' format. Use YYYY-MM-DD or YYYY-MM-DD HH:MM:SS"
}
```

### UI Error Handling Best Practices

1. **Validate Input:** Check for empty fields before API call
2. **Show Loading State:** Display spinner during API calls
3. **Handle Partial Success:** Some transactions may succeed while others fail
4. **Display Detailed Errors:** Show specific error messages for each transaction
5. **Retry Mechanism:** Allow admin to retry failed operations
6. **Confirmation Dialogs:** Require confirmation for destructive actions (reversal)

---

## Transaction Status Reference

### Status Values
- `Pending`: Transaction initiated, awaiting processing
- `Processing`: Transaction being processed
- `Successful`: Transaction completed successfully
- `Failed`: Transaction failed
- `InsufficientBalance`: User has insufficient balance
- `InvalidMsisdn`: Invalid phone number
- `InvalidAmount`: Invalid transaction amount
- `TelcoError`: Error from telco/bill provider
- `InvalidTelco`: Unsupported network/provider
- `InternalError`: System error

### Status Codes
- `00`: Successful
- `01`: Failed
- `02`: Invalid MSISDN
- `03`: Invalid Amount
- `04`: Telco Error
- `05`: Internal Error
- `06`: Pending/Processing
- `07`: Error (generic)
- `08`: Insufficient Balance
- `09`: Invalid Telco

---

## Testing Checklist

### Query and Update Endpoint
- [ ] Test with valid transaction IDs
- [ ] Test with external reference IDs
- [ ] Test with mix of IDs and refs
- [ ] Test with already finalized transactions
- [ ] Test with non-existent transactions
- [ ] Test with different transaction types (Airtime, Data, Bills)
- [ ] Verify commission is credited for successful transactions
- [ ] Verify reversal is triggered for failed transactions

### Get Pending Transactions
- [ ] Test without filters (get all pending)
- [ ] Test with user_id filter
- [ ] Test with type filter
- [ ] Test with network filter
- [ ] Test with date range filter
- [ ] Test with combined filters
- [ ] Test pagination (limit/offset)
- [ ] Verify total_count is accurate

### Get Transactions by Refs
- [ ] Test with valid transaction IDs
- [ ] Test with external reference IDs
- [ ] Test with non-existent transactions
- [ ] Verify telco_log is included

### Reverse Transactions
- [ ] Test with valid pending transactions
- [ ] Test with already refunded transactions
- [ ] Test with custom reason
- [ ] Verify wallet is credited
- [ ] Verify refunded_at timestamp is set
- [ ] Verify status is updated to Failed
- [ ] Test with non-existent transactions

---

## Security Considerations

1. **Authentication:** All endpoints require staff/admin authentication
2. **Authorization:** Verify user has admin privileges before allowing access
3. **Audit Logging:** Log all admin actions (queries, updates, reversals)
4. **Rate Limiting:** Implement rate limiting to prevent abuse
5. **Input Validation:** Sanitize all input parameters
6. **Confirmation:** Require confirmation for destructive actions
7. **Reason Tracking:** Always require and log reason for reversals

---

## Performance Considerations

1. **Batch Size:** Limit transaction_refs to reasonable size (e.g., 100 per request)
2. **Async Processing:** Consider async processing for large batches
3. **Caching:** Cache pending transaction counts
4. **Pagination:** Always use pagination for large result sets
5. **Timeouts:** Set appropriate timeouts for provider queries
6. **Database Indexes:** Ensure indexes on transaction_id, external_ref, status, created_at

---

## Support and Troubleshooting

### Common Issues

**Issue:** Transaction not found by external ref
- **Solution:** Try using transaction ID instead, or verify the ref exists

**Issue:** Query returns "Provider not supported"
- **Solution:** Some providers (e.g., "cy") don't support status queries

**Issue:** Reversal fails with "DB update failed"
- **Solution:** Check database connectivity and transaction locks

**Issue:** Status query returns "Telco log not found"
- **Solution:** Transaction may not have been sent to provider yet

### Contact
For technical support or questions about these endpoints, contact the backend development team.

---

## Changelog

### Version 1.0 (January 2025)
- Initial release of consolidated transaction management endpoints
- Replaced separate telco and bill endpoints with unified approach
- Added flexible filtering for pending transactions
- Improved reversal endpoint with better error handling
- Added support for newline-separated transaction refs
