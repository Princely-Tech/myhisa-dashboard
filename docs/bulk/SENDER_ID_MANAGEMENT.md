# SMS Sender ID Management - UI Implementation Guide

## Overview
This guide explains how to implement the SMS Sender ID management feature in the UI. Users can register custom sender IDs for their bulk SMS campaigns.

---

## What is a Sender ID?

A **Sender ID** is the name or number that appears as the sender when recipients receive an SMS. It can be:
- **Alphanumeric**: Up to 11 characters (e.g., "HISA", "MyBrand")
- **Numeric**: Phone number format

---

## Sender ID Types

1. **Transactional**: For transaction notifications, alerts, OTPs
2. **Promotional**: For marketing messages, promotions

---

## API Endpoints

### 1. Add Sender ID

**Endpoint**: `POST /api/sender-ids`

**Request Body**:
```json
{
  "sender_id": "HISA",
  "type": "transactional",
  "is_default": true
}
```

**Validation Rules**:
- `sender_id`: Required, 1-11 characters, alphanumeric
- `type`: Required, must be "transactional" or "promotional"
- `is_default`: Optional, boolean (default: false)

**Response (201 Created)**:
```json
{
  "message": "Sender ID added successfully",
  "sender_id": {
    "id": 1,
    "user_id": 123,
    "sender_id": "HISA",
    "type": "transactional",
    "is_default": true,
    "created_at": "2026-03-17T15:30:00Z",
    "updated_at": "2026-03-17T15:30:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input
- `409 Conflict`: Sender ID already exists

---

### 2. List Sender IDs

**Endpoint**: `GET /api/sender-ids`

**Response (200 OK)**:
```json
{
  "sender_ids": [
    {
      "id": 1,
      "user_id": 123,
      "sender_id": "HISA",
      "type": "transactional",
      "is_default": true,
      "created_at": "2026-03-17T15:30:00Z",
      "updated_at": "2026-03-17T15:30:00Z"
    },
    {
      "id": 2,
      "user_id": 123,
      "sender_id": "PROMO",
      "type": "promotional",
      "is_default": false,
      "created_at": "2026-03-17T15:35:00Z",
      "updated_at": "2026-03-17T15:35:00Z"
    }
  ],
  "total": 2
}
```

**Note**: Results are ordered by default status (default first), then by creation date (newest first).

---

### 3. Set Default Sender ID

**Endpoint**: `POST /api/sender-ids/:id/set-default`

**Response (200 OK)**:
```json
{
  "message": "Default sender ID updated successfully",
  "sender_id": {
    "id": 2,
    "user_id": 123,
    "sender_id": "PROMO",
    "type": "promotional",
    "is_default": true,
    "created_at": "2026-03-17T15:35:00Z",
    "updated_at": "2026-03-17T15:40:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid ID
- `404 Not Found`: Sender ID not found

---

### 4. Delete Sender ID

**Endpoint**: `DELETE /api/sender-ids/:id`

**Response (200 OK)**:
```json
{
  "message": "Sender ID deleted successfully"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid ID
- `404 Not Found`: Sender ID not found

---

## Integration with Bulk Upload

When creating a bulk campaign, users can optionally select a sender ID:

**Upload Endpoint**: `POST /api/bulk/airtime/upload`

**Form Data**:
```
file: [CSV file]
message_template: "Hello {{name}}, you received NGN {{amount}}"
sender_id: "HISA"  // Optional - if not provided, uses default sender ID
```

**Behavior**:
- If `sender_id` is provided: Validates it exists and belongs to the user
- If `sender_id` is not provided: Uses the default sender ID from environment variable
- If no default: Falls back to system default "HISA"

---

## UI Implementation Guide

### Page 1: Sender ID Management

**Location**: Settings > SMS Sender IDs

**Components Needed**:

1. **Sender ID List Table**
   - Columns: Sender ID, Type, Default, Actions
   - Show badge for default sender ID
   - Actions: Set as Default, Delete

2. **Add Sender ID Form**
   - Input: Sender ID (max 11 chars)
   - Select: Type (Transactional/Promotional)
   - Checkbox: Set as default
   - Button: Add Sender ID

**Sample Code**:
```javascript
// Fetch sender IDs
const fetchSenderIDs = async () => {
  const response = await fetch('/api/sender-ids', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.sender_ids;
};

// Add sender ID
const addSenderID = async (senderID, type, isDefault) => {
  const response = await fetch('/api/sender-ids', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sender_id: senderID,
      type: type,
      is_default: isDefault
    })
  });
  return await response.json();
};

// Set as default
const setDefault = async (id) => {
  const response = await fetch(`/api/sender-ids/${id}/set-default`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};

// Delete sender ID
const deleteSenderID = async (id) => {
  const response = await fetch(`/api/sender-ids/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

---

### Page 2: Bulk Upload with Sender ID Selection

**Location**: Bulk Upload Page

**Components Needed**:

1. **Sender ID Dropdown** (in upload form)
   - Load user's sender IDs
   - Show default sender ID pre-selected
   - Allow "Use Default" option
   - Link to "Manage Sender IDs" page

**Sample Code**:
```javascript
// In bulk upload form
const BulkUploadForm = () => {
  const [senderIDs, setSenderIDs] = useState([]);
  const [selectedSenderID, setSelectedSenderID] = useState('');

  useEffect(() => {
    // Load sender IDs
    fetchSenderIDs().then(data => {
      setSenderIDs(data);
      // Pre-select default
      const defaultSender = data.find(s => s.is_default);
      if (defaultSender) {
        setSelectedSenderID(defaultSender.sender_id);
      }
    });
  }, []);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('message_template', messageTemplate);
    if (selectedSenderID) {
      formData.append('sender_id', selectedSenderID);
    }

    const response = await fetch('/api/bulk/airtime/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    return await response.json();
  };

  return (
    <form>
      {/* File upload */}
      <input type="file" accept=".csv" />
      
      {/* Message template */}
      <textarea placeholder="Message template (optional)" />
      
      {/* Sender ID selection */}
      <select value={selectedSenderID} onChange={e => setSelectedSenderID(e.target.value)}>
        <option value="">Use Default</option>
        {senderIDs.map(sender => (
          <option key={sender.id} value={sender.sender_id}>
            {sender.sender_id} ({sender.type})
            {sender.is_default && ' - Default'}
          </option>
        ))}
      </select>
      
      <a href="/settings/sender-ids">Manage Sender IDs</a>
      
      <button onClick={handleUpload}>Upload</button>
    </form>
  );
};
```

---

## User Flow

### First Time Setup

1. User goes to Settings > SMS Sender IDs
2. Clicks "Add Sender ID"
3. Enters sender ID (e.g., "MYBRAND")
4. Selects type (Transactional or Promotional)
5. Checks "Set as default" if desired
6. Clicks "Add"
7. Sender ID is now available for bulk campaigns

### Using Sender ID in Bulk Upload

1. User goes to Bulk Upload page
2. Uploads CSV file
3. Enters message template
4. Selects sender ID from dropdown (or uses default)
5. Proceeds with upload
6. All SMS in the campaign will use the selected sender ID

---

## Validation & Error Handling

### Client-Side Validation

```javascript
const validateSenderID = (senderID) => {
  // Max 11 characters
  if (senderID.length > 11) {
    return 'Sender ID must be 11 characters or less';
  }
  
  // Must not be empty
  if (senderID.trim().length === 0) {
    return 'Sender ID is required';
  }
  
  // Alphanumeric only (optional - depends on provider)
  if (!/^[a-zA-Z0-9]+$/.test(senderID)) {
    return 'Sender ID must be alphanumeric';
  }
  
  return null;
};
```

### Error Messages

- **Duplicate**: "This sender ID already exists"
- **Invalid format**: "Sender ID must be 1-11 alphanumeric characters"
- **Invalid type**: "Type must be 'transactional' or 'promotional'"
- **Not found**: "Sender ID not found or doesn't belong to you"

---

## Environment Variables

The following environment variables control SMS behavior:

```env
# SMS API Configuration
SMS_API_KEY=your_eudormsg_api_key_here
SMS_DEFAULT_SENDER_ID=HISA

# SMS Cost (in kobo)
SMS_COST_KOBO=500
```

**Note**: If user doesn't select a sender ID and has no default set, the system will use `SMS_DEFAULT_SENDER_ID` from environment.

---

## Best Practices

1. **Always have a default**: Encourage users to set one sender ID as default
2. **Type matters**: Explain the difference between transactional and promotional
3. **Character limit**: Warn users about the 11-character limit
4. **Provider approval**: Some sender IDs may require approval from the SMS provider
5. **Testing**: Allow users to send test SMS before bulk campaigns

---

## UI/UX Recommendations

### Sender ID Management Page

```
┌─────────────────────────────────────────────────────────┐
│  SMS Sender IDs                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Add New Sender ID                               │  │
│  ├─────────────────────────────────────────────────┤  │
│  │ Sender ID:  [___________]  (max 11 chars)      │  │
│  │ Type:       [Transactional ▼]                   │  │
│  │ □ Set as default                                │  │
│  │ [Add Sender ID]                                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Your Sender IDs:                                      │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Sender ID  │ Type           │ Default │ Actions │  │
│  ├────────────┼────────────────┼─────────┼─────────┤  │
│  │ HISA       │ Transactional  │ ✓       │ Delete  │  │
│  │ PROMO      │ Promotional    │         │ Set     │  │
│  │            │                │         │ Default │  │
│  │            │                │         │ Delete  │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Bulk Upload Page (Sender ID Section)

```
┌─────────────────────────────────────────────────────────┐
│  SMS Settings (Optional)                                │
├─────────────────────────────────────────────────────────┤
│  Message Template:                                      │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Hello {{name}}, you received NGN {{amount}}     │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Sender ID:                                            │
│  [HISA (transactional) - Default ▼]                   │
│                                                         │
│  [Manage Sender IDs]                                   │
└─────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

- [ ] Add sender ID successfully
- [ ] Validate 11-character limit
- [ ] Prevent duplicate sender IDs
- [ ] Set sender ID as default
- [ ] Only one default at a time
- [ ] Delete sender ID
- [ ] List all sender IDs ordered correctly
- [ ] Upload bulk campaign with custom sender ID
- [ ] Upload bulk campaign without sender ID (uses default)
- [ ] Verify SMS sent with correct sender ID
- [ ] Error handling for invalid sender ID

---

## Support & Troubleshooting

### Common Issues

**Q: SMS not showing custom sender ID**
- Check if sender ID is approved by SMS provider
- Verify sender ID exists in user's list
- Check campaign details to confirm sender ID was saved

**Q: Can't add sender ID**
- Ensure sender ID is 11 characters or less
- Check for duplicate sender IDs
- Verify type is "transactional" or "promotional"

**Q: Default sender ID not working**
- Check environment variable `SMS_DEFAULT_SENDER_ID`
- Verify user has at least one sender ID marked as default
- Check API logs for sender ID selection

---

## Summary

The Sender ID management system allows users to:
1. Register custom sender IDs for their SMS campaigns
2. Set different sender IDs for transactional vs promotional messages
3. Choose which sender ID to use for each bulk campaign
4. Have a default sender ID for convenience

This provides flexibility and branding control for bulk SMS campaigns while maintaining simplicity for users who just want to use the default.
