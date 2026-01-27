export default {
  expo: {
    name: "Outix Live",
    slug: "OutixRacer",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "outixracer",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.live.outix",
      config: {
        usesNonExemptEncryption: false,
      },
      infoPlist: {
        UIBackgroundModes: ["remote-notification"],
      },
    },

    android: {
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

    // Environment variables - accessible via Constants.expoConfig.extra
    extra: {
      // EAS Project Configuration
      eas: {
        projectId: "266177d4-b4cf-4862-a6da-6a92a3f92244",
      },
      baseUrl:
        process.env.EXPO_PUBLIC_BASE_URL ||
        process.env.BASE_URL ||
        "https://outix.co/apis",
      // AWS SNS Configuration
      aws: {
        region: "eu-north-1",
        snsTopicArn:
          "arn:aws:sns:eu-north-1:828043587172:outixracer-notifications",
      },
      // Apple Developer Configuration (for APNs)
      apple: {
        teamId: "3LJ9R88GGY",
        keyId: "7A2V4W92WK",
      },
    },
  },
};
