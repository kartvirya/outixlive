# Backend Integration Guide - Push Notifications

## ✅ Your Backend Data Structure

Your backend is **fully compatible** with the app's notification deep linking feature!

### Response Structures

#### 1. Single Notification Details (POST /myalerts/{notificationId})

```json
{
  "msg": {
    "NotificationID": "MTc4OTEwNDkzNDQ=",
    "EventID": "MA==",
    "PushedDate": "2026-01-28 11:55:32",
    "opened": "0",
    "OpenDate": null,
    "notification_type": "Class Call",
    "notification": "Pro and sportsman should be heading to the lanes.",
    "notification_message": "Pro and sportsman should be heading to the lanes.",
    "EventInfo": "The Bend Motorsport Park Pty Ltd",
    "alertinfo": "",
    "notification_icon": "1"
  },
  "error": false,
  "status": 200
}
```

#### 2. Alerts List (POST /myalerts)

```json
{
  "msg": [
    {
      "NotificationID": "MzE0MDA2MTcyMTY=",
      "EventID": "NjA5NzU2MTcxNTI=",
      "PushedDate": "2026-01-29 06:01:25",
      "opened": "0",
      "OpenDate": null,
      "notification_type": "As",
      "notification": "As",
      "notification_message": "As",
      "EventInfo": "Outlaw Speed Shop Off-Street Drag Meet Saturday 28 February 2026",
      "alertinfo": "",
      "notification_icon": "8"
    },
    ...
  ],
  "error": false,
  "status": 200
}
```

---

## 🔧 What You Need to Configure

### Push Notification Payload

When sending a push notification from your backend, include the **base64 encoded NotificationID** in the data payload:

```json
{
  "to": "ExponentPushToken[xxx]",
  "sound": "default",
  "title": "Class Call",
  "body": "Pro and sportsman should be heading to the lanes.",
  "data": {
    "notificationId": "MTc4OTEwNDkzNDQ=",
    "NotificationID": "MTc4OTEwNDkzNDQ="
  },
  "badge": 1
}
```

**Important Notes:**

- ✅ Use the **base64 encoded** NotificationID (e.g., "MTc4OTEwNDkzNDQ=")
- ✅ Include both `notificationId` and `NotificationID` for compatibility
- ✅ The app will pass this ID directly to your `/myalerts/{notificationId}` endpoint
- ✅ Your backend handles the base64 decoding - the app doesn't need to

---

## 📱 App Display Mapping

The app displays your backend fields as follows:

### Notification Detail Bottom Sheet

| Backend Field          | Display Location                   | Example                                                |
| ---------------------- | ---------------------------------- | ------------------------------------------------------ |
| `notification_type`    | Type badge                         | "Class Call"                                           |
| `notification`         | Title                              | "Pro and sportsman should be heading to the lanes."    |
| `notification_message` | Message body                       | "Pro and sportsman should be heading to the lanes."    |
| `EventInfo`            | Event card                         | "The Bend Motorsport Park Pty Ltd"                     |
| `alertinfo`            | Additional info section            | (if not empty)                                         |
| `PushedDate`           | Date footer                        | "28 Jan 2026, 11:55 AM" (converted to user's timezone) |
| `opened`               | Read status                        | "0" = New, "1" = Read                                  |
| `notification_icon`    | (Reserved for future icon display) | "1"                                                    |

### Alerts Screen

| Backend Field          | Display             | Notes                                          |
| ---------------------- | ------------------- | ---------------------------------------------- |
| `notification_type`    | Badge/Label         | Mapped to type (urgent, call, schedule, alert) |
| `notification_message` | Message preview     | First line shown, expandable                   |
| `EventInfo`            | Event name subtitle | Shows event/venue name                         |
| `PushedDate`           | Relative time       | "2 hours ago", "Yesterday", etc.               |

---

## 🚀 Complete Flow

### 1. Backend Sends Push Notification

```javascript
// Your backend code
const notification = {
  to: userPushToken,
  sound: "default",
  title: notificationData.notification_type,
  body: notificationData.notification_message,
  data: {
    notificationId: notificationData.NotificationID, // Base64 encoded
    NotificationID: notificationData.NotificationID, // Backup field
  },
  badge: unreadCount,
};

// Send via Expo Push API or AWS SNS
await sendPushNotification(notification);
```

### 2. User Taps Notification (App Closed)

```
User taps notification
  ↓
App opens automatically
  ↓
App extracts notificationId: "MTc4OTEwNDkzNDQ="
  ↓
App calls: POST /myalerts/MTc4OTEwNDkzNDQ=
  ↓
Backend returns notification details
  ↓
App displays in bottom sheet
  ↓
App calls: POST /myalerts/read/MTc4OTEwNDkzNDQ=
```

### 3. Backend Response

```json
{
  "msg": {
    "NotificationID": "MTc4OTEwNDkzNDQ=",
    "notification_type": "Class Call",
    "notification": "Pro and sportsman should be heading to the lanes.",
    "notification_message": "Pro and sportsman should be heading to the lanes.",
    "EventInfo": "The Bend Motorsport Park Pty Ltd",
    "PushedDate": "2026-01-28 11:55:32",
    "opened": "0",
    ...
  },
  "error": false,
  "status": 200
}
```

### 4. App Displays

- ✅ Bottom sheet opens with notification details
- ✅ Shows event info: "The Bend Motorsport Park Pty Ltd"
- ✅ Shows type badge: "Class Call"
- ✅ Shows message with proper formatting
- ✅ Shows date converted to user's local timezone
- ✅ Marks as read automatically

---

## 🎯 Backend Checklist

### Required for Deep Linking to Work:

- [x] **Push Notification Data**: Include `notificationId` in push payload data

  ```json
  "data": {
    "notificationId": "base64_encoded_id",
    "NotificationID": "base64_encoded_id"
  }
  ```

- [x] **API Endpoint**: POST /myalerts/{notificationId}
  - Accepts base64 encoded notification ID
  - Returns notification details in `msg` object
  - Includes all fields: NotificationID, EventInfo, notification_type, etc.

- [x] **Mark as Read**: POST /myalerts/read/{notificationId}
  - Accepts base64 encoded notification ID
  - Updates `opened` field to "1"
  - Returns success response

---

## 🧪 Testing Instructions

### 1. Using Built-in Test Component

1. Open app → Navigate to **UI Examples**
2. Scroll to **"Notification Deep Link Test"**
3. Enter a valid base64 NotificationID (e.g., "MTc4OTEwNDkzNDQ=")
4. Tap "Send Test Notification"
5. Close the app completely
6. Tap the notification
7. Verify bottom sheet shows correct data with EventInfo

### 2. Using Real Backend Notification

```bash
# Send a test push notification from your backend
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[xxx]",
    "title": "Test Class Call",
    "body": "Testing deep link",
    "data": {
      "notificationId": "MTc4OTEwNDkzNDQ=",
      "NotificationID": "MTc4OTEwNDkzNDQ="
    },
    "sound": "default",
    "badge": 1
  }'
```

---

## 🐛 Troubleshooting

### Issue: Bottom sheet shows error

**Check:**

1. NotificationID in push payload matches an ID in your database
2. NotificationID is base64 encoded (contains `=` padding)
3. API endpoint `/myalerts/{id}` returns data in `msg` object

### Issue: EventInfo not showing

**Check:**

1. Backend response includes `EventInfo` field
2. EventInfo is not empty string
3. Check console logs: should show "Event: The Bend Motorsport Park Pty Ltd"

### Issue: Notification not opening app

**Check:**

1. Push payload includes `notificationId` or `NotificationID` in `data`
2. Check console logs: `[NOTIFICATION] ✅ Found notification ID: xxx`
3. Verify notification permissions are granted

---

## 📊 Field Usage Summary

### Critical Fields (Required):

- `NotificationID` - Base64 encoded ID (used in API calls)
- `notification_type` - Type of notification (displayed as badge)
- `notification_message` - Main message content
- `PushedDate` - Timestamp (converted to user's timezone)
- `opened` - Read status ("0" or "1")

### Important Fields (Recommended):

- `EventInfo` - Event/Venue name (displayed prominently)
- `notification` - Title (shown if different from message)
- `EventID` - Event identifier (base64 encoded)

### Optional Fields:

- `alertinfo` - Additional information (shown if not empty)
- `notification_icon` - Icon identifier (reserved for future use)
- `OpenDate` - When notification was read

---

## ✅ Current Status

- ✅ App updated to display `EventInfo` field
- ✅ App handles base64 encoded NotificationIDs
- ✅ Deep linking works with your exact backend structure
- ✅ All notification fields properly mapped
- ✅ Timezone conversion applied to PushedDate
- ✅ Read/unread status working correctly

**No backend changes required!** Your current API structure is fully compatible.

---

## 📞 Support

If you encounter issues:

1. Check console logs (filter by `[NOTIFICATION]` prefix)
2. Verify push payload includes `notificationId`
3. Test with the built-in test component first
4. Ensure backend endpoints return correct format

---

**Last Updated**: January 29, 2026  
**Integration Status**: ✅ Complete and Tested
