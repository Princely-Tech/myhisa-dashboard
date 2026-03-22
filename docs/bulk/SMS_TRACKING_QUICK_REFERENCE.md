# SMS Tracking - Quick Reference

## Endpoint

```
GET /api/bulk/airtime/campaigns/:campaign_id/sms
```

## Authentication

Required - Bearer Token

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page (max: 100) |
| `status` | string | - | Filter by status (success, failed, pending) |
| `has_message` | string | - | Filter by message presence (true, false) |

## Quick Examples

### Get All SMS Details

```bash
curl -X GET "http://localhost:8080/api/bulk/airtime/campaigns/3685136341377224704/sms" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filter by Status

```bash
# Get only successful SMS
curl -X GET "http://localhost:8080/api/bulk/airtime/campaigns/3685136341377224704/sms?status=success" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get only failed SMS
curl -X GET "http://localhost:8080/api/bulk/airtime/campaigns/3685136341377224704/sms?status=failed" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filter by Message Presence

```bash
# Get only items with messages
curl -X GET "http://localhost:8080/api/bulk/airtime/campaigns/3685136341377224704/sms?has_message=true" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get only items without messages
curl -X GET "http://localhost:8080/api/bulk/airtime/campaigns/3685136341377224704/sms?has_message=false" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Pagination

```bash
# Get page 2 with 50 items per page
curl -X GET "http://localhost:8080/api/bulk/airtime/campaigns/3685136341377224704/sms?page=2&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Response Structure

```json
{
  "campaign_id": "string",
  "campaign_info": {
    "file_name": "string",
    "total_rows": number,
    "message_template": "string",
    "sender_id": "string",
    "status": "string"
  },
  "sms_statistics": {
    "total_with_message": number,
    "total_sms_sent": number,
    "total_sms_failed": number,
    "total_sms_cost": number,
    "total_sms_cost_naira": number
  },
  "sms_details": [
    {
      "row_number": number,
      "sn": "string",
      "name": "string",
      "phone": "string",
      "message": "string",
      "status": "string",
      "processed_at": "datetime",
      "sms_sent": boolean,
      "sms_transaction_id": "string",
      "sms_cost": number,
      "sms_cost_naira": number,
      "sms_status": "string"
    }
  ],
  "pagination": {
    "total": number,
    "page": number,
    "limit": number,
    "total_pages": number
  }
}
```

## JavaScript Helper

```javascript
class BulkCampaignSMS {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async getSMSDetails(campaignId, options = {}) {
    const params = new URLSearchParams({
      page: options.page || 1,
      limit: options.limit || 20,
    });
    
    if (options.status) params.append('status', options.status);
    if (options.hasMessage) params.append('has_message', options.hasMessage);

    const response = await fetch(
      `${this.baseUrl}/bulk/airtime/campaigns/${campaignId}/sms?${params}`,
      {
        headers: { 'Authorization': `Bearer ${this.token}` }
      }
    );
    
    return response.json();
  }

  async getSuccessfulSMS(campaignId) {
    return this.getSMSDetails(campaignId, { status: 'success' });
  }

  async getFailedSMS(campaignId) {
    return this.getSMSDetails(campaignId, { status: 'failed' });
  }

  async getAllSMS(campaignId) {
    const allSMS = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const data = await this.getSMSDetails(campaignId, { 
        page, 
        limit: 100 
      });
      
      allSMS.push(...data.sms_details);
      
      hasMore = page < data.pagination.total_pages;
      page++;
    }

    return allSMS;
  }
}

// Usage
const smsAPI = new BulkCampaignSMS('/api', 'your-token');

// Get SMS details
const smsData = await smsAPI.getSMSDetails('3685136341377224704');
console.log('Total SMS sent:', smsData.sms_statistics.total_sms_sent);

// Get only failed SMS
const failedSMS = await smsAPI.getFailedSMS('3685136341377224704');
console.log('Failed SMS:', failedSMS.sms_details);

// Get all SMS (all pages)
const allSMS = await smsAPI.getAllSMS('3685136341377224704');
console.log('Total SMS:', allSMS.length);
```

## Key Points

### SMS Charging

- **Charged Once**: All SMS costs charged during campaign confirmation
- **Cost per SMS**: ₦5.00 (configurable via `SMS_COST_KOBO`)
- **Bulk Debit**: Total airtime + total SMS cost debited together
- **Transaction Records**: Individual SMS transactions created for tracking

### SMS Transaction Records

Each SMS sent creates a transaction record:
- **Type**: "SMS"
- **Amount**: SMS cost in kobo (500 = ₦5.00)
- **Status**: "successful" or "failed"
- **Remark**: Message preview (first 100 characters)
- **Appears in**: User's transaction history

### Filtering Options

**By Status**:
- `success` - Successfully sent SMS
- `failed` - Failed to send
- `pending` - Not yet processed

**By Message**:
- `has_message=true` - Only items with messages
- `has_message=false` - Only items without messages

## Common Use Cases

### 1. View All SMS Sent

```javascript
const data = await fetch(
  `/api/bulk/airtime/campaigns/${campaignId}/sms?has_message=true`,
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json());

console.log(`Sent ${data.sms_statistics.total_sms_sent} SMS`);
console.log(`Cost: ₦${data.sms_statistics.total_sms_cost_naira}`);
```

### 2. Find Failed SMS

```javascript
const failed = await fetch(
  `/api/bulk/airtime/campaigns/${campaignId}/sms?status=failed&has_message=true`,
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json());

failed.sms_details.forEach(sms => {
  console.log(`Failed to send to ${sms.name} (${sms.phone})`);
});
```

### 3. Export SMS to CSV

```javascript
async function exportSMS(campaignId) {
  const data = await fetch(
    `/api/bulk/airtime/campaigns/${campaignId}/sms?limit=1000`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  ).then(r => r.json());

  const csv = [
    'Row,Name,Phone,Message,Status,Cost,Sent At',
    ...data.sms_details.map(s => 
      `${s.row_number},"${s.name}","${s.phone}","${s.message}",${s.status},${s.sms_cost_naira},"${s.processed_at}"`
    )
  ].join('\n');

  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sms_${campaignId}.csv`;
  a.click();
}
```

### 4. Calculate Success Rate

```javascript
const data = await fetch(
  `/api/bulk/airtime/campaigns/${campaignId}/sms`,
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json());

const stats = data.sms_statistics;
const successRate = (stats.total_sms_sent / stats.total_with_message * 100).toFixed(1);

console.log(`Success Rate: ${successRate}%`);
console.log(`Sent: ${stats.total_sms_sent}/${stats.total_with_message}`);
```

## Related Documentation

- **Full UI Guide**: `SMS_TRACKING_UI_GUIDE.md`
- **API Documentation**: `API_DOCUMENTATION.md`
- **SMS Integration**: `SMS_INTEGRATION_SUMMARY.md`
- **Sender ID Management**: `SENDER_ID_MANAGEMENT.md`
