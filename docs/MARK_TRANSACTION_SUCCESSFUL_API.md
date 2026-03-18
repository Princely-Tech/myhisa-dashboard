# Mark Transaction as Successful API Documentation

## Overview
This API endpoint allows administrators to manually mark pending transactions as successful. This is a critical administrative function that should only be used when a transaction has been verified as successful through external means (e.g., direct provider confirmation, manual verification) but the system status has not been updated.

**⚠️ WARNING**: This endpoint bypasses normal transaction verification flows and should be used with extreme caution. All operations are logged with the provided reason for audit purposes.

---

## Endpoint Details

### Mark Transactions as Successful

**Endpoint**: `POST /admin/transactions/mark-successful`

**Authentication**: Required (Admin role)

**Description**: Marks one or more pending transactions as successful without querying the provider. This updates the transaction status to "Successful" and does NOT refund or modify the user's balance.

---

## Request Parameters

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `transaction_refs` | string | Yes | Comma-separated list of transaction IDs or external references to mark as successful |
| `reason` | string | Yes | Detailed reason for marking the transaction(s) as successful. This is logged for audit purposes. Max length: 500 characters |

### Example Request

```http
POST /admin/transactions/mark-successful?transaction_refs=TXN123456,TXN789012,EXT_REF_001&reason=Verified%20with%20MTN%20-%20transaction%20completed%20successfully
Authorization: Bearer <admin_token>
Content-Type: application/json
```

---

## Response Format

### Success Response

**Status Code**: `200 OK`

**Response Body**:

```json
{
  "status": "success",
  "message": "Processed 3 transaction(s)",
  "count": 3,
  "data": [
    {
      "transaction_id": "TXN123456",
      "external_ref": "EXT_REF_001",
      "status": "success",
      "message": "Transaction marked as successful"
    },
    {
      "transaction_id": "TXN789012",
      "external_ref": "EXT_REF_002",
      "status": "skipped",
      "message": "Transaction is already successful"
    },
    {
      "transaction_id": "TXN999999",
      "external_ref": "EXT_REF_003",
      "status": "error",
      "message": "Transaction not found"
    }
  ]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Overall operation status: "success" or "error" |
| `message` | string | Human-readable message describing the operation result |
| `count` | integer | Total number of transactions processed |
| `data` | array | Array of individual transaction results |

### Individual Transaction Result Fields

| Field | Type | Description |
|-------|------|-------------|
| `transaction_id` | string | The transaction ID |
| `external_ref` | string | The external reference |
| `status` | string | Result status: "success", "skipped", or "error" |
| `message` | string | Detailed message about the operation result |

### Result Status Values

- **success**: Transaction was successfully marked as successful
- **skipped**: Transaction was not modified (e.g., already successful, already failed)
- **error**: An error occurred while processing this transaction

---

## Error Responses

### 400 Bad Request

Missing or invalid parameters.

```json
{
  "status": "error",
  "message": "transaction_refs parameter is required"
}
```

```json
{
  "status": "error",
  "message": "reason parameter is required"
}
```

```json
{
  "status": "error",
  "message": "reason must not exceed 500 characters"
}
```

### 401 Unauthorized

Missing or invalid authentication token.

```json
{
  "status": "error",
  "message": "Unauthorized - Invalid or missing token"
}
```

### 403 Forbidden

User does not have admin privileges.

```json
{
  "status": "error",
  "message": "Forbidden - Admin access required"
}
```

### 500 Internal Server Error

Server-side error occurred.

```json
{
  "status": "error",
  "message": "Internal server error",
  "error": "Error details..."
}
```

---

## Business Logic

### Eligible Transactions

Only transactions with the following characteristics can be marked as successful:

1. **Status**: Must be "Pending" or "Processing"
2. **Not Refunded**: Transaction must not have been previously refunded
3. **Exists**: Transaction must exist in the database

### What Happens When a Transaction is Marked as Successful

1. **Status Update**: Transaction status is changed to "Successful"
2. **Status Code Update**: Transaction status_code is updated to indicate manual success
3. **Remark Added**: The provided reason is stored in the transaction's remark field
4. **Audit Log**: An audit log entry is created with:
   - Admin user ID
   - Transaction ID
   - Action: "MARK_SUCCESSFUL"
   - Reason provided
   - Timestamp
5. **Balance**: User's balance is **NOT** modified (the amount was already deducted when the transaction was initiated)
6. **Commission**: Commission remains as originally calculated

### Transactions That Will Be Skipped

- Transactions already marked as "Successful"
- Transactions marked as "Failed"
- Transactions that have been refunded
- Transactions not found in the database

---

## Implementation Guidelines

### Backend Implementation Checklist

1. **Authentication & Authorization**
   - Verify the request has a valid admin token
   - Check user has admin role/permissions

2. **Input Validation**
   - Validate `transaction_refs` parameter is present and not empty
   - Validate `reason` parameter is present and not empty
   - Validate `reason` does not exceed 500 characters
   - Parse and clean transaction references (trim whitespace, split by comma)

3. **Transaction Processing**
   - For each transaction reference:
     - Look up transaction by transaction_id OR external_ref
     - Check if transaction exists
     - Check if transaction is in "Pending" or "Processing" status
     - Check if transaction has not been refunded
     - If eligible, update transaction:
       - Set status to "Successful"
       - Set status_code to appropriate success code (e.g., "MANUAL_SUCCESS")
       - Append reason to remark field
       - Update updated_at timestamp
     - Create audit log entry
     - Add result to response array

4. **Response Construction**
   - Count successful, skipped, and error results
   - Return structured response with all results

5. **Database Transaction**
   - Wrap all database operations in a transaction
   - Rollback on any critical errors
   - Commit only if all operations succeed

### Database Schema Updates Required

#### Transactions Table
Ensure the following fields exist:
- `status` (string/enum)
- `status_code` (string)
- `remark` (text, nullable)
- `refunded_at` (timestamp, nullable)
- `updated_at` (timestamp)

#### Audit Logs Table (Recommended)
Create an audit log table to track all manual interventions:

```sql
CREATE TABLE admin_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_user_id INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_user_id) REFERENCES users(id)
);
```

### Example Backend Implementation (Node.js/Express)

```javascript
const express = require('express');
const router = express.Router();

// Middleware to verify admin access
const requireAdmin = require('../middleware/requireAdmin');

router.post('/admin/transactions/mark-successful', requireAdmin, async (req, res) => {
  try {
    const { transaction_refs, reason } = req.query;
    
    // Validation
    if (!transaction_refs) {
      return res.status(400).json({
        status: 'error',
        message: 'transaction_refs parameter is required'
      });
    }
    
    if (!reason) {
      return res.status(400).json({
        status: 'error',
        message: 'reason parameter is required'
      });
    }
    
    if (reason.length > 500) {
      return res.status(400).json({
        status: 'error',
        message: 'reason must not exceed 500 characters'
      });
    }
    
    // Parse transaction references
    const refs = transaction_refs.split(',').map(ref => ref.trim()).filter(ref => ref);
    
    if (refs.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid transaction references provided'
      });
    }
    
    const results = [];
    
    // Process each transaction
    for (const ref of refs) {
      try {
        // Find transaction by ID or external_ref
        const transaction = await db.query(
          `SELECT * FROM transactions 
           WHERE transaction_id = $1 OR external_ref = $1 
           LIMIT 1`,
          [ref]
        );
        
        if (transaction.rows.length === 0) {
          results.push({
            transaction_id: ref,
            status: 'error',
            message: 'Transaction not found'
          });
          continue;
        }
        
        const txn = transaction.rows[0];
        
        // Check if already successful
        if (txn.status === 'Successful') {
          results.push({
            transaction_id: txn.transaction_id,
            external_ref: txn.external_ref,
            status: 'skipped',
            message: 'Transaction is already successful'
          });
          continue;
        }
        
        // Check if already failed
        if (txn.status === 'Failed') {
          results.push({
            transaction_id: txn.transaction_id,
            external_ref: txn.external_ref,
            status: 'skipped',
            message: 'Cannot mark failed transaction as successful'
          });
          continue;
        }
        
        // Check if refunded
        if (txn.refunded_at) {
          results.push({
            transaction_id: txn.transaction_id,
            external_ref: txn.external_ref,
            status: 'skipped',
            message: 'Cannot mark refunded transaction as successful'
          });
          continue;
        }
        
        // Check if pending or processing
        if (txn.status !== 'Pending' && txn.status !== 'Processing') {
          results.push({
            transaction_id: txn.transaction_id,
            external_ref: txn.external_ref,
            status: 'skipped',
            message: `Transaction status is ${txn.status}, can only mark Pending/Processing transactions`
          });
          continue;
        }
        
        // Update transaction to successful
        await db.query(
          `UPDATE transactions 
           SET status = 'Successful', 
               status_code = 'MANUAL_SUCCESS',
               remark = CASE 
                 WHEN remark IS NULL THEN $1
                 ELSE remark || ' | ' || $1
               END,
               updated_at = NOW()
           WHERE transaction_id = $2`,
          [reason, txn.transaction_id]
        );
        
        // Create audit log
        await db.query(
          `INSERT INTO admin_audit_logs 
           (admin_user_id, action, entity_type, entity_id, reason, metadata)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            req.user.id,
            'MARK_SUCCESSFUL',
            'transaction',
            txn.transaction_id,
            reason,
            JSON.stringify({
              old_status: txn.status,
              new_status: 'Successful',
              external_ref: txn.external_ref
            })
          ]
        );
        
        results.push({
          transaction_id: txn.transaction_id,
          external_ref: txn.external_ref,
          status: 'success',
          message: 'Transaction marked as successful'
        });
        
      } catch (error) {
        console.error(`Error processing transaction ${ref}:`, error);
        results.push({
          transaction_id: ref,
          status: 'error',
          message: 'Error processing transaction'
        });
      }
    }
    
    return res.status(200).json({
      status: 'success',
      message: `Processed ${results.length} transaction(s)`,
      count: results.length,
      data: results
    });
    
  } catch (error) {
    console.error('Error in mark-successful endpoint:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
```

---

## Security Considerations

1. **Admin-Only Access**: This endpoint must be restricted to admin users only
2. **Audit Logging**: All operations must be logged with admin user ID, timestamp, and reason
3. **Rate Limiting**: Consider implementing rate limiting to prevent abuse
4. **Reason Validation**: Ensure the reason field is properly sanitized to prevent injection attacks
5. **Transaction Limits**: Consider limiting the number of transactions that can be processed in a single request (e.g., max 100)

---

## Testing

### Test Cases

1. **Valid Request - Single Pending Transaction**
   - Input: One pending transaction ID with valid reason
   - Expected: Transaction marked as successful

2. **Valid Request - Multiple Transactions**
   - Input: Multiple transaction IDs (pending, successful, failed)
   - Expected: Only pending transactions marked as successful, others skipped

3. **Invalid Request - Missing Reason**
   - Input: Transaction ID without reason
   - Expected: 400 Bad Request

4. **Invalid Request - Transaction Not Found**
   - Input: Non-existent transaction ID
   - Expected: Error status for that transaction

5. **Invalid Request - Already Successful**
   - Input: Transaction ID that is already successful
   - Expected: Skipped status

6. **Invalid Request - Refunded Transaction**
   - Input: Transaction ID that has been refunded
   - Expected: Skipped status

7. **Unauthorized Access**
   - Input: Request without admin token
   - Expected: 401 Unauthorized

8. **Non-Admin User**
   - Input: Request with non-admin user token
   - Expected: 403 Forbidden

### Sample cURL Commands

```bash
# Mark single transaction as successful
curl -X POST "https://api.example.com/admin/transactions/mark-successful?transaction_refs=TXN123456&reason=Verified%20with%20provider" \
  -H "Authorization: Bearer <admin_token>"

# Mark multiple transactions as successful
curl -X POST "https://api.example.com/admin/transactions/mark-successful?transaction_refs=TXN123456,TXN789012,EXT_REF_001&reason=Bulk%20verification%20completed" \
  -H "Authorization: Bearer <admin_token>"
```

---

## Monitoring & Alerts

### Recommended Monitoring

1. **Usage Metrics**: Track how often this endpoint is called
2. **Success Rate**: Monitor the ratio of successful vs skipped/error results
3. **Admin Activity**: Alert on unusual patterns (e.g., same admin marking many transactions)
4. **Audit Log Review**: Regular review of audit logs for this action

### Alert Triggers

- More than X transactions marked successful by single admin in Y minutes
- Spike in usage of this endpoint
- High error rate when processing transactions

---

## Related Endpoints

- `GET /admin/transactions/by-refs` - Look up transactions by references
- `POST /admin/transactions/query-and-update-status` - Query provider and update status
- `POST /admin/transactions/reverse` - Reverse (refund) transactions

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-03-18 | Initial API documentation |

---

## Support

For questions or issues with this API endpoint, contact the backend development team or refer to the main API documentation.
