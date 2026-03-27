# Test Beneficiary System - UI Request Format Updates

## Important Changes

The test beneficiary endpoints now use **the exact same request payloads** as the regular transaction endpoints. This ensures consistency and allows the system to use real transaction processing logic.

---

## Updated Request Formats

### 1. Test Airtime Purchase ✅ (No Changes)

**Endpoint**: `POST /api/test/airtime`

**Request**:
```json
{
  "beneficiary_id": 123,
  "amount": 100000  // in kobo (₦1,000)
}
```

---

### 2. Test Data Purchase ✅ (No Changes)

**Endpoint**: `POST /api/test/data`

**Request**:
```json
{
  "beneficiary_id": 124,
  "product_code": "M1"
}
```

---

### 3. Test Cable Subscription ⚠️ **UPDATED**

**Endpoint**: `POST /api/test/cable`

**Old Request** (No longer valid):
```json
{
  "beneficiary_id": 125,
  "product_code": "DSTV-COMPACT"
}
```

**New Request** (Required):
```json
{
  "beneficiary_id": 125,
  "biller": "dstv",           // Must match beneficiary's biller_code
  "product": "DSTV-COMPACT",  // Product code
  "number": "1234567890",     // Must match beneficiary's identifier (smartcard)
  "name": "John Doe",         // Beneficiary name
  "address": "Lagos",         // Optional
  "ref": ""                   // Optional, auto-generated if empty
}
```

**Validation**:
- `biller` must match the beneficiary's `biller_code`
- `number` must match the beneficiary's `identifier` (smartcard number)
- If `ref` is not provided, it will be auto-set to `TEST-BEN-{beneficiary_id}`

---

### 4. Test Electricity Purchase ⚠️ **UPDATED**

**Endpoint**: `POST /api/test/electricity`

**Old Request** (No longer valid):
```json
{
  "beneficiary_id": 126,
  "amount": 300000  // in kobo (₦3,000)
}
```

**New Request** (Required):
```json
{
  "beneficiary_id": 126,
  "amount": 300000,              // in kobo (₦3,000), max ₦5,000
  "biller": "ekedc",             // Must match beneficiary's biller_code
  "product": "prepaid",          // Product type (prepaid/postpaid)
  "meter": "12345678901234",     // Must match beneficiary's identifier (meter number)
  "name": "John Doe",            // Optional
  "address": "Lagos",            // Optional
  "ref": ""                      // Optional, auto-generated if empty
}
```

**Validation**:
- `amount` must be between ₦1,000 (100,000 kobo) and ₦5,000 (500,000 kobo)
- `biller` must match the beneficiary's `biller_code`
- `meter` must match the beneficiary's `identifier` (meter number)
- If `ref` is not provided, it will be auto-set to `TEST-BEN-{beneficiary_id}`

---

## Why These Changes?

### Benefits:
1. **Real Transaction Processing**: Test transactions now use the exact same code path as production transactions
2. **Consistency**: Same request format for test and production
3. **Accurate Testing**: Partners test with the actual API they'll use in production
4. **Single Source of Truth**: No duplicate transaction models or processing logic

### What Changed:
- Cable and electricity endpoints now require **full transaction payloads** (same as regular endpoints)
- The system validates that the payload matches the registered beneficiary
- Transactions are stored in the regular `transactions` table (identified by `external_ref` containing `TEST-BEN-{id}`)

---

## UI Implementation Guide

### Step 1: Get Beneficiary Details

When a user selects a beneficiary, retrieve its details:

```javascript
const beneficiary = {
  id: 125,
  type: "cable",
  identifier: "1234567890",  // smartcard number
  biller_code: "dstv",
  name: "My DSTV Account"
};
```

### Step 2: Build Request Payload

**For Cable:**
```javascript
const cableRequest = {
  beneficiary_id: beneficiary.id,
  biller: beneficiary.biller_code,    // From beneficiary
  product: selectedProduct.code,       // From product selection
  number: beneficiary.identifier,      // From beneficiary
  name: beneficiary.name,              // From beneficiary
  address: "",                         // Optional
  ref: ""                              // Auto-generated
};
```

**For Electricity:**
```javascript
const electricityRequest = {
  beneficiary_id: beneficiary.id,
  amount: userEnteredAmount,           // User input (max ₦5,000)
  biller: beneficiary.biller_code,     // From beneficiary
  product: "prepaid",                  // Or "postpaid"
  meter: beneficiary.identifier,       // From beneficiary
  name: beneficiary.name,              // From beneficiary
  address: "",                         // Optional
  ref: ""                              // Auto-generated
};
```

### Step 3: Pre-fill Form Fields

Since the beneficiary is already registered, you can **pre-fill** most fields:

```javascript
// Cable form
<input name="biller" value={beneficiary.biller_code} readOnly />
<input name="number" value={beneficiary.identifier} readOnly />
<input name="name" value={beneficiary.name} />
<select name="product">
  {/* Load products for this biller */}
</select>

// Electricity form
<input name="biller" value={beneficiary.biller_code} readOnly />
<input name="meter" value={beneficiary.identifier} readOnly />
<input name="name" value={beneficiary.name} />
<input name="amount" type="number" max="5000" />
<select name="product">
  <option value="prepaid">Prepaid</option>
  <option value="postpaid">Postpaid</option>
</select>
```

---

## Complete Example Flow

### Cable Subscription

```javascript
// 1. User selects beneficiary
const beneficiary = await fetch('/api/test/beneficiaries/125');

// 2. Load available products for this biller
const products = await fetch(`/api/bills/cable/biller-products?biller=${beneficiary.biller_code}`);

// 3. User selects product
const selectedProduct = products.find(p => p.code === 'DSTV-COMPACT');

// 4. Build and send request
const response = await fetch('/api/test/cable', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    beneficiary_id: beneficiary.id,
    biller: beneficiary.biller_code,
    product: selectedProduct.code,
    number: beneficiary.identifier,
    name: beneficiary.name,
    address: '',
    ref: ''
  })
});

const result = await response.json();
console.log('Transaction ID:', result.transaction_id);
```

### Electricity Purchase

```javascript
// 1. User selects beneficiary
const beneficiary = await fetch('/api/test/beneficiaries/126');

// 2. User enters amount (validate max ₦5,000)
const amount = 300000; // ₦3,000 in kobo

if (amount > 500000) {
  alert('Maximum test amount is ₦5,000');
  return;
}

// 3. Build and send request
const response = await fetch('/api/test/electricity', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    beneficiary_id: beneficiary.id,
    amount: amount,
    biller: beneficiary.biller_code,
    product: 'prepaid',
    meter: beneficiary.identifier,
    name: beneficiary.name,
    address: '',
    ref: ''
  })
});

const result = await response.json();
console.log('Transaction ID:', result.transaction_id);
console.log('Token:', result.token);
```

---

## Error Handling

### Common Errors

```javascript
// Biller mismatch
{
  "error": "Biller does not match beneficiary"
}

// Number/Meter mismatch
{
  "error": "Smartcard number does not match beneficiary"
}
// or
{
  "error": "Meter number does not match beneficiary"
}

// Amount exceeds limit
{
  "error": "Amount exceeds maximum test limit of ₦5,000.00"
}

// Beneficiary not verified
{
  "error": "beneficiary not verified. Please verify with OTP first"
}
```

---

## Migration Checklist for UI Team

- [ ] Update cable test form to include all required fields
- [ ] Update electricity test form to include all required fields
- [ ] Pre-fill `biller`, `number`/`meter`, and `name` from beneficiary data
- [ ] Make pre-filled fields read-only to prevent user modification
- [ ] Add validation to ensure fields match beneficiary
- [ ] Update API request payloads to match new format
- [ ] Test error handling for mismatched fields
- [ ] Update any documentation or help text

---

## Summary

**Key Changes:**
1. Cable endpoint now requires: `biller`, `product`, `number`, `name` (+ optional `address`, `ref`)
2. Electricity endpoint now requires: `amount`, `biller`, `product`, `meter` (+ optional `name`, `address`, `ref`)
3. All fields must match the registered beneficiary data
4. Transactions use real processing logic and appear in regular transaction history

**Benefits for Partners:**
- Test with the exact same API format they'll use in production
- Real transaction records for accurate testing
- Consistent behavior between test and production
- All existing transaction features work (history, export, etc.)
