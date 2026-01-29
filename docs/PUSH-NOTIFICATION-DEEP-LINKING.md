# Push Notification Deep Linking

## Overview

The app is fully configured to handle push notifications and open the notification details when a user taps on a notification, even when the app is closed.

## How It Works

### 1. **Notification Reception**

When a push notification is received:

- **App Open/Foreground**: Notification appears as a banner, user can tap it
- **App Closed/Background**: Notification appears in system tray, user can tap it

### 2. **Notification Tap Handling**

When user taps a notification:

- The app extracts the notification ID from the notification payload
- Calls the `/myalerts/{notificationId}` API endpoint
- Opens a bottom sheet displaying the full notification details
- Automatically marks the notification as read

### 3. **Implementation Details**

#### Files Involved:

- `app/_layout.tsx` - Main handler for notification taps
- `hooks/usePushNotifications.ts` - Push notification setup and listeners
- `components/notification-detail-bottom-sheet.tsx` - UI component for showing details
- `lib/api.ts` - API functions: `getAlertDetails()` and `markAlertAsRead()`

#### Flow:

```
User Taps Notification
  ↓
App Opens (if closed)
  ↓
getLastNotificationResponseAsync() captures the notification
  ↓
Extract notification ID from payload.data
  ↓
Call API: POST /myalerts/{notificationId}
  ↓
Display notification details in bottom sheet
  ↓
Mark as read: POST /myalerts/read/{notificationId}
```

## Backend Requirements

### Notification Payload Structure

Your backend MUST include the notification ID in the push notification payload's `data` field:

```json
{
  "to": "ExponentPushToken[xxx]",
  "title": "New Alert",
  "body": "You have a new notification",
  "data": {
    "notificationId": "123456",
    "NotificationID": "123456"
  }
}
```

### Supported Field Names

The app checks for the notification ID in the following fields (in order):

1. `notificationId`
2. `NotificationID`
3. `notification_id`
4. `id`
5. `alertId`
6. `AlertID`
7. `alert_id`
8. `orderId`
9. `orderid`

**Recommendation**: Use `notificationId` or `NotificationID` for consistency.

### API Endpoint Requirements

#### 1. Get Alert Details

```
POST /myalerts/{notificationId}
Headers:
  - devicetoken: {device_token}
  - Cookie: {session_cookie}

Response:
{
  "error": 0,
  "msg": {
    "NotificationID": "123456",
    "EventID": "789",
    "PushedDate": "2024-01-29 10:30:00",
    "opened": "0",
    "OpenDate": null,
    "notification_type": "event_update",
    "notification": "Event Update",
    "notification_message": "Your event has been updated",
    "alertinfo": "Additional info"
  }
}
```

#### 2. Mark Alert as Read

```
POST /myalerts/read/{notificationId}
Headers:
  - devicetoken: {device_token}
  - Cookie: {session_cookie}

Response:
{
  "error": 0,
  "msg": "Notification marked as read"
}
```

## Testing

### Test Locally

1. Send a test notification with the notification ID in the data payload
2. Close the app completely
3. Tap the notification
4. App should open and display the notification details

### Debug Logs

The app includes extensive logging with the `[NOTIFICATION]` prefix:

- `🔍 Checking for last notification response...` - Looking for tapped notification
- `📬 Found last notification response!` - Notification was tapped
- `✅ Found notification ID: xxx` - Successfully extracted ID
- `🔼 Attempting to open bottom sheet...` - Opening details view
- `✅ Bottom sheet opened to index 2` - Details view visible

### Common Issues

#### "No notification ID found in data"

**Problem**: The notification payload doesn't include a notification ID
**Solution**: Add `notificationId` or `NotificationID` to the `data` field in your push payload

#### "Bottom sheet ref is null"

**Problem**: The bottom sheet component isn't mounted yet
**Solution**: This is handled automatically with a 500ms delay

#### Notification doesn't open app

**Problem**: Notification permissions not granted or app not properly configured
**Solution**: Check that:

- User has granted notification permissions
- Push token is registered with backend
- Notification payload is correctly formatted

## Example: Backend Implementation

### Node.js/Express Example

```javascript
const sendNotificationWithDeepLink = async (
  userId,
  notificationId,
  title,
  body,
) => {
  const pushToken = await getUserPushToken(userId);

  const message = {
    to: pushToken,
    sound: "default",
    title: title,
    body: body,
    data: {
      notificationId: notificationId.toString(), // IMPORTANT: Include notification ID
      NotificationID: notificationId.toString(), // Backup field name
      type: "alert",
    },
  };

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
};
```

### AWS SNS Example

```javascript
const params = {
  Message: JSON.stringify({
    default: title,
    APNS: JSON.stringify({
      aps: {
        alert: {
          title: title,
          body: body,
        },
        sound: "default",
        badge: 1,
      },
      notificationId: notificationId.toString(), // Include in data
      NotificationID: notificationId.toString(),
    }),
    GCM: JSON.stringify({
      notification: {
        title: title,
        body: body,
      },
      data: {
        notificationId: notificationId.toString(), // Include in data
        NotificationID: notificationId.toString(),
      },
    }),
  }),
  MessageStructure: "json",
  TargetArn: endpointArn,
};

await sns.publish(params).promise();
```

## Current Status

✅ Notification tap handling - **FULLY IMPLEMENTED**
✅ Deep linking to notification details - **FULLY IMPLEMENTED**
✅ API integration (`/myalerts/{id}`) - **FULLY IMPLEMENTED**
✅ Mark as read functionality - **FULLY IMPLEMENTED**
✅ Works when app is closed - **FULLY IMPLEMENTED**
✅ Works when app is in background - **FULLY IMPLEMENTED**
✅ Works when app is in foreground - **FULLY IMPLEMENTED**

## Next Steps

1. **Backend Team**: Ensure all push notifications include `notificationId` in the `data` payload
2. **Testing**: Verify notification taps work in all app states (closed, background, foreground)
3. **Monitoring**: Add backend logging to track notification ID usage

---

**Last Updated**: January 29, 2026
**Feature Status**: ✅ Complete and Ready for Production
