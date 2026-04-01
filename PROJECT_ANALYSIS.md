# OutixLive / OutixRacer App (Project Analysis)

## What this project is
This repo contains a React Native (Expo) mobile app (package name `outixracer`) built with **Expo Router**. The app lets users browse **venues/promoters** and **events**, subscribe to them, and receive **alerts/notifications**. It also includes a **buyback** workflow (buying back after elimination) with locally-simulated payment methods.

The backend it integrates with uses the `outix.co` API base (`BASE_URL`) and the app also includes infrastructure to support **push notifications** through AWS SNS + a backend “token registration” flow.

## What’s implemented (high-level)

### App navigation & core screens
- Tab-based navigation with Expo Router.
- `Venues` (home list of promoters/venues)
- `Events` (list of events, optionally tied to a promoter)
- `Alerts` (user notifications + buyback offers)
- `Profile` (login/logout + user details)
- Deep-link detail screen: `event/[id]` (event details + admin controls)
- Deep-link detail screen: `promoter/[id]` (promoter details + admin controls)

### Authentication
- `useAuth` stores user data in `AsyncStorage`.
- Login + logout
- Persisting an auth token and session cookie
- A hardcoded test user path (`test@outix.co` / `Password$1234`)

### Admin gating / permissions (client-side)
- `AdminContext` tracks whether the user is “admin” via `AsyncStorage`.
- Access checks: `canAccessPromoter(promoterId)` and `canAccessEvent(eventPromoterId)`

### Venue / Event browsing
- Home (`app/(tabs)/index.tsx`) and Events (`app/(tabs)/events.tsx`) fetch lists from the API (`getPromoters`, `getEvents`).
- Supports search filtering
- Supports optional sorting by distance (browser/location utility)
- Supports subscription-based filtering (UI has an “all vs subscribed” mode)

### Subscriptions & alerts data model
- API layer (`lib/api.ts`) contains functions for subscribing/unsubscribing to promoters and events, fetching alerts (`getMyAlerts`), fetching alert details (`getAlertDetails`), and marking alerts as read (`markAlertAsRead`).

### Notifications UX
- `NotificationContext` fetches alerts on app start (via `refreshNotifications`), maps API payloads into `Notification`, computes `unreadCount`, and supports read/unread updates with optimistic UI + deduped concurrent requests.
- `Alerts` tab (`app/(tabs)/alerts.tsx`) renders buyback-related items and expandable notifications, including a long-press path to open the details modal.
- `NotificationDetailModal` (`components/notification-detail-modal.tsx`) loads notification details via direct API (`getAlertDetails(notificationId)`) with fallback to filtering context alerts, and automatically marks the notification as read when unopened (`opened === "0"`).
- `NotificationDropdown` (`components/notification-dropdown.tsx`) provides a “recent notifications” modal-like UI that marks alerts read when tapped and navigates to the Alerts screen.

### Push notifications (FCM/APNs + Expo handler + AWS SNS integration)
- `app/_layout.tsx` initializes notification handling at the root level.
- Uses `expo-notifications` (dynamically imported for Expo Go compatibility).
- Registers listeners for notification received, notification tapped, and the “app killed -> notification tap” case (via `getLastNotificationResponseAsync`).
- Extracts a `NotificationID` from multiple possible payload keys, deduplicates by `NotificationID`, and uses a fallback matching strategy against `NotificationContext` alerts using `notification_type` + `notification_message`.

### Token registration (avoid duplicate backend calls)
- `usePushNotifications` (`hooks/usePushNotifications.ts`) handles permissions, token retrieval (Expo + native), and central device token registration via `ensureDeviceTokenRegistered`.
- `lib/tokenRegistration.ts` prevents duplicate registration using an `AsyncStorage` key and prevents concurrent in-flight registration via a module-level promise.

### AWS SNS token formatting & endpoint/service helpers
- `lib/snsTopics.ts` stores SNS topic ARNs and includes helper functions for managing subscriptions.
- `lib/awsSnsServiceSimple.ts` provides simplified backend registration + “send push” functions that rely on backend endpoints.
- `lib/awsSnsTokenUtils.ts` validates/normalizes device tokens for AWS SNS constraints.

### iOS native token bridge (device token integration)
- `lib/iosDeviceTokenManager.ts` listens for iOS native events via a `DeviceTokenBridge` (including `DeviceTokenReceived` and `NotificationTapped`) and includes fallback polling from `AsyncStorage` if the bridge isn’t available.

### Buyback flow (locally simulated payment + stored cards)
- `BuybackContext` manages buyback offers (pending/accepted/declined/expired), saved cards in `AsyncStorage`, and “payment prompt” / “success modal” UI state.
- `BuybackNotification` shows the active pending offer, including a countdown, accept/decline actions, redirect-to-profile when unauthenticated, and opening `AddPaymentPrompt` when no saved card exists.
- `AddPaymentPrompt` (`components/add-payment-prompt.tsx`) adds a mock card (simulated).
- `BuybackSuccessModal` shows a confirmation modal after accept (simulated).

## Notable “current behavior” details in code
The root push notification handler contains comments where “modal opening” is intentionally disabled and replaced by debug-oriented handling (console logs / alerts). This suggests the production UX path for opening `NotificationDetailModal` directly from notification tap is still being tuned.
The buyback payment method is simulated: accepting an offer updates UI state but does not integrate with a real payment processor in this repo.

## How to build/run
- Standard Expo workflow: `npm install` and `npx expo start`
- Android AAB helper script: `build-android-aab.sh` uses `expo prebuild` (if needed) and then runs `gradlew bundleRelease`.

## Key files (map from features to code)
- Navigation/layout: `app/_layout.tsx`, `app/(tabs)/_layout.tsx`
- Notifications: `contexts/NotificationContext.tsx`, `hooks/usePushNotifications.ts`, `components/notification-detail-modal.tsx`, `components/notification-dropdown.tsx`
- Push/token: `lib/pushNotifications.ts`, `lib/tokenRegistration.ts`, `lib/iosDeviceTokenManager.ts`, `lib/awsSnsServiceSimple.ts`, `lib/awsSnsTokenUtils.ts`, `lib/snsTopics.ts`
- Data/API: `lib/api.ts`
- Buyback: `contexts/BuybackContext.tsx`, `components/buyback-notification.tsx`, `components/buyback-success-modal.tsx`, `components/add-payment-prompt.tsx`

