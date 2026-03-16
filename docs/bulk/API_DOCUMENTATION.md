# Bulk Airtime Upload API Documentation

## Overview
This API allows users to upload CSV files containing bulk airtime purchases with optional SMS notifications. The system processes each entry, sends airtime to recipients, and optionally sends personalized SMS messages.

---

## Features
- ✅ CSV file upload with validation
- ✅ Duplicate upload detection (same day)
- ✅ Message template with placeholders
- ✅ OTP verification before processing
- ✅ Campaign pause/resume/cancel controls
- ✅ Real-time progress tracking
- ✅ Automatic refund for cancelled campaigns
- ✅ SMS cost calculation (NGN 5 per SMS, configurable)

---

## API Endpoints

### 1. Upload Bulk Airtime File

**Endpoint:** `POST /api/bulk/airtime/upload`

**Authentication:** Required (Bearer Token)

**Content-Type:** `multipart/form-data`

**Request Parameters:**
- `file` (required): CSV file containing bulk airtime data
- `message_template` (optional): SMS template with placeholders

**CSV File Format:**
```csv
SN,Name,Phone Number,Amount,Network,Message
1,John Doe,08012345678,1000,mtn,Thank you for your purchase
2,Jane Smith,07098765432,500,airtel,
3,Bob Johnson,09087654321,2000,glo,Special offer for you
```

**CSV Headers (Required):**
- `SN`: Serial number (string, can be duplicated)
- `Name`: Recipient name (string, can be duplicated)
- `Phone Number`: Recipient phone number (string, must be unique in upload)
- `Amount`: Airtime amount in Naira (supports: 1000, 1,000, 1000.00)
- `Network`: Network provider (mtn, airtel, glo, 9mobile - case insensitive)
- `Message`: Optional individual message (can be empty)

**Message Template Placeholders:**
- `{{name}}` - Recipient's name
- `{{phone}}` - Recipient's phone number
- `{{amount}}` - Airtime amount
- `{{sn}}` - Serial number

**Example Template:**
```
Hello {{name}}, you have received NGN {{amount}} airtime on {{phone}}. Thank you!
```

**Validation Rules:**
- Maximum file size: 10MB
- Maximum rows: 10,000 per upload
- Phone numbers must be valid Nigerian numbers
- Phone numbers must be unique within the upload
- Amount must be greater than 0
- Network must be one of: mtn, airtel, glo, 9mobile

**Success Response (200 OK):**
```json
{
  "message": "File uploaded successfully. Please review and confirm.",
  "campaign_id": "3685136341377224704",
  "summary": {
    "total_rows": 150,
    "total_amount": 75000.00,
    "total_amount_kobo": 7500000,
    "total_sms_cost": 750.00,
    "total_cost": 75750.00,
    "message_template": "Hello {{name}}, you received NGN {{amount}}"
  },
  "preview": [
    {
      "RowNumber": 1,
      "SN": "1",
      "Name": "John Doe",
      "Phone": "08012345678",
      "Amount": 100000,
      "Network": "mtn",
      "Message": "Thank you for your purchase"
    }
  ],
  "next_step": "Request OTP to confirm and start processing"
}
```

**Duplicate Warning Response (200 OK):**
```json
{
  "warning": "Similar file was uploaded today",
  "duplicate_info": {
    "file_name": "bulk_airtime_2026_03_15.csv",
    "uploaded_at": "2026-03-15T10:30:00Z",
    "total_rows": 150
  },
  "continue_anyway": true
}
```

**Error Responses:**
- `400 Bad Request`: Invalid file format, validation errors
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Server error

---

### 2. Request Campaign OTP

**Endpoint:** `POST /api/bulk/airtime/campaigns/:campaign_id/request-otp`

**Authentication:** Required

**Path Parameters:**
- `campaign_id`: The campaign ID returned from upload

**Success Response (200 OK):**
```json
{
  "message": "OTP sent to your phone",
  "expires_at": "2026-03-15T10:40:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Campaign not found
- `403 Forbidden`: Unauthorized access to campaign
- `400 Bad Request`: Campaign not in pending confirmation state

---

### 3. Confirm and Start Campaign

**Endpoint:** `POST /api/bulk/airtime/campaigns/:campaign_id/confirm`

**Authentication:** Required

**Path Parameters:**
- `campaign_id`: The campaign ID

**Request Body:**
```json
{
  "otp": "123456"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Campaign started successfully",
  "campaign_id": "3685136341377224704",
  "status": "processing"
}
```

**Error Responses:**
- `404 Not Found`: Campaign not found
- `403 Forbidden`: Unauthorized access
- `400 Bad Request`: Invalid OTP, OTP expired, or campaign not in pending state
- `402 Payment Required`: Insufficient balance

**Insufficient Balance Response (402):**
```json
{
  "error": "Insufficient balance",
  "required": 75750.00,
  "current_balance": 50000.00
}
```

---

### 4. Get Campaign Status

**Endpoint:** `GET /api/bulk/airtime/campaigns/:campaign_id`

**Authentication:** Required

**Path Parameters:**
- `campaign_id`: The campaign ID

**Success Response (200 OK):**
```json
{
  "campaign": {
    "id": 1,
    "campaign_id": "3685136341377224704",
    "user_id": 123,
    "file_name": "bulk_airtime.csv",
    "total_rows": 150,
    "total_amount": 7500000,
    "total_sms_cost": 75000,
    "status": "processing",
    "status_code": "pending",
    "processed_count": 45,
    "success_count": 42,
    "failed_count": 3,
    "amount_debited": 7575000,
    "balance_before": 10000000,
    "started_at": "2026-03-15T10:35:00Z",
    "created_at": "2026-03-15T10:30:00Z"
  },
  "summary": {
    "total_items": 150,
    "processed_count": 45,
    "success_count": 42,
    "failed_count": 3,
    "pending_count": 105
  },
  "sample_items": [
    {
      "id": 1,
      "campaign_id": "3685136341377224704",
      "row_number": 1,
      "sn": "1",
      "name": "John Doe",
      "phone": "08012345678",
      "amount": 100000,
      "network": "mtn",
      "message": "Hello John Doe, you received NGN 1000.00",
      "status": "success",
      "transaction_id": "3685136341377224705",
      "sms_transaction_id": "3685136341377224706",
      "processed_at": "2026-03-15T10:36:00Z"
    }
  ]
}
```

**Campaign Statuses:**
- `pending_confirmation`: Awaiting OTP confirmation
- `processing`: Currently processing items
- `paused`: Temporarily paused
- `completed`: All items processed
- `cancelled`: Campaign cancelled by user

**Item Statuses:**
- `pending`: Not yet processed
- `processing`: Currently being processed
- `success`: Successfully completed
- `failed`: Processing failed
- `skipped`: Skipped (campaign cancelled)

---

### 5. List User Campaigns

**Endpoint:** `GET /api/bulk/airtime/campaigns`

**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "campaign_id": "3685136341377224704",
      "file_name": "bulk_airtime.csv",
      "total_rows": 150,
      "total_amount": 7500000,
      "status": "completed",
      "processed_count": 150,
      "success_count": 145,
      "failed_count": 5,
      "created_at": "2026-03-15T10:30:00Z",
      "completed_at": "2026-03-15T11:45:00Z"
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

---

### 6. Pause Campaign

**Endpoint:** `POST /api/bulk/airtime/campaigns/:campaign_id/pause`

**Authentication:** Required

**Path Parameters:**
- `campaign_id`: The campaign ID

**Success Response (200 OK):**
```json
{
  "message": "Campaign paused successfully",
  "status": "paused"
}
```

**Error Responses:**
- `400 Bad Request`: Only processing campaigns can be paused

---

### 7. Resume Campaign

**Endpoint:** `POST /api/bulk/airtime/campaigns/:campaign_id/resume`

**Authentication:** Required

**Path Parameters:**
- `campaign_id`: The campaign ID

**Success Response (200 OK):**
```json
{
  "message": "Campaign resumed successfully",
  "status": "processing"
}
```

**Error Responses:**
- `400 Bad Request`: Only paused campaigns can be resumed

---

### 8. Cancel Campaign

**Endpoint:** `POST /api/bulk/airtime/campaigns/:campaign_id/cancel`

**Authentication:** Required

**Path Parameters:**
- `campaign_id`: The campaign ID

**Success Response (200 OK):**
```json
{
  "message": "Campaign cancelled successfully",
  "status": "cancelled"
}
```

**Note:** Unprocessed items will be automatically refunded to the user's wallet.

**Error Responses:**
- `400 Bad Request`: Campaign already completed or cancelled

---

## Implementation Flow for UI

### Step 1: File Upload
```javascript
const formData = new FormData();
formData.append('file', csvFile);
formData.append('message_template', 'Hello {{name}}, you received NGN {{amount}}');

const response = await fetch('/api/bulk/airtime/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
// Display summary and preview to user
// Show: total_rows, total_cost, preview items
```

### Step 2: Request OTP
```javascript
const response = await fetch(`/api/bulk/airtime/campaigns/${campaignId}/request-otp`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Show OTP input form to user
```

### Step 3: Confirm with OTP
```javascript
const response = await fetch(`/api/bulk/airtime/campaigns/${campaignId}/confirm`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ otp: userOtp })
});

// Campaign starts processing
// Redirect to status page
```

### Step 4: Monitor Progress
```javascript
// Poll every 5 seconds
setInterval(async () => {
  const response = await fetch(`/api/bulk/airtime/campaigns/${campaignId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  // Update progress bar: data.summary.processed_count / data.summary.total_items
  // Display success/failed counts
}, 5000);
```

---

## UI Components Needed

### 1. Upload Page
- File upload dropzone
- Message template input (optional)
- CSV format help/instructions
- Sample CSV download button

### 2. Review & Confirm Page
- Summary display (total rows, total cost, SMS cost)
- Preview table (first 10 items)
- Request OTP button
- OTP input field
- Confirm button

### 3. Campaign Status Page
- Progress bar
- Statistics cards (total, processed, success, failed)
- Items table with pagination
- Control buttons (pause/resume/cancel)
- Refresh button

### 4. Campaigns List Page
- Table of all campaigns
- Filters (status, date range)
- Pagination
- View details button for each campaign

---

## Sample CSV Download

The UI should provide a "Download Sample CSV" button that generates a file with this content:

```csv
SN,Name,Phone Number,Amount,Network,Message
1,John Doe,08012345678,1000,mtn,Thank you for your purchase
2,Jane Smith,07098765432,500,airtel,
3,Bob Johnson,09087654321,2000,glo,Special offer for you
4,Alice Williams,08123456789,1500,9mobile,
5,Charlie Brown,07034567890,3000,mtn,Bonus airtime for loyal customer
```

---

## Error Handling

### Common Errors

**Invalid Phone Number:**
```json
{
  "error": "Invalid phone number at row 5: 080123"
}
```

**Duplicate Phone:**
```json
{
  "error": "Duplicate phone number at row 10: 08012345678",
  "warning": "Each phone number should appear only once in the upload"
}
```

**Invalid Network:**
```json
{
  "error": "Invalid network at row 3: etisalat. Must be one of: mtn, airtel, glo, 9mobile"
}
```

**Invalid Amount:**
```json
{
  "error": "Invalid amount at row 7: abc"
}
```

**Insufficient Balance:**
```json
{
  "error": "Insufficient balance",
  "required": 75750.00,
  "current_balance": 50000.00
}
```

---

## Notes for Implementation

1. **File Size Limit**: Maximum 10MB per upload
2. **Row Limit**: Maximum 10,000 rows per upload
3. **SMS Cost**: NGN 5 per SMS (configurable via environment variable `SMS_COST_KOBO`)
4. **OTP Expiry**: 10 minutes
5. **Processing Rate**: ~500ms delay between items to avoid overwhelming the system
6. **Duplicate Detection**: Based on file hash, checked within the same day
7. **Phone Validation**: Uses existing `ValidatePhoneToNational` helper
8. **Network Validation**: Case-insensitive, accepts: mtn, airtel, glo, 9mobile
9. **Amount Format**: Supports 1000, 1,000, 1000.00 formats
10. **Refunds**: Automatic refund for cancelled campaigns (unprocessed items only)

---

## Database Models

### BulkCampaign
- Stores campaign metadata
- Tracks overall progress
- Manages campaign lifecycle

### BulkCampaignItem
- Individual recipient records
- Links to transaction records
- Tracks item-level status

### BulkCampaignUploadHistory
- Duplicate detection
- Upload audit trail

---

## Transaction Records

Each successful airtime purchase creates:
1. **Transaction** record (type: "Airtime")
2. **TransactionTelcoLog** record

Each SMS sent creates:
1. **Transaction** record (type: "SMS")

---

## Testing Checklist

- [ ] Upload valid CSV file
- [ ] Upload CSV with invalid phone numbers
- [ ] Upload CSV with duplicate phones
- [ ] Upload CSV with invalid network
- [ ] Upload CSV with invalid amount format
- [ ] Upload file larger than 10MB
- [ ] Upload file with more than 10,000 rows
- [ ] Request OTP for campaign
- [ ] Confirm with valid OTP
- [ ] Confirm with expired OTP
- [ ] Confirm with insufficient balance
- [ ] Monitor campaign progress
- [ ] Pause running campaign
- [ ] Resume paused campaign
- [ ] Cancel campaign (verify refund)
- [ ] Upload duplicate file (same day)
- [ ] Test message template placeholders
- [ ] Verify SMS logging to file

---

## Support

For issues or questions, contact the development team.
