# Updated Backend Integration - Push Notifications

## ✅ New Approach: Match by Content

The app now uses a more robust approach that doesn't rely on notification IDs being in the push payload. Instead, it matches notifications by **notification_type** and **notification_message**.

---

## 🔧 How It Works Now

### 1. User Taps Notification (App Closed/Background)

```
User taps notification
  ↓
App opens automatically
  ↓
App extracts: notification_type and notification_message from payload
  ↓
App calls: POST /myalerts (fetch ALL alerts)
  ↓
App filters alerts to find matching type + message
  ↓
App displays matching alert in bottom sheet
  ↓
App marks as read: POST /myalerts/read/{NotificationID}
```

### 2. What Gets Matched

The app looks for an alert where **BOTH** match:

- `notification_type` from push === `notification_type` from alert
- `notification_message` from push === `notification_message` from alert

---

## 📱 Push Notification Payload Format

### Required Format

```json
{
  "to": "ExponentPushToken[xxx]",
  "sound": "default",
  "title": "Class Call",
  "body": "Pro and sportsman should be heading to the lanes.",
  "data": {
    "notification_type": "Class Call",
    "notification_message": "Pro and sportsman should be heading to the lanes."
  },
  "badge": 1
}
```

### Important Notes

✅ **notification_type** must exactly match the alert's `notification_type` field  
✅ **notification_message** must exactly match the alert's `notification_message` field  
✅ Case-sensitive matching  
✅ No need to include NotificationID anymore

---

## 🎯 Backend Requirements

### When Creating a Notification:

1. **Save to Database**

   ```sql
   INSERT INTO notifications (
     NotificationID,
     notification_type,
     notification_message,
     EventInfo,
     ...
   ) VALUES (...)
   ```

2. **Send Push Notification with Same Values**

   ```javascript
   const notification = {
     to: userPushToken,
     sound: "default",
     title: notificationData.notification_type,
     body: notificationData.notification_message,
     data: {
       notification_type: notificationData.notification_type, // EXACT match
       notification_message: notificationData.notification_message, // EXACT match
     },
     badge: unreadCount,
   };
   ```

3. **Critical**: The `notification_type` and `notification_message` in the push payload **MUST** exactly match what's stored in the database.

---

## 📊 Example Flow

### Backend Creates Notification

```javascript
const newNotification = {
  NotificationID: "MTc4OTEwNDkzNDQ=",
  EventID: "MA==",
  notification_type: "Class Call",
  notification_message: "Pro and sportsman should be heading to the lanes.",
  EventInfo: "The Bend Motorsport Park Pty Ltd",
  PushedDate: "2026-01-28 11:55:32",
  opened: "0",
};

// Save to database
await saveNotification(newNotification);

// Send push notification with SAME values
await sendPushNotification({
  to: userToken,
  title: "Class Call",
  body: "Pro and sportsman should be heading to the lanes.",
  data: {
    notification_type: "Class Call", // ← Same as DB
    notification_message: "Pro and sportsman should be heading to the lanes.", // ← Same as DB
  },
});
```

### App Receives and Matches

```javascript
// 1. User taps notification
// 2. App extracts from payload.data:
const type = "Class Call";
const message = "Pro and sportsman should be heading to the lanes.";

// 3. App calls GET /myalerts
const alerts = await getMyAlerts();

// 4. App finds match:
const match = alerts.find(
  (alert) =>
    alert.notification_type === type && alert.notification_message === message,
);

// 5. App displays match.NotificationID = "MTc4OTEwNDkzNDQ="
```

---

## 🧪 Testing

### Test Push Notification

```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[xxx]",
    "title": "Class Call",
    "body": "Pro and sportsman should be heading to the lanes.",
    "data": {
      "notification_type": "Class Call",
      "notification_message": "Pro and sportsman should be heading to the lanes."
    },
    "sound": "default",
    "badge": 1
  }'
```

### Verify in Console

Look for these logs:

```
[NOTIFICATION] 📦 Type: Class Call
[NOTIFICATION] 📦 Message: Pro and sportsman should be heading to the lanes.
[NOTIFICATION] 🔎 Fetching all alerts to find match...
[NOTIFICATION] 📦 Found 25 total alerts
[NOTIFICATION] 🔍 Checking alert: MTc4OTEwNDkzNDQ=
[NOTIFICATION]   Type match: true (Class Call === Class Call)
[NOTIFICATION]   Message match: true
[NOTIFICATION] ✅ Found matching alert: MTc4OTEwNDkzNDQ=
[NOTIFICATION] ✅ Bottom sheet opened to index 2
```

---

## 🐛 Troubleshooting

### Issue: "No matching alert found"

**Possible Causes:**

1. **Type mismatch**: Check exact spelling/capitalization

   ```javascript
   // ❌ Wrong
   data: {
     notification_type: "class call";
   } // lowercase
   // ✅ Correct
   data: {
     notification_type: "Class Call";
   } // matches DB
   ```

2. **Message mismatch**: Check for extra spaces, newlines, or different text

   ```javascript
   // ❌ Wrong
   data: {
     notification_message: "Pro and sportsman should head to the lanes.";
   }
   // ✅ Correct
   data: {
     notification_message: "Pro and sportsman should be heading to the lanes.";
   }
   ```

3. **Alert not in database yet**: Ensure notification is saved before sending push

**Debug Steps:**

1. Check console logs for type and message being searched
2. Verify the alert exists in `/myalerts` response
3. Compare strings character-by-character

### Issue: Multiple matches found

If multiple alerts have the same type and message, the app will use the **first match** found. To avoid this:

- Make notification messages unique (add timestamp, event name, etc.)
- Or include additional fields in the match criteria

---

## 📝 Code Examples

### Node.js Backend Example

```javascript
async function createAndSendNotification(userId, eventId, type, message) {
  // 1. Create notification in database
  const notification = await db.notifications.create({
    EventID: eventId,
    notification_type: type,
    notification_message: message,
    EventInfo: eventName,
    PushedDate: new Date().toISOString(),
    opened: "0",
  });

  // 2. Get user's push token
  const pushToken = await getUserPushToken(userId);

  // 3. Send push notification with EXACT same values
  await sendPush({
    to: pushToken,
    title: type,
    body: message,
    data: {
      notification_type: type, // ← Must match DB
      notification_message: message, // ← Must match DB
    },
  });

  return notification;
}
```

### PHP Backend Example

```php
function createAndSendNotification($userId, $eventId, $type, $message) {
    // 1. Save to database
    $notificationId = saveNotification([
        'EventID' => $eventId,
        'notification_type' => $type,
        'notification_message' => $message,
        'EventInfo' => $eventName,
        'PushedDate' => date('Y-m-d H:i:s'),
        'opened' => '0'
    ]);

    // 2. Get push token
    $pushToken = getUserPushToken($userId);

    // 3. Send push notification
    $payload = [
        'to' => $pushToken,
        'title' => $type,
        'body' => $message,
        'data' => [
            'notification_type' => $type,      // Must match DB
            'notification_message' => $message // Must match DB
        ],
        'sound' => 'default',
        'badge' => getUnreadCount($userId)
    ];

    sendPushNotification($payload);
}
```

---

## ✅ Advantages of This Approach

1. ✅ **No ID encoding issues**: Don't need to worry about base64 encoding/decoding
2. ✅ **More robust**: Works even if ID is missing from payload
3. ✅ **Simpler backend**: Just include type and message in push data
4. ✅ **Self-healing**: If push data is lost, can still match by content
5. ✅ **Better debugging**: Easy to see what's being matched in logs

---

## 📋 Checklist for Backend Team

- [ ] Update push notification service to include `notification_type` in data
- [ ] Update push notification service to include `notification_message` in data
- [ ] Ensure exact string matching between DB and push payload
- [ ] Test with a sample notification
- [ ] Verify matching works in app console logs
- [ ] Remove NotificationID from push payload (no longer needed)

---

**Last Updated**: January 29, 2026  
**Method**: Content Matching (notification_type + notification_message)  
**Status**: ✅ Implemented and Ready
