# Notification Test Simulator - How to Use

## Quick Start

1. **Open the app**
2. **Navigate to UI Examples screen** (from menu/tabs)
3. **Scroll to "🔬 Notification Test Simulator" section**
4. **Run tests** to simulate notification taps

## Available Tests

### Test 1: With NotificationID

- Fetches real alerts from API
- Uses first alert's NotificationID
- Simulates notification tap with NotificationID in payload
- **Expected**: Popup should appear immediately

### Test 2: Fallback Matching

- Uses notification_type + notification_message
- NO NotificationID in payload
- Tests fallback matching logic
- **Expected**: Popup should appear after matching alert

### Test 3: Real Local Notification

- Sends actual local notification to device
- You can tap it from notification tray
- Tests real notification tap flow
- **Expected**: App should handle tap and show popup

### Test 4: App-Closed Scenario

- Simulates `getLastNotificationResponseAsync()`
- Tests app-closed scenario
- **Expected**: Should detect last notification response

## How It Works

The test simulator:

1. Gets real notification IDs from your API
2. Simulates the exact data structure your backend sends
3. Calls `handleNotificationData()` directly
4. Shows test results in real-time

## Debugging

Check console logs for:

- `[TEST] 🧪 Test notification tap received`
- `[NOTIFICATION] 🔍 Processing notification data`
- `[NOTIFICATION] ✅ Using NotificationID directly`
- `[NOTIFICATION] ✅ Bottom sheet opened successfully!`

## Troubleshooting

### Popup doesn't appear?

1. Check console for errors
2. Verify NotificationID exists in API
3. Check if navigation is ready (segments length > 0)
4. Verify bottom sheet ref is available

### Test fails?

1. Make sure you're in DEV mode
2. Check API connection
3. Verify alerts exist in backend
4. Check console for detailed error messages

## Manual Testing

You can also test manually in console:

```javascript
// In React Native Debugger or console
global.handleNotificationData({
  NotificationID: "12345",
  notificationId: "12345",
});
```

This will trigger the notification handler directly.
