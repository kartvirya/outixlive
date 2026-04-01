export default {
  expo: {
    name: "Outix Live",
    slug: "OutixRacer",
    version: "1.0.7",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "outixracer",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.live.outix",
      buildNumber: "9",
      config: {
        usesNonExemptEncryption: false,
      },
      infoPlist: {
        // Apple validates UIBackgroundModes values; `processing` is the correct value
        // for background processing activities (not `background-processing`).
        // For APNs, `remote-notification` is sufficient. Keeping `processing`
        // requires `BGTaskSchedulerPermittedIdentifiers` (which we don't use).
        UIBackgroundModes: ["remote-notification"],
      },
    },

    android: {
      package: "com.live.outix",
      useNextNotificationsApi: true,
      googleServicesFile: "./google-services.json",
      adaptiveIcon: {
        backgroundColor: "#000000",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },

    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
      bundler: "metro",
    },

    plugins: [
      "expo-router",
      "./plugins/withNotifeeAndroidFix",
      "./plugins/withGradleNetworkTimeout",
      "./plugins/withReleaseSigning",
      "./plugins/withFirebaseModularHeaders",
      [
        "expo-build-properties",
        {
          android: {
            extraMavenRepos: [
              "$rootDir/../node_modules/@notifee/react-native/android/libs",
            ],
          },
        },
      ],
      "./plugins/withFirebaseManifestFix",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#000000",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/notification-icon.png",
          color: "#ffffff",
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    extra: {
      eas: {
        projectId: "266177d4-b4cf-4862-a6da-6a92a3f92244",
      },
      baseUrl: "https://outix.co/apis",
      aws: {
        region: "eu-north-1",
        snsTopicArn:
          "arn:aws:sns:eu-north-1:828043587172:outixracer-notifications",
      },
      apple: {
        teamId: "3LJ9R88GGY",
        keyId: "7A2V4W92WK",
      },
    },
  },
};