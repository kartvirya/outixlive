# Firebase Setup for Android Push Notifications

The app uses Firebase Cloud Messaging (FCM) for Android push notifications. You must configure Firebase before the device token can be generated.

## Steps

### 1. Create a Firebase project (if you don't have one)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one

### 2. Add an Android app to your Firebase project

1. In Firebase Console → Project Settings → Your apps
2. Click "Add app" → Android
3. **Package name**: `com.live.outix` (must match `app.config.js`)
4. Download `google-services.json`

### 3. Add the config file to the project

```bash
# Copy the downloaded file to the project root
cp ~/Downloads/google-services.json ./google-services.json
```

Or copy the contents of your downloaded file into `google-services.json` in the project root.

### 4. Rebuild the Android app

```bash
npx expo prebuild --clean
npx expo run:android
```

Or use your run script:

```bash
./run-android.sh
```

## Troubleshooting

**"Default FirebaseApp is not initialized"**
- Ensure `google-services.json` exists in the project root
- Ensure the package name in Firebase matches `com.live.outix`
- Run `npx expo prebuild --clean` and rebuild

**File not found during prebuild**
- The path in `app.config.js` is `./google-services.json` (project root)
- Verify the file exists: `ls -la google-services.json`

---

## Expo Push Notifications (ExponentPushToken)

If you're using **Expo Push** (`ExponentPushToken[...]`) and get:

> "Unable to retrieve the FCM server key for the recipient's app"

Expo needs your FCM credentials to forward push notifications to Android. Upload them to EAS:

### 1. Create a Firebase Service Account Key

1. Firebase Console → Project Settings → [Service accounts](https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk)
2. Click **Generate New Private Key** → Generate Key
3. Save the JSON file (add to `.gitignore` – it contains secrets)

### 2. Upload to EAS

```bash
eas credentials
```

Then:

1. Select **Android** → **production** (or your build profile)
2. Select **Set up a Google Service Account Key for Push Notifications (FCM V1)**
3. Choose **Upload a new service account key**
4. Select the JSON file you downloaded

Or use the [EAS Dashboard](https://expo.dev) → Your project → Credentials → Android → FCM.

### 3. Verify

After uploading, retry sending via Expo Push:

```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[YOUR_TOKEN]",
    "title": "Test",
    "body": "Hello from Expo Push"
  }'
```

See [Expo FCM credentials docs](https://docs.expo.dev/push-notifications/fcm-credentials/) for details.
