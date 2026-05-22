# Troubleshooting: Blank Transaction Graph

## Issue: Graph shows "No transactions in the last 24 hours"

This is **expected behavior** if:
1. The logged-in user hasn't made any transactions in the last 24 hours
2. You're viewing the user dashboard (not admin)

### Solution 1: Test with a User Who Has Transactions

From the backend verification, we know **User 6** and **User 7** have transaction data:

```
User 6:
  Airtime: Success=1, Failed=1, Others=2

User 7:
  Airtime: Success=1, Failed=0, Others=0
```

**To see the graph with data:**
1. Login as User ID 6 or User ID 7
2. Navigate to `/dashboard`
3. The graph should display their transaction trends

### Solution 2: Create Test Transactions for Current User

If you want to see data for the currently logged-in user, create some test transactions:

1. Make a few test transactions (Airtime, Data, or Utilities)
2. Wait for the hourly cron job to run (runs at the top of each hour)
3. OR manually run the backfill script:
   ```bash
   cd /Users/abel/dev/bytecode/golang/hisa
   go run cmd/backfill_transaction_stats/main.go -days 1
   ```
4. Refresh the dashboard

### Solution 3: View Admin Global Stats

To see **all users' combined statistics**:

1. Login as an admin user
2. Navigate to `/admin/transaction-stats`
3. This shows global trends (sum of all users)

## Debugging Steps

### 1. Check Browser Console

Open browser DevTools (F12) and check the Console tab for:

```
Fetching stats from: self-service/transactions/hourly-stats?from=...&to=...
API Response: {...}
Stats count: 0
Filled stats count: 25
```

- If `Stats count: 0` → User has no transactions (expected)
- If you see an error → Check the error message

### 2. Verify API is Working

Test the API directly using curl or Postman:

**For User Stats:**
```bash
curl -X GET "http://localhost:3000/api/self-service/transactions/hourly-stats?from=2026-05-21%2011:00:00&to=2026-05-22%2011:00:00" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**For Admin Global Stats:**
```bash
curl -X GET "http://localhost:3000/api/admin/transactions/hourly-stats/global?from=2026-05-21%2011:00:00&to=2026-05-22%2011:00:00" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

Expected response:
```json
{
  "data": {
    "from": "2026-05-21 11:00:00",
    "to": "2026-05-22 11:00:00",
    "count": 2,
    "stats": [
      {
        "hour_start": "2026-05-22 11:00:00",
        "airtime_successful": 2,
        "airtime_failed": 1,
        ...
      }
    ],
    "type": "user"
  }
}
```

### 3. Check Backend Data

Verify data exists in the database:

```bash
cd /Users/abel/dev/bytecode/golang/hisa
go run cmd/verify_stats/main.go
```

This shows what's actually stored in the database.

### 4. Run Backfill

If data is missing, run the backfill script:

```bash
cd /Users/abel/dev/bytecode/golang/hisa
go run cmd/backfill_transaction_stats/main.go -days 1
```

## Common Issues

### Issue: "Failed to load transaction statistics"

**Cause:** API endpoint not accessible or authentication failed

**Solution:**
1. Check if backend is running
2. Verify authentication token is valid
3. Check CORS settings
4. Check browser Network tab for the actual error

### Issue: Graph shows but all lines are at zero

**Cause:** User has no transactions, but the graph is working correctly

**Solution:** This is expected! The graph fills missing hours with zeros. Create some transactions to see data.

### Issue: Graph doesn't update after making transactions

**Cause:** Hourly aggregation hasn't run yet

**Solution:**
1. Wait for the top of the next hour (cron job runs hourly)
2. OR manually run backfill script
3. Refresh the page

## Expected Behavior

✅ **User Dashboard** (`/dashboard`):
- Shows only the logged-in user's transactions
- If user has no transactions → Shows "No transactions in the last 24 hours"
- If user has transactions → Shows colorful line graph

✅ **Admin Dashboard** (`/admin/transaction-stats`):
- Shows combined stats from ALL users
- Should always have data if any user has transactions
- If completely blank → No users have made transactions in last 24 hours

## Quick Test

To quickly test if the graph works:

1. **Backend**: Ensure you have data
   ```bash
   cd /Users/abel/dev/bytecode/golang/hisa
   go run cmd/verify_stats/main.go
   ```

2. **Frontend**: Login as User 6 or 7 (they have data)

3. **Navigate**: Go to `/dashboard`

4. **Verify**: You should see a graph with green/red/amber lines

## Still Having Issues?

Check these files for any errors:

1. **Frontend Console**: Browser DevTools → Console tab
2. **Network Tab**: Browser DevTools → Network tab → Look for failed requests
3. **Backend Logs**: Check Go server logs for errors
4. **Database**: Verify `transaction_hourly_stats` table has data

The graph component includes extensive console logging, so check the browser console for detailed debugging information!
