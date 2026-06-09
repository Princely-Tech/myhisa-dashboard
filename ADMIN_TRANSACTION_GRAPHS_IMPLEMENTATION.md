# Admin Transaction Graphs Implementation

## Overview
Implemented a comprehensive admin interface for viewing transaction graphs with two modes:
1. **Global/Total Stats** - Aggregated stats across all users
2. **User-Specific Stats** - Stats for individual users

## Features Implemented

### 1. New Admin Page
**Location**: `/app/admin/transaction-graphs/page.tsx`

**Features**:
- Tab-based interface with two views:
  - **Global Stats Tab**: Shows aggregated transaction data across all users
  - **User-Specific Stats Tab**: Searchable dropdown to select and view any user's graph
- Searchable user selection with autocomplete
  - Search by name or email
  - Shows user name and email in dropdown
  - Loading state while fetching users
- User-friendly interface with clear messaging
- Confirmation banner showing selected user's name

### 2. Updated HourlyStatsGraph Component
**Location**: `/app/dashboard/HourlyStatsGraph.tsx`

**New Props**:
```typescript
{
  isAdmin?: boolean;  // Existing - determines if using admin endpoints
  userId?: number;    // NEW - specific user ID for admin to view
}
```

**Endpoint Logic**:
- If `isAdmin && userId`: Uses `/admin/transactions/hourly-stats/user/:userId`
- If `isAdmin` only: Uses `/admin/transactions/hourly-stats/global`
- Otherwise: Uses `/self-service/transactions/hourly-stats`

**Dynamic Titles**:
- User-specific: "User 6 Transaction Trends (Last 24 Hours)"
- Global: "Global Transaction Trends (Last 24 Hours)"
- Regular user: "Your Transaction Trends (Last 24 Hours)"

### 3. Navigation Updates

**Routes** (`utils/routes.ts`):
```typescript
adminTransactionGraphs: "/admin/transaction-graphs"
```

**Sidebar** (`components/SidebarTwo.tsx`):
- Added "Transaction Graphs" menu item under "Admin Tools"
- Icon: Chart line icon (`las la-chart-line`)
- Position: Between "Data Bundles" and "Audit Logs"

## Backend Endpoints (Already Existed)

### Global Stats Endpoint
```
GET /admin/transactions/hourly-stats/global?from=...&to=...
```
**What it does**: Aggregates all users' stats using SQL SUM
- If User A has 10 airtime successful and User B has 50 airtime successful
- The global graph shows 60 airtime successful for that hour

### User-Specific Stats Endpoint
```
GET /admin/transactions/hourly-stats/user/:userId?from=...&to=...
```
**What it does**: Returns stats for a specific user only

## How It Works

### Global View Example:
```
Hour: 10:00 AM
User 6: 10 successful airtime, 5 failed data
User 12: 50 successful airtime, 20 failed data
User 25: 15 successful utilities

Global Graph Shows:
- Airtime Successful: 60 (10 + 50)
- Data Failed: 25 (5 + 20)
- Utilities Successful: 15
```

### User-Specific View:
1. Admin opens searchable dropdown with all users
2. Searches by name or email (e.g., "John" or "john@example.com")
3. Selects a user from the dropdown
4. Graph automatically loads for that user
5. Title shows "User 6 Transaction Trends (Last 24 Hours)"
6. Alert banner shows selected user's name

## Usage

### For Admins:
1. Navigate to **Admin Tools** → **Transaction Graphs**
2. Choose between:
   - **Global Stats**: See total system-wide transaction trends
   - **User-Specific Stats**: Enter a User ID to see that user's trends

### Global Stats Tab:
- Automatically loads on page load
- Shows aggregated data across all users
- Useful for monitoring overall system health

### User-Specific Stats Tab:
- Click on the searchable dropdown
- Type to search by user name or email
- Select a user from the filtered results
- Graph automatically loads for that user
- Shows user's name in confirmation banner
- Can switch between different users by selecting from dropdown
- Clear selection to reset

## Data Categories (Same as Before)

Each graph shows 9 line series:
1. **Airtime**: Successful, Failed, Others
2. **Data**: Successful, Failed, Others
3. **Utilities**: Successful, Failed, Others

## Time Range
- Last 24 hours (25 data points)
- X-axis shows date + time for first and last points
- Middle points show time only

## Technical Details

### Component Reusability:
The `HourlyStatsGraph` component is now used in three contexts:
1. User dashboard (regular users viewing their own stats)
2. Admin global view (admins viewing total stats)
3. Admin user-specific view (admins viewing specific user stats)

### API Response Format:
```json
{
  "data": {
    "from": "2026-06-08 09:00:00",
    "to": "2026-06-09 09:00:00",
    "count": 25,
    "type": "global" | "user",
    "user_id": 6,  // Only for user-specific
    "stats": [
      {
        "hour_start": "2026-06-08 09:00:00",
        "airtime_successful": 60,
        "airtime_failed": 10,
        // ... other fields
      }
    ]
  }
}
```

## Files Modified

1. ✅ `/app/admin/transaction-graphs/page.tsx` - NEW
2. ✅ `/app/dashboard/HourlyStatsGraph.tsx` - Updated
3. ✅ `/utils/routes.ts` - Added route
4. ✅ `/components/SidebarTwo.tsx` - Added menu item

## Testing Checklist

- [ ] Global stats tab loads and shows aggregated data
- [ ] User-specific tab accepts User ID input
- [ ] Entering valid User ID shows that user's graph
- [ ] Invalid User ID shows error message
- [ ] Graph titles update correctly based on view
- [ ] Navigation from sidebar works
- [ ] All 9 line series display correctly
- [ ] Date labels show on first and last X-axis points
- [ ] Graphs handle zero data gracefully

## Benefits

1. **Centralized Monitoring**: Admins can see total system performance
2. **User Support**: Quickly view any user's transaction history
3. **Troubleshooting**: Identify patterns in user-specific or global data
4. **Reusable Component**: Same graph component works for all use cases
5. **Clean UI**: Tab-based interface keeps it organized
