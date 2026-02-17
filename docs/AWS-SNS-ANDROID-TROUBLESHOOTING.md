# AWS SNS Android Push Notifications - Troubleshooting

## Why You're Not Receiving Notifications from AWS Console

When sending from AWS SNS console and not receiving on Android, check these in order:

---

## 1. **Android GCM Platform Application in SNS**

SNS needs a **separate platform application for Android** (GCM/FCM). The iOS APNS app won't work for FCM tokens.

**Check:**
- AWS Console → SNS → Mobile → Push notifications
- You need: `arn:aws:sns:eu-north-1:828043587172:app/**GCM**/OutixRacer-android` (or similar)
- NOT: `arn:aws:sns:...:app/**APNS**/...` (that's iOS only)

**Fix:** Create an Android platform application:
1. SNS → Push notifications → Create platform application
2. Platform: **Firebase Cloud Messaging (FCM)**
3. Upload your **FCM credentials** (Server key for legacy, or Service account JSON for FCM v1)

---

## 2. **FCM Credentials in SNS**

The GCM platform application must have valid FCM credentials.

**For FCM v1 (recommended):**
- Firebase Console → Project Settings → Service accounts → Generate new private key
- In SNS platform application: Upload the JSON or configure FCM v1

**For Legacy (Server key):**
- Firebase Console → Project Settings → Cloud Messaging → Server key
- Paste in SNS platform application credentials

---

## 3. **Backend Uses Correct Platform ARN**

Your app sends the token to `https://outix.co/apis/registertoken/{token}`. The backend must:

- Detect platform from the request (e.g. `platform: "android"` in body)
- Use the **GCM** platform application ARN when calling `CreatePlatformEndpoint`
- NOT use the APNS platform ARN for Android tokens

**Verify:** Check your backend `registertoken` endpoint - it should use different ARNs for iOS vs Android.

---

## 4. **Endpoint ARN vs Topic ARN**

When sending from AWS Console:

**Option A: Publish to Endpoint ARN directly**
- You need the exact endpoint ARN (e.g. `arn:aws:sns:eu-north-1:828043587172:endpoint/GCM/OutixRacer-android/xxx-xxx-xxx`)
- Get this from: SNS → Push notifications → Your GCM app → Endpoints
- Or from your backend after registration

**Option B: Publish to Topic**
- The endpoint must be **subscribed** to the topic
- SNS → Topics → Your topic → Create subscription
- Protocol: **Application** (for mobile push)
- Endpoint: paste the platform endpoint ARN

---

## 5. **Message Format for Android**

When publishing from SNS console, the message format matters for FCM. **Include `android_channel_id`** so the notification displays (Android 8+ requires channels).

**Custom payload (recommended):**
```json
{
  "GCM": "{\"notification\":{\"title\":\"Test\",\"body\":\"Hello from SNS\",\"android_channel_id\":\"default\"},\"data\":{}}"
}
```

**Note:** The app creates a `default` channel. Use `android_channel_id: "default"` to match.

**Simple text:** SNS wraps it automatically but may not set the channel – notifications might not appear.

---

## 6. **Token Registration Flow**

Your app registers via backend:
1. App gets FCM token from Firebase
2. App POSTs to `https://outix.co/apis/registertoken/{token}` with `platform: "android"`
3. Backend calls SNS `CreatePlatformEndpoint` with **GCM** platform ARN + token
4. Backend returns endpoint ARN (or stores it)

**Verify registration:** After opening the app, check SNS console → Your GCM app → Endpoints. Your device should appear.

---

## 7. **App in Foreground**

On Android, FCM does **not** auto-display when the app is in foreground. The app now includes a Firebase Messaging handler (`lib/firebaseMessagingHandler.ts`) that displays SNS/FCM notifications in foreground via expo-notifications. Rebuild the app after this fix.

---

## 8. **Quick Checklist**

- [ ] GCM (Android) platform application exists in SNS
- [ ] FCM credentials are configured in that platform app
- [ ] Backend uses GCM platform ARN for Android tokens (not APNS)
- [ ] Device token is registered (check SNS Endpoints list)
- [ ] When publishing: using correct Endpoint ARN or Topic (with endpoint subscribed)
- [ ] App has notification permissions
- [ ] Testing on physical device (not emulator)
- [ ] Token has colons (we fixed this - FCM tokens like `xxx:APA91b...` need the colon)

---

## Getting Your Endpoint ARN

After the app registers, the endpoint ARN is either:
1. Returned by your backend and stored
2. Visible in SNS Console → Push notifications → [Your GCM app] → Endpoints

Use that ARN when publishing from the console (Publish message → Topic or Endpoint).
