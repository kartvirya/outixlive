# 🧪 Testing Guide: Push Notification Deep Linking

## Quick Test (5 Minutes)

### Step 1: Open the Test Screen

1. Launch the OutixRacer app
2. Navigate to **UI Examples** screen (from menu or tabs)
3. Scroll down to find **"Notification Deep Link Test"** section

### Step 2: Configure Test Notification

1. Enter a valid **Notification ID** (must exist in your backend)
   - Example: `12345`
   - This ID will be sent to `/myalerts/12345`

2. (Optional) Customize the title and body text

### Step 3: Send Test Notification

1. Tap **"Send Test Notification"** button
2. You'll see a confirmation alert
3. Tap **OK** to dismiss the alert

### Step 4: Close the App

**IMPORTANT**: You must completely close the app to test the "app closed" scenario

- iOS: Swipe up to show app switcher, then swipe up on OutixRacer
- Android: Recent apps button, then swipe away OutixRacer

### Step 5: Tap the Notification

1. Wait for the notification to appear in your system tray
2. Tap on the notification
3. **App should open automatically**
4. **Notification details should appear in a bottom sheet**

### Step 6: Verify

✅ App opened when notification was tapped  
✅ Bottom sheet appeared with notification details  
✅ Notification was marked as read  
✅ No errors in console logs

---

## What to Expect

### Success Scenario

When everything works correctly:

1. **Notification appears** in system tray

   ```
   Title: Test Notification
   Body: Tap to open notification details
   ```

2. **Tap notification** → **App opens**

3. **Bottom sheet appears** showing:
   - Notification title
   - Notification message
   - Event details
   - Date/time
   - Alert info
   - Mark as read status

4. **Console logs show**:
   ```
   [NOTIFICATION] 🔍 Checking for last notification response...
   [NOTIFICATION] 📬 Found last notification response!
   [NOTIFICATION] ✅ Found notification ID: 12345
   [NOTIFICATION] 🔼 Attempting to open bottom sheet...
   [NOTIFICATION] ✅ Bottom sheet opened to index 2
   [NOTIFICATION-SHEET] 📥 Fetching details for: 12345
   [API] 🌐 Calling: /myalerts/12345
   [NOTIFICATION-SHEET] ✅ Details loaded successfully
   ```

### Error Scenarios

#### Error: "No notification ID found in data"

**Console Log**:

```
[NOTIFICATION] ⚠️ No notification ID found in data
```

**Cause**: Notification payload missing ID field  
**Fix**: Ensure your backend includes `notificationId` in the data payload

#### Error: "Failed to fetch alert details"

**Console Log**:

```
[API] ❌ Failed to fetch alert details: 404
```

**Cause**: Notification ID doesn't exist in database  
**Fix**: Use a valid notification ID that exists in your backend

#### Error: "Bottom sheet ref is null"

**Console Log**:

```
[NOTIFICATION] ❌ Bottom sheet ref is null!
```

**Cause**: Component mounting timing issue (rare)  
**Fix**: Already handled with 500ms delay - contact developer if persists

---

## Testing Different App States

### 1. App Completely Closed

**How**: Close app from app switcher  
**Expected**: Notification tap opens app + shows details  
**Status**: ✅ Implemented

### 2. App in Background

**How**: Home button / swipe home  
**Expected**: Notification tap brings app to foreground + shows details  
**Status**: ✅ Implemented

### 3. App in Foreground

**How**: Keep app open and visible  
**Expected**: Notification banner appears at top, tap to show details  
**Status**: ✅ Implemented

---

## Backend Checklist

Before testing with real push notifications, verify your backend:

- [ ] Push notification service includes `notificationId` in data payload
- [ ] Endpoint `/myalerts/{notificationId}` returns notification details
- [ ] Endpoint `/myalerts/read/{notificationId}` marks notification as read
- [ ] Notification IDs are strings or numbers (not objects)
- [ ] Response format matches expected structure (see docs)

---

## Example Backend Payload

### Correct Format ✅

```json
{
  "to": "ExponentPushToken[xxxxxx]",
  "sound": "default",
  "title": "New Event Update",
  "body": "Your event has a new update",
  "data": {
    "notificationId": "12345",
    "NotificationID": "12345"
  },
  "badge": 1
}
```

### Incorrect Format ❌

```json
{
  "to": "ExponentPushToken[xxxxxx]",
  "sound": "default",
  "title": "New Event Update",
  "body": "Your event has a new update",
  "data": {
    // ❌ Missing notificationId
  },
  "badge": 1
}
```

---

## Troubleshooting

### Issue: Notification doesn't appear

**Check**:

- Notification permissions granted
- Device push token registered
- Backend successfully sent the notification

### Issue: Notification appears but app doesn't open

**Check**:

- iOS: Ensure you're tapping the notification, not just viewing it
- Android: Ensure notification has tap action enabled

### Issue: App opens but no bottom sheet

**Check**:

- Console logs for errors
- Notification payload includes `notificationId`
- Backend endpoint `/myalerts/{id}` is working

### Issue: Bottom sheet shows error

**Check**:

- Notification ID exists in database
- Backend endpoints are accessible
- Device token and session cookie are valid

---

## Debug Commands

### Check Last Notification Response

```javascript
Notifications.getLastNotificationResponseAsync().then((response) =>
  console.log("Last notification:", response),
);
```

### Check Device Token

```javascript
Notifications.getDevicePushTokenAsync().then((token) =>
  console.log("Device token:", token.data),
);
```

### Check Notification Permissions

```javascript
Notifications.getPermissionsAsync().then((status) =>
  console.log("Permissions:", status),
);
```

---

## Need Help?

1. Check console logs (look for `[NOTIFICATION]` prefix)
2. Review documentation:
   - [NOTIFICATION-DEEP-LINK-SUMMARY.md](./NOTIFICATION-DEEP-LINK-SUMMARY.md)
   - [PUSH-NOTIFICATION-DEEP-LINKING.md](./PUSH-NOTIFICATION-DEEP-LINKING.md)
3. Verify backend payload includes `notificationId`
4. Test with the built-in test component first

---

**Happy Testing!** 🎉
