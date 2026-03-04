# Commission Report API Documentation

## Overview
The Commission Report API provides endpoints to retrieve commission earnings summaries and details, grouped by transaction types. This enables clients to analyze commission performance across different service categories and generate visual reports.

## Base URL
All endpoints are under the `/api` path and require authentication via the `approved` middleware (account must be approved).

**Base Path:** `/api/commission`

---

## Authentication
All endpoints require:
- Valid JWT token in the `Authorization` header
- Email verification
- Account approval status

**Header:**
```
Authorization: Bearer <your_jwt_token>
```

---

## Transaction Types
The following transaction types are available for filtering:
- `Airtime` - Mobile airtime purchases
- `Data` - Mobile data bundle purchases
- `Gift-Data` - Gift data purchases
- `Cable` - Cable TV subscriptions (DSTV, GOTV, Startimes)
- `Electricity` - Electricity bill payments

---

## Endpoints

### 1. Commission Summary Report

**Endpoint:** `GET /api/commission/summary`

**Description:** Retrieves a summary of commissions earned, grouped by transaction type. Returns total transactions, total amounts, and commission earnings for each type.

#### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `from_date` | string | Yes | Start date in YYYY-MM-DD format | `2024-01-01` |
| `to_date` | string | Yes | End date in YYYY-MM-DD format | `2024-12-31` |
| `types` | string | No | Comma-separated list of transaction types to filter | `Airtime,Data,Cable` |

#### Request Example

```bash
curl -X GET "https://api.example.com/api/commission/summary?from_date=2024-01-01&to_date=2024-12-31&types=Airtime,Data,Cable" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response Example

**Status Code:** `200 OK`

```json
{
  "message": "Successful",
  "data": {
    "summaries": [
      {
        "type": "Airtime",
        "total_transactions": 1250,
        "total_amount": 5000000,
        "total_commission": 125000,
        "average_commission": 100.0
      },
      {
        "type": "Data",
        "total_transactions": 890,
        "total_amount": 3500000,
        "total_commission": 87500,
        "average_commission": 98.31
      },
      {
        "type": "Cable",
        "total_transactions": 450,
        "total_amount": 2250000,
        "total_commission": 67500,
        "average_commission": 150.0
      },
      {
        "type": "Electricity",
        "total_transactions": 320,
        "total_amount": 1600000,
        "total_commission": 48000,
        "average_commission": 150.0
      }
    ],
    "totals": {
      "total_transactions": 2910,
      "total_amount": 12350000,
      "total_commission": 328000
    },
    "period": {
      "from": "2024-01-01",
      "to": "2024-12-31"
    }
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Transaction type |
| `total_transactions` | integer | Number of successful transactions |
| `total_amount` | integer | Total transaction amount in kobo (₦1 = 100 kobo) |
| `total_commission` | integer | Total commission earned in kobo |
| `average_commission` | float | Average commission per transaction in kobo |

#### Error Responses

**400 Bad Request** - Invalid date format
```json
{
  "message": "Invalid start date format. Use YYYY-MM-DD"
}
```

**500 Internal Server Error** - Database error
```json
{
  "message": "Failed to fetch commission summary",
  "error": "database error details"
}
```

---

### 2. Commission Details

**Endpoint:** `GET /api/commission/details`

**Description:** Retrieves detailed commission information for individual transactions with pagination support.

#### Query Parameters

| Parameter | Type | Required | Description | Default | Example |
|-----------|------|----------|-------------|---------|---------|
| `from_date` | string | Yes | Start date in YYYY-MM-DD format | - | `2024-01-01` |
| `to_date` | string | Yes | End date in YYYY-MM-DD format | - | `2024-12-31` |
| `types` | string | No | Comma-separated list of transaction types | All types | `Airtime,Data` |
| `page` | integer | No | Page number for pagination | 1 | `1` |
| `limit` | integer | No | Number of records per page | 50 | `50` |

#### Request Example

```bash
curl -X GET "https://api.example.com/api/commission/details?from_date=2024-01-01&to_date=2024-01-31&types=Airtime&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response Example

**Status Code:** `200 OK`

```json
{
  "message": "Successful",
  "data": [
    {
      "transaction_id": "TXN123456789",
      "type": "Airtime",
      "network": "mtn",
      "amount": 100000,
      "commission_amount": 250,
      "status": "Successful",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "transaction_id": "TXN123456790",
      "type": "Data",
      "network": "glo",
      "amount": 200000,
      "commission_amount": 500,
      "status": "Successful",
      "created_at": "2024-01-15T11:45:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1250,
    "total_pages": 63
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `transaction_id` | string | Unique transaction identifier |
| `type` | string | Transaction type |
| `network` | string | Network/provider name |
| `amount` | integer | Transaction amount in kobo |
| `commission_amount` | integer | Commission earned in kobo |
| `status` | string | Transaction status |
| `created_at` | string | Transaction timestamp (ISO 8601) |

---

### 3. Commission by Network

**Endpoint:** `GET /api/commission/by-network`

**Description:** Retrieves commission summary grouped by both transaction type and network/provider. Useful for analyzing performance across different service providers.

#### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `from_date` | string | Yes | Start date in YYYY-MM-DD format | `2024-01-01` |
| `to_date` | string | Yes | End date in YYYY-MM-DD format | `2024-12-31` |
| `types` | string | No | Comma-separated list of transaction types | `Airtime,Data` |

#### Request Example

```bash
curl -X GET "https://api.example.com/api/commission/by-network?from_date=2024-01-01&to_date=2024-12-31&types=Airtime,Data" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response Example

**Status Code:** `200 OK`

```json
{
  "message": "Successful",
  "data": [
    {
      "type": "Airtime",
      "network": "mtn",
      "total_transactions": 450,
      "total_amount": 1800000,
      "total_commission": 45000,
      "average_commission": 100.0
    },
    {
      "type": "Airtime",
      "network": "glo",
      "total_transactions": 380,
      "total_amount": 1520000,
      "total_commission": 38000,
      "average_commission": 100.0
    },
    {
      "type": "Data",
      "network": "mtn",
      "total_transactions": 320,
      "total_amount": 1280000,
      "total_commission": 32000,
      "average_commission": 100.0
    },
    {
      "type": "Cable",
      "network": "dstv",
      "total_transactions": 200,
      "total_amount": 1000000,
      "total_commission": 30000,
      "average_commission": 150.0
    }
  ],
  "period": {
    "from": "2024-01-01",
    "to": "2024-12-31"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Transaction type |
| `network` | string | Network/provider identifier |
| `total_transactions` | integer | Number of successful transactions |
| `total_amount` | integer | Total transaction amount in kobo |
| `total_commission` | integer | Total commission earned in kobo |
| `average_commission` | float | Average commission per transaction in kobo |

---

## Data Visualization Guidelines

### 1. Commission Summary Chart
**Recommended Chart Type:** Pie Chart or Bar Chart

**Data Source:** `/api/commission/summary`

**Implementation Example:**
```javascript
// Fetch data
const response = await fetch('/api/commission/summary?from_date=2024-01-01&to_date=2024-12-31');
const data = await response.json();

// Prepare chart data
const chartData = data.data.summaries.map(item => ({
  label: item.type,
  value: item.total_commission / 100, // Convert kobo to naira
  transactions: item.total_transactions
}));

// Use with Chart.js, Recharts, or any charting library
```

### 2. Commission Trend Over Time
**Recommended Chart Type:** Line Chart or Area Chart

**Implementation:** Make multiple API calls with different date ranges to build time series data.

```javascript
// Example: Monthly commission trend
const months = ['2024-01', '2024-02', '2024-03', ...];
const trendData = await Promise.all(
  months.map(async (month) => {
    const fromDate = `${month}-01`;
    const toDate = `${month}-31`;
    const response = await fetch(
      `/api/commission/summary?from_date=${fromDate}&to_date=${toDate}`
    );
    const data = await response.json();
    return {
      month,
      total: data.data.totals.total_commission / 100
    };
  })
);
```

### 3. Network Performance Comparison
**Recommended Chart Type:** Grouped Bar Chart or Stacked Bar Chart

**Data Source:** `/api/commission/by-network`

```javascript
const response = await fetch('/api/commission/by-network?from_date=2024-01-01&to_date=2024-12-31&types=Airtime,Data');
const data = await response.json();

// Group by network
const networkData = data.data.reduce((acc, item) => {
  if (!acc[item.network]) {
    acc[item.network] = { network: item.network, types: {} };
  }
  acc[item.network].types[item.type] = item.total_commission / 100;
  return acc;
}, {});
```

### 4. Transaction Type Distribution
**Recommended Chart Type:** Donut Chart

**Data Source:** `/api/commission/summary`

Shows the percentage distribution of commissions across different transaction types.

---

## Currency Formatting

All monetary values in the API are returned in **kobo** (smallest currency unit).

**Conversion:**
- 1 Naira (₦) = 100 kobo
- To convert to Naira: `amount_in_naira = amount_in_kobo / 100`

**Display Example:**
```javascript
function formatCurrency(kobo) {
  const naira = kobo / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(naira);
}

// Usage
formatCurrency(125000); // Output: ₦1,250.00
```

---

## Filtering Best Practices

### 1. Single Transaction Type
```
GET /api/commission/summary?from_date=2024-01-01&to_date=2024-12-31&types=Airtime
```

### 2. Multiple Transaction Types
```
GET /api/commission/summary?from_date=2024-01-01&to_date=2024-12-31&types=Airtime,Data,Cable
```

### 3. All Transaction Types (No Filter)
```
GET /api/commission/summary?from_date=2024-01-01&to_date=2024-12-31
```

### 4. Utilities Only (Cable + Electricity)
```
GET /api/commission/summary?from_date=2024-01-01&to_date=2024-12-31&types=Cable,Electricity
```

---

## Rate Limiting & Performance

- **Pagination:** Use the `limit` parameter to control response size (recommended: 50-100 records per page)
- **Date Range:** Avoid excessively large date ranges for better performance
- **Caching:** Consider caching results on the client side for frequently accessed date ranges

---

## Error Handling

### Common Error Codes

| Status Code | Description | Solution |
|-------------|-------------|----------|
| 400 | Bad Request - Invalid parameters | Check date format and parameter values |
| 401 | Unauthorized - Invalid or missing token | Provide valid JWT token |
| 403 | Forbidden - Account not approved | Contact administrator for account approval |
| 500 | Internal Server Error | Contact support if issue persists |

### Error Response Format
```json
{
  "message": "Error description",
  "error": "Detailed error information (in development mode)"
}
```

---

## Sample UI Implementation

### Dashboard Widget Example

```javascript
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const CommissionDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: '2024-01-01',
    to: '2024-12-31'
  });
  const [selectedTypes, setSelectedTypes] = useState([]);

  useEffect(() => {
    fetchCommissionData();
  }, [dateRange, selectedTypes]);

  const fetchCommissionData = async () => {
    setLoading(true);
    try {
      const typesParam = selectedTypes.length > 0 
        ? `&types=${selectedTypes.join(',')}` 
        : '';
      
      const response = await fetch(
        `/api/commission/summary?from_date=${dateRange.from}&to_date=${dateRange.to}${typesParam}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error('Error fetching commission data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = {
    'Airtime': '#0088FE',
    'Data': '#00C49F',
    'Cable': '#FFBB28',
    'Electricity': '#FF8042',
    'Gift-Data': '#8884D8'
  };

  if (loading) return <div>Loading...</div>;

  const chartData = data?.summaries.map(item => ({
    name: item.type,
    value: item.total_commission / 100,
    transactions: item.total_transactions
  }));

  return (
    <div className="commission-dashboard">
      <h2>Commission Report</h2>
      
      {/* Date Range Selector */}
      <div className="date-range">
        <input 
          type="date" 
          value={dateRange.from}
          onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
        />
        <input 
          type="date" 
          value={dateRange.to}
          onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
        />
      </div>

      {/* Transaction Type Filter */}
      <div className="type-filter">
        {['Airtime', 'Data', 'Cable', 'Electricity', 'Gift-Data'].map(type => (
          <label key={type}>
            <input
              type="checkbox"
              checked={selectedTypes.includes(type)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedTypes([...selectedTypes, type]);
                } else {
                  setSelectedTypes(selectedTypes.filter(t => t !== type));
                }
              }}
            />
            {type}
          </label>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card">
          <h3>Total Commission</h3>
          <p>₦{(data?.totals.total_commission / 100).toLocaleString()}</p>
        </div>
        <div className="card">
          <h3>Total Transactions</h3>
          <p>{data?.totals.total_transactions.toLocaleString()}</p>
        </div>
        <div className="card">
          <h3>Total Amount</h3>
          <p>₦{(data?.totals.total_amount / 100).toLocaleString()}</p>
        </div>
      </div>

      {/* Pie Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.name}: ₦${entry.value.toLocaleString()}`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData?.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      {/* Detailed Table */}
      <table className="commission-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Transactions</th>
            <th>Total Amount</th>
            <th>Commission</th>
            <th>Avg Commission</th>
          </tr>
        </thead>
        <tbody>
          {data?.summaries.map(item => (
            <tr key={item.type}>
              <td>{item.type}</td>
              <td>{item.total_transactions.toLocaleString()}</td>
              <td>₦{(item.total_amount / 100).toLocaleString()}</td>
              <td>₦{(item.total_commission / 100).toLocaleString()}</td>
              <td>₦{(item.average_commission / 100).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CommissionDashboard;
```

---

## Testing the API

### Using cURL

```bash
# Set your token
TOKEN="your_jwt_token_here"

# Test commission summary
curl -X GET "http://localhost:8080/api/commission/summary?from_date=2024-01-01&to_date=2024-12-31" \
  -H "Authorization: Bearer $TOKEN"

# Test with filters
curl -X GET "http://localhost:8080/api/commission/summary?from_date=2024-01-01&to_date=2024-12-31&types=Airtime,Data" \
  -H "Authorization: Bearer $TOKEN"

# Test commission details with pagination
curl -X GET "http://localhost:8080/api/commission/details?from_date=2024-01-01&to_date=2024-12-31&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"

# Test commission by network
curl -X GET "http://localhost:8080/api/commission/by-network?from_date=2024-01-01&to_date=2024-12-31" \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman

1. Create a new GET request
2. Set the URL: `{{base_url}}/api/commission/summary`
3. Add query parameters: `from_date`, `to_date`, `types` (optional)
4. Add header: `Authorization: Bearer {{token}}`
5. Send the request

---

## Support

For questions or issues with the Commission Report API, please contact:
- **Technical Support:** support@example.com
- **API Documentation:** https://docs.example.com/api

---

---

## Admin Endpoints (Staff/Admin Only)

The following endpoints are available for administrators to view commission reports for any partner and perform data reconciliation between transactions and wallet logs.

### Base Path
**Admin Base Path:** `/api/admin/commissions`

### Authentication
Requires:
- Valid JWT token
- Staff or Admin privileges
- Email verification
- Account approval

---

### 4. Admin Commission Daily Summary

**Endpoint:** `GET /api/admin/commissions/daily-summary`

**Description:** Retrieves a summary of commissions grouped by transaction type for a specific partner and date. This endpoint includes wallet transaction log reconciliation to identify discrepancies.

#### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `user_id` | string | Yes | Partner's user ID | `123` |
| `date` | string | Yes | Date in YYYY-MM-DD format | `2026-03-04` |

#### Request Example

```bash
curl -X GET "https://api.example.com/api/admin/commissions/daily-summary?user_id=123&date=2026-03-04" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

#### Response Example

**Status Code:** `200 OK`

```json
{
  "message": "Successful",
  "data": {
    "user_id": "123",
    "date": "2026-03-04",
    "summaries": [
      {
        "type": "Airtime",
        "total_amount": 500000,
        "total_commission_amount": 15000,
        "total_log_amount": 15000,
        "transaction_count": 25,
        "log_record_count": 25
      },
      {
        "type": "Data",
        "total_amount": 750000,
        "total_commission_amount": 22500,
        "total_log_amount": 20000,
        "transaction_count": 30,
        "log_record_count": 28
      },
      {
        "type": "Electricity",
        "total_amount": 320000,
        "total_commission_amount": 9600,
        "total_log_amount": 9600,
        "transaction_count": 12,
        "log_record_count": 12
      }
    ]
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Transaction type |
| `total_amount` | integer | Total transaction amount in kobo |
| `total_commission_amount` | integer | Total commission from transactions in kobo |
| `total_log_amount` | integer | Total amount from wallet transaction logs in kobo |
| `transaction_count` | integer | Number of successful transactions |
| `log_record_count` | integer | Number of wallet transaction log records |

#### Data Integrity Indicators

- **Match**: `total_log_amount == total_commission_amount` AND `log_record_count == transaction_count`
- **Mismatch**: Any difference indicates potential data integrity issues

#### Use Cases

1. **Daily Reconciliation**: Verify that commission logs match transaction records
2. **Identify Discrepancies**: Spot missing or extra wallet transaction logs
3. **Historical Issue Detection**: Find transactions where commission updates failed but logs were created

---

### 5. Admin Commission Daily Details

**Endpoint:** `GET /api/admin/commissions/daily-details`

**Description:** Retrieves detailed transaction records with their corresponding wallet transaction logs for a specific partner and date. Shows individual transactions and whether they have matching commission logs.

#### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `user_id` | string | Yes | Partner's user ID | `123` |
| `date` | string | Yes | Date in YYYY-MM-DD format | `2026-03-04` |

#### Request Example

```bash
curl -X GET "https://api.example.com/api/admin/commissions/daily-details?user_id=123&date=2026-03-04" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

#### Response Example

**Status Code:** `200 OK`

```json
{
  "message": "Successful",
  "data": {
    "user_id": "123",
    "date": "2026-03-04",
    "record_count": 67,
    "transactions": [
      {
        "transaction_id": "TXN123456789",
        "type": "Airtime",
        "amount": 20000,
        "commission_amount": 600,
        "commission_to": "Commission Wallet",
        "log_id": 98765,
        "log_amount": 600,
        "log_account": "commission",
        "log_description": "Commission for transaction",
        "transaction_status": "Successful",
        "created_at": "2026-03-04T10:30:45Z"
      },
      {
        "transaction_id": "TXN123456790",
        "type": "Data",
        "amount": 50000,
        "commission_amount": 1500,
        "commission_to": "Main Wallet",
        "log_id": null,
        "log_amount": null,
        "log_account": null,
        "log_description": null,
        "transaction_status": "Successful",
        "created_at": "2026-03-04T11:15:22Z"
      },
      {
        "transaction_id": "TXN123456791",
        "type": "Airtime",
        "amount": 10000,
        "commission_amount": 300,
        "commission_to": "Commission Wallet",
        "log_id": null,
        "log_amount": null,
        "log_account": null,
        "log_description": null,
        "transaction_status": "Successful",
        "created_at": "2026-03-04T12:05:10Z"
      }
    ]
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `transaction_id` | string | Unique transaction identifier |
| `type` | string | Transaction type |
| `amount` | integer | Transaction amount in kobo |
| `commission_amount` | integer | Commission amount in kobo |
| `commission_to` | string | Destination ("Commission Wallet" or "Main Wallet") |
| `log_id` | integer/null | Wallet log ID (null if no log exists) |
| `log_amount` | integer/null | Amount from wallet log in kobo (null if no log) |
| `log_account` | string/null | Account type from log (null if no log) |
| `log_description` | string/null | Description from log (null if no log) |
| `transaction_status` | string | Transaction status (should be "Successful") |
| `created_at` | string | Transaction timestamp (ISO 8601) |

#### Interpreting Null Log Fields

| Scenario | commission_to | log_id | Interpretation |
|----------|---------------|--------|----------------|
| Expected | "Main Wallet" | null | ✓ Normal - No log expected |
| Issue | "Commission Wallet" | null | ⚠ Missing log - Data integrity issue |
| Expected | "Commission Wallet" | not null | ✓ Normal - Log exists as expected |

#### Use Cases

1. **Identify Missing Logs**: Find transactions where `commission_to == "Commission Wallet"` but `log_id` is null
2. **Verify Log Amounts**: Check if `log_amount == commission_amount`
3. **Investigate Discrepancies**: Drill down into specific problematic transactions
4. **Historical Data Audit**: Review past transactions for data integrity issues

---

## Admin UI Implementation Guide

### Daily Commission Report Workflow

1. **Partner Selection**: Admin selects a partner from dropdown
2. **Date Selection**: Admin picks a specific date
3. **View Toggle**: Choose between Summary or Detailed view
4. **Generate Report**: Fetch and display data
5. **Identify Issues**: Highlight mismatches for investigation

### Summary View Example

```
Commission Summary - Partner: John Doe (ID: 123) - Date: 2026-03-04

┌──────────────┬───────────────┬──────────────────┬─────────────────┬─────────────┬──────────────┐
│ Type         │ Total Amount  │ Commission Amt   │ Log Amount      │ Txns        │ Logs         │
├──────────────┼───────────────┼──────────────────┼─────────────────┼─────────────┼──────────────┤
│ Airtime      │ ₦5,000.00     │ ₦150.00          │ ₦150.00 ✓       │ 25          │ 25 ✓         │
│ Data         │ ₦7,500.00     │ ₦225.00          │ ₦200.00 ⚠       │ 30          │ 28 ⚠         │
│ Electricity  │ ₦3,200.00     │ ₦96.00           │ ₦96.00 ✓        │ 12          │ 12 ✓         │
└──────────────┴───────────────┴──────────────────┴─────────────────┴─────────────┴──────────────┘

Legend:
✓ - Matches expected
⚠ - Mismatch detected (requires investigation)
```

### Detailed View Example

```
Commission Details - Partner: John Doe (ID: 123) - Date: 2026-03-04
Total Records: 67

Filters: [All Types ▼] [Show Issues Only ☐]

┌─────────────────┬──────────┬────────────┬────────────┬──────────────────┬────────────┬────────────┐
│ Transaction ID  │ Type     │ Amount     │ Commission │ Commission To    │ Log Status │ Actions    │
├─────────────────┼──────────┼────────────┼────────────┼──────────────────┼────────────┼────────────┤
│ TXN123456789    │ Airtime  │ ₦200.00    │ ₦6.00      │ Commission Wallet│ ✓ Matched  │ [View]     │
│ TXN123456790    │ Data     │ ₦500.00    │ ₦15.00     │ Main Wallet      │ - N/A      │ [View]     │
│ TXN123456791    │ Airtime  │ ₦100.00    │ ₦3.00      │ Commission Wallet│ ⚠ Missing  │ [View][Fix]│
└─────────────────┴──────────┴────────────┴────────────┴──────────────────┴────────────┴────────────┘
```

### Client-Side Logic for Status Indicators

```javascript
function getLogStatus(transaction) {
  // Commission sent to Main Wallet - no log expected
  if (transaction.commission_to === "Main Wallet") {
    return { status: "N/A", color: "gray", icon: "-" };
  }
  
  // Commission sent to Commission Wallet - log should exist
  if (transaction.commission_to === "Commission Wallet") {
    // No log found - data integrity issue
    if (transaction.log_id === null) {
      return { status: "Missing", color: "red", icon: "⚠" };
    }
    
    // Log exists but amount doesn't match
    if (transaction.log_amount !== transaction.commission_amount) {
      return { status: "Mismatch", color: "orange", icon: "⚠" };
    }
    
    // Log exists and amount matches
    return { status: "Matched", color: "green", icon: "✓" };
  }
  
  return { status: "Unknown", color: "gray", icon: "?" };
}
```

### React Component Example

```javascript
import React, { useState } from 'react';

const AdminCommissionReport = () => {
  const [partnerId, setPartnerId] = useState('');
  const [date, setDate] = useState('');
  const [view, setView] = useState('summary'); // 'summary' or 'details'
  const [data, setData] = useState(null);

  const fetchReport = async () => {
    const endpoint = view === 'summary' 
      ? '/api/admin/commissions/daily-summary'
      : '/api/admin/commissions/daily-details';
    
    const response = await fetch(
      `${endpoint}?user_id=${partnerId}&date=${date}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    const result = await response.json();
    setData(result.data);
  };

  const hasIssues = (summary) => {
    return summary.total_log_amount !== summary.total_commission_amount ||
           summary.log_record_count !== summary.transaction_count;
  };

  return (
    <div className="admin-commission-report">
      <h2>Commission Reconciliation Report</h2>
      
      <div className="filters">
        <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
          <option value="">Select Partner</option>
          {/* Partner options */}
        </select>
        
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
        />
        
        <div className="view-toggle">
          <button 
            className={view === 'summary' ? 'active' : ''}
            onClick={() => setView('summary')}
          >
            Summary
          </button>
          <button 
            className={view === 'details' ? 'active' : ''}
            onClick={() => setView('details')}
          >
            Details
          </button>
        </div>
        
        <button onClick={fetchReport}>Generate Report</button>
      </div>

      {data && view === 'summary' && (
        <table className="summary-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Total Amount</th>
              <th>Commission</th>
              <th>Log Amount</th>
              <th>Txns</th>
              <th>Logs</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.summaries.map(summary => (
              <tr key={summary.type} className={hasIssues(summary) ? 'warning' : ''}>
                <td>{summary.type}</td>
                <td>₦{(summary.total_amount / 100).toLocaleString()}</td>
                <td>₦{(summary.total_commission_amount / 100).toLocaleString()}</td>
                <td>₦{(summary.total_log_amount / 100).toLocaleString()}</td>
                <td>{summary.transaction_count}</td>
                <td>{summary.log_record_count}</td>
                <td>{hasIssues(summary) ? '⚠ Issues' : '✓ OK'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data && view === 'details' && (
        <div className="details-view">
          <p>Total Records: {data.record_count}</p>
          <table className="details-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Commission</th>
                <th>Commission To</th>
                <th>Log Status</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map(txn => {
                const logStatus = getLogStatus(txn);
                return (
                  <tr key={txn.transaction_id}>
                    <td>{txn.transaction_id}</td>
                    <td>{txn.type}</td>
                    <td>₦{(txn.amount / 100).toLocaleString()}</td>
                    <td>₦{(txn.commission_amount / 100).toLocaleString()}</td>
                    <td>{txn.commission_to}</td>
                    <td style={{ color: logStatus.color }}>
                      {logStatus.icon} {logStatus.status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
```

---

## Historical Context

### Known Data Integrity Issue

In the past, there was a scenario where:
1. A transaction was successfully processed
2. The commission amount was calculated
3. The query to update `commission_amount` and `commission_to` fields may have failed
4. However, the `WalletTransactionLog` record was still created

This resulted in:
- Transactions with null or incorrect `commission_amount`/`commission_to` values
- Corresponding wallet logs that exist but don't match the transaction record

### Using These Endpoints for Reconciliation

The admin endpoints help identify these historical issues by:
1. **Summary View**: Quickly spot types with mismatched totals
2. **Details View**: Drill down to specific problematic transactions
3. **Log Status**: Identify which transactions need manual review or correction

---

## Changelog

### Version 1.1.0 (2026-03-04)
- Added admin endpoint `/admin/commissions/daily-summary` for daily commission reconciliation
- Added admin endpoint `/admin/commissions/daily-details` for detailed transaction-log matching
- Added wallet transaction log reconciliation features
- Added documentation for data integrity checks
- Added UI implementation examples for admin reconciliation reports

### Version 1.0.0 (2024-12-24)
- Initial release
- Added `/commission/summary` endpoint
- Added `/commission/details` endpoint with pagination
- Added `/commission/by-network` endpoint
- Support for filtering by transaction types
- Date range filtering support
