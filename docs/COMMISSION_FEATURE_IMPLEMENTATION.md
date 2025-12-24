# Commission Feature Implementation

## Overview
This document describes the implementation of the commission reporting feature based on the API documentation in `COMMISSION_API_DOCUMENTATION.md`.

## Features Implemented

### 1. Navigation Menu
- Added a new "Commission" collapsible menu item in the sidebar with three sub-items:
  - **Summary**: Overview with charts and summary tables
  - **Details**: Detailed transaction list with pagination
  - **By Network**: Network performance analysis

### 2. Commission Summary Page (`/commission/summary`)
**Location**: `app/commission/summary/page.tsx`

**Features**:
- Date range picker (defaults to current month)
- Multi-select filter for transaction types (Airtime, Data, Gift-Data, Cable, Electricity)
- Three summary cards showing:
  - Total Commission
  - Total Transactions
  - Total Amount
- **Pie Chart**: Visual distribution of commissions by transaction type
- **Bar Chart**: Commission amounts by transaction type
- **Detailed Table**: Complete breakdown with:
  - Transaction type
  - Number of transactions
  - Total amount
  - Commission earned
  - Average commission per transaction
  - Summary row with totals

### 3. Commission Details Page (`/commission/details`)
**Location**: `app/commission/details/page.tsx`

**Features**:
- Date range picker
- Multi-select filter for transaction types
- Paginated table showing individual transactions:
  - Transaction ID
  - Type (with color-coded tags)
  - Network
  - Amount
  - Commission amount
  - Status
  - Date/time
- Pagination controls (20, 50, 100, 200 items per page)
- Shows total count and current range

### 4. Commission by Network Page (`/commission/by-network`)
**Location**: `app/commission/by-network/page.tsx`

**Features**:
- Date range picker
- Multi-select filter for transaction types
- Three summary cards (same as Summary page)
- **Grouped Bar Chart**: Shows commission by network and transaction type
- **Detailed Table**: Network performance breakdown showing:
  - Transaction type
  - Network/provider
  - Number of transactions
  - Total amount
  - Commission earned
  - Average commission
  - Summary row with totals

## Technical Implementation

### Files Created/Modified

#### New Files:
1. `utils/commissionHelpers.ts` - Utility functions and types
2. `app/commission/summary/page.tsx` - Summary page component
3. `app/commission/details/page.tsx` - Details page component
4. `app/commission/by-network/page.tsx` - By Network page component

#### Modified Files:
1. `utils/routes.ts` - Added commission routes
2. `utils/api/apiEndpoints.ts` - Added commission API endpoints
3. `components/SidebarTwo.tsx` - Added commission menu item

### Utility Functions (`utils/commissionHelpers.ts`)

```typescript
// Currency formatting (kobo to naira)
formatCurrency(kobo: number): string

// Number formatting with locale
formatNumber(num: number): string

// Kobo to Naira conversion
koboToNaira(kobo: number): number

// Transaction types array
TRANSACTION_TYPES = [Airtime, Data, Gift-Data, Cable, Electricity]

// Chart colors mapping
CHART_COLORS = { Airtime: blue, Data: green, Cable: orange, ... }
```

### TypeScript Interfaces

```typescript
CommissionSummaryData
CommissionDetailsData
CommissionByNetworkData
CommissionSummaryItem
CommissionDetailItem
CommissionByNetworkItem
```

## API Integration

All pages integrate with the following API endpoints:
- `GET /api/commission/summary`
- `GET /api/commission/details`
- `GET /api/commission/by-network`

Query parameters supported:
- `from_date` (YYYY-MM-DD)
- `to_date` (YYYY-MM-DD)
- `types` (comma-separated list)
- `page` (for details endpoint)
- `limit` (for details endpoint)

## UI/UX Features

1. **Consistent Filtering**: All pages have the same filter interface
2. **Responsive Design**: Works on mobile, tablet, and desktop
3. **Loading States**: Spinners shown during data fetch
4. **Error Handling**: Toast messages for API errors
5. **Color Coding**: 
   - Transaction types have consistent colors across all charts
   - Status tags are color-coded (green for success, red for failure)
6. **Currency Formatting**: All amounts displayed in Nigerian Naira (₦)
7. **Number Formatting**: Large numbers formatted with commas

## Charts Used

1. **Pie Chart** (Recharts): Commission distribution
2. **Bar Chart** (Recharts): Commission by type
3. **Grouped Bar Chart** (Recharts): Commission by network and type

## Dependencies

All required dependencies are already in `package.json`:
- `recharts` - For charts
- `antd` - For UI components (Table, DatePicker, Select, etc.)
- `dayjs` - For date handling
- `axios` - For API calls

## Usage Instructions

1. **Navigate to Commission Menu**: Click on "Commission" in the sidebar
2. **Select a Report Type**: Choose Summary, Details, or By Network
3. **Apply Filters**:
   - Select date range (defaults to current month)
   - Optionally select specific transaction types
   - Click "Apply Filters" button
4. **View Results**:
   - Summary cards show key metrics
   - Charts provide visual analysis
   - Tables show detailed data
5. **Export** (if needed): Tables can be copied or exported

## Filter Behavior

- **No types selected**: Shows all transaction types
- **One or more types selected**: Shows only selected types
- **Date range**: Required, defaults to current month
- **Pagination** (Details page): Maintains filters when changing pages

## Color Scheme

- **Airtime**: Blue (#0088FE)
- **Data**: Green (#00C49F)
- **Cable**: Orange (#FFBB28)
- **Electricity**: Red (#FF8042)
- **Gift-Data**: Purple (#8884D8)

## Notes

- All monetary values are converted from kobo to naira for display
- Dates are formatted as YYYY-MM-DD for API calls
- Tables include summary rows showing totals
- Charts are responsive and resize with the viewport
