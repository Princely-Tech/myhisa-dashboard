# Admin Commission Management API - Quick Reference

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
| GET | `/user/:userID/commission-rate` | Get user's general commission rate |
| PUT | `/user/:userID/commission-rate` | Update user's general commission rate |
| GET | `/user/:userID/biller-commission-rates` | Get user's biller-specific rates |
| POST | `/user/:userID/biller-commission-rate` | Add biller commission rate |
| PUT | `/user/:userID/biller-commission-rate` | Update biller commission rate |
| DELETE | `/user/:userID/biller-commission-rate` | Delete biller commission rate |
| POST | `/user/:userID/biller-commission-rates/bulk` | Bulk update biller rates |
| GET | `/electricity-billers` | Get all electricity billers (full details) |
| GET | `/electricity-biller-codes` | Get electricity biller codes (simplified) |

---

## Quick Examples

### Get User Commission Rate
```bash
curl -X GET "http://localhost:8080/api/admin/user/24/commission-rate" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Commission Rate
```bash
curl -X PUT "http://localhost:8080/api/admin/user/24/commission-rate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mtn": 3.5,
    "airtel": 3.0,
    "electricity": 0.5
  }'
```

### Get Biller Commission Rates
```bash
curl -X GET "http://localhost:8080/api/admin/user/24/biller-commission-rates?transaction_type=Electricity" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Add Biller Commission Rate
```bash
curl -X POST "http://localhost:8080/api/admin/user/24/biller-commission-rate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_type": "Electricity",
    "biller_code": "AEDC_PREPAID",
    "rate": 0.5
  }'
```

### Update Biller Commission Rate
```bash
curl -X PUT "http://localhost:8080/api/admin/user/24/biller-commission-rate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_type": "Electricity",
    "biller_code": "AEDC_PREPAID",
    "rate": 0.8
  }'
```

### Delete Biller Commission Rate
```bash
curl -X DELETE "http://localhost:8080/api/admin/user/24/biller-commission-rate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_type": "Electricity",
    "biller_code": "AEDC_PREPAID"
  }'
```

### Bulk Update (Set all electricity billers to 0.5%)
```bash
curl -X POST "http://localhost:8080/api/admin/user/24/biller-commission-rates/bulk" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rates": [
      {"transaction_type": "Electricity", "biller_code": "AEDC_PREPAID", "rate": 0.5},
      {"transaction_type": "Electricity", "biller_code": "AEDC_POSTPAID", "rate": 0.5},
      {"transaction_type": "Electricity", "biller_code": "EKEDC_PREPAID", "rate": 0.5}
    ]
  }'
```

### Get Electricity Billers
```bash
curl -X GET "http://localhost:8080/api/admin/electricity-biller-codes" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Commission Rate Fields

### General Commission Rate (CommissionRate)
- `mtn` - MTN airtime/data commission (%)
- `airtel` - Airtel airtime/data commission (%)
- `ninemobile` - 9mobile airtime/data commission (%)
- `glo` - Glo airtime/data commission (%)
- `dstv` - DSTV commission (%)
- `gotv` - GOTV commission (%)
- `startimes` - Startimes commission (%)
- `spectranet` - Spectranet commission (%)
- `smile` - Smile commission (%)
- `electricity` - Electricity fallback commission (%)
- `no_bill_fee` - Whether to add bill fee (boolean)
- `use_commission_wallet` - Use commission wallet vs reduce from amount (boolean)

### Biller Commission Rate (BillerCommissionRate)
- `transaction_type` - Always "Electricity" for electricity billers
- `biller_code` - Specific biller code (e.g., "AEDC_PREPAID")
- `rate` - Commission percentage

---

## Electricity Biller Codes (24 Total)

**AEDC (Abuja)**
- AEDC_PREPAID
- AEDC_POSTPAID

**EKEDC (Eko)**
- EKEDC_PREPAID
- EKEDC_POSTPAID

**IKEDC (Ikeja)**
- IKEDC_PREPAID
- IKEDC_POSTPAID

**IBEDC (Ibadan)**
- IBEDC_PREPAID
- IBEDC_POSTPAID

**EEDC (Enugu)**
- EEDC_PREPAID
- EEDC_POSTPAID

**PHED (Port Harcourt)**
- PHED_PREPAID
- PHED_POSTPAID

**JEDC (Jos)**
- JEDC_PREPAID
- JEDC_POSTPAID

**KAEDCO (Kaduna)**
- KAEDCO_PREPAID
- KAEDCO_POSTPAID

**KEDCO (Kano)**
- KEDCO_PREPAID
- KEDCO_POSTPAID

**YEDC (Yola)**
- YEDC_PREPAID
- YEDC_POSTPAID

**BEDC (Benin)**
- BEDC_PREPAID
- BEDC_POSTPAID

**YEDCO (Borno)**
- YEDCO_PREPAID
- YEDCO_POSTPAID

**ABA Power**
- ABA_PREPAID
- ABA_POSTPAID

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

## Commission Calculation Logic

1. **Check BillerCommissionRate**: If exists for specific biller → use it
2. **Fallback to CommissionRate**: Use general electricity rate
3. **MD Meters**: Always 0% commission (no commission on MD meters)

**Example:**
- User has `CommissionRate.electricity = 0.5%`
- User has `BillerCommissionRate` for `EKEDC_PREPAID = 0.8%`
- Transaction for EKEDC_PREPAID → **0.8%** commission
- Transaction for IKEDC_PREPAID (no specific rate) → **0.5%** commission

---

## For UI Developers

### Recommended Flow

1. **Load User Data**
   - Fetch user's general commission rate
   - Fetch user's biller-specific rates
   - Fetch available electricity billers

2. **Display**
   - Show general rates in one section
   - Show biller-specific rates in a table
   - Highlight billers with custom rates

3. **Edit Operations**
   - Update general rates individually
   - Add/update/delete biller rates
   - Use bulk update for setting defaults

4. **Validation**
   - Rates must be >= 0
   - Biller codes must match available billers
   - Transaction type is "Electricity"

### Sample JavaScript Helper

```javascript
class CommissionAPI {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async getCommissionRate(userId) {
    const response = await fetch(`${this.baseUrl}/user/${userId}/commission-rate`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }

  async updateCommissionRate(userId, updates) {
    const response = await fetch(`${this.baseUrl}/user/${userId}/commission-rate`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    return response.json();
  }

  async getBillerRates(userId, transactionType = 'Electricity') {
    const response = await fetch(
      `${this.baseUrl}/user/${userId}/biller-commission-rates?transaction_type=${transactionType}`,
      { headers: { 'Authorization': `Bearer ${this.token}` } }
    );
    return response.json();
  }

  async addBillerRate(userId, transactionType, billerCode, rate) {
    const response = await fetch(`${this.baseUrl}/user/${userId}/biller-commission-rate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ transaction_type: transactionType, biller_code: billerCode, rate })
    });
    return response.json();
  }

  async updateBillerRate(userId, transactionType, billerCode, rate) {
    const response = await fetch(`${this.baseUrl}/user/${userId}/biller-commission-rate`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ transaction_type: transactionType, biller_code: billerCode, rate })
    });
    return response.json();
  }

  async deleteBillerRate(userId, transactionType, billerCode) {
    const response = await fetch(`${this.baseUrl}/user/${userId}/biller-commission-rate`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ transaction_type: transactionType, biller_code: billerCode })
    });
    return response.json();
  }

  async bulkUpdateBillerRates(userId, rates) {
    const response = await fetch(`${this.baseUrl}/user/${userId}/biller-commission-rates/bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rates })
    });
    return response.json();
  }

  async getElectricityBillers() {
    const response = await fetch(`${this.baseUrl}/electricity-biller-codes`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }
}

// Usage
const api = new CommissionAPI('/api/admin', 'your-token');
const data = await api.getCommissionRate(24);
```

---

## Related Documentation

- **Full UI Guide**: `ADMIN_COMMISSION_MANAGEMENT_UI_GUIDE.md`
- **Biller Commission Quick Start**: `BILLER_COMMISSION_QUICK_START.md`
- **Seeder Documentation**: `cmd/seeder/README.md`
