# Push Notification Tap Handling

## Overview

When a user receives a push notification and taps on it, the app will now automatically fetch the notification details from the API and display them in a beautiful bottom sheet.

## How It Works

### 1. **Notification Data Structure**

When sending push notifications, include the NotificationID in the data payload:

```json
{
  "title": "Pro and sportsman should be heading to the lanes.",
  "body": "Class Call notification",
  "data": {
    "NotificationID": "MTc4OTEwNDkzNDQ=",
    "notification_type": "Class Call"
  }
}
```

### 2. **API Endpoints Used**

**Get All Alerts:**

```bash
POST https://outix.co/apis/myalerts
Headers:
  - devicetoken: <device_token>
  - Cookie: PHPSESSID=<session_id>
```

**Get Specific Alert Details:**

```bash
POST https://outix.co/apis/myalerts/<NotificationID>
Headers:
  - devicetoken: <device_token>
  - Cookie: PHPSESSID=<session_id>
```

### 3. **Flow**

1. **User receives push notification** (via AWS SNS)
2. **User taps notification** (app opens or comes to foreground)
3. **App extracts NotificationID** from notification data
4. **App calls API** `getAlertDetails(notificationId)`
5. **Bottom sheet opens** with full notification details
6. **Notification marked as read** automatically via `markAlertAsRead(notificationId)`

### 4. **Components Involved**

#### **NotificationDetailBottomSheet** (`components/notification-detail-bottom-sheet.tsx`)

- Modern bottom sheet UI with animations
- Fetches notification details by ID
- Displays full notification with type, title, message, date, status
- Automatically marks notification as read
- Uses glassmorphism and smooth animations

#### **RootLayout** (`app/_layout.tsx`)

- Listens for notification taps via `usePushNotifications` hook
- Extracts NotificationID from notification data
- Opens bottom sheet with notification details

#### **usePushNotifications** (`hooks/usePushNotifications.ts`)

- Sets up notification listeners
- Handles both received and tapped notifications
- Returns notification object to be processed

### 5. **API Functions**

#### **getAlertDetails** (`lib/api.ts`)

```typescript
export const getAlertDetails = async (notificationId: string)
```

Fetches full details for a specific notification.

#### **markAlertAsRead** (`lib/api.ts`)

```typescript
export const markAlertAsRead = async (notificationId: string)
```

Marks a notification as opened/read.

## Testing

### Test with Local Notification

You can test this by sending a local notification:

```typescript
import * as Notifications from "expo-notifications";

await Notifications.scheduleNotificationAsync({
  content: {
    title: "Test Notification",
    body: "Tap to see details",
    data: {
      NotificationID: "MTc4OTEwNDkzNDQ=", // Use a real ID from your API
    },
  },
  trigger: null, // Show immediately
});
```

### Expected Behavior

1. Notification appears in notification center
2. User taps notification
3. App opens (or comes to foreground)
4. Bottom sheet slides up with notification details
5. Full message, type, date, and status displayed
6. Notification marked as read in backend

## UI Features

### Bottom Sheet

- **Swipe to dismiss** - Drag down to close
- **Multiple snap points** - 50%, 75%, 90% of screen
- **Smooth animations** - Fade in, slide in effects
- **Glassmorphism cards** - Modern blur effects
- **Auto-fetch details** - Loads from API automatically

### Notification Display

- **Type badge** - Shows notification type (e.g., "Class Call")
- **Title** - Main notification text
- **Message** - Full notification message
- **Additional info** - Any extra alertinfo
- **Date/time** - When notification was sent
- **Status indicator** - New (green) or Read (gray)

## Error Handling

### No Notification ID

If NotificationID is missing from the notification data, a warning is logged:

```
⚠️ No notification ID found in notification data
```

### API Errors

If fetching fails, an error screen is shown with:

- Error icon
- Error message
- "Try Again" button to retry

### Network Issues

Network errors are caught and displayed to the user with helpful messages.

## Configuration

### Required Headers

The API calls automatically include:

- `devicetoken` - The user's device token from AsyncStorage
- `Cookie` - The PHP session cookie

These are retrieved from:

```typescript
const deviceToken = await getDeviceToken();
const sessionCookie = await getSessionCookie();
```

## Future Enhancements

- [ ] Navigate to event page if notification is event-related
- [ ] Show notification preview before opening full details
- [ ] Add notification actions (e.g., "View Event", "Dismiss")
- [ ] Cache notification details for offline viewing
- [ ] Add notification categories for better organization
