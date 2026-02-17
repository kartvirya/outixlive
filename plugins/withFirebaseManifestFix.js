const { withAndroidManifest } = require("@expo/config-plugins");
const { ensureToolsAvailable } = require("@expo/config-plugins/build/android/Manifest");

/**
 * Fix manifest merger conflict between expo-notifications and react-native-firebase.
 * Both set com.google.firebase.messaging.default_notification_color - we use tools:replace to resolve.
 */
function withFirebaseManifestFix(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults = ensureToolsAvailable(config.modResults);

    const applications = config.modResults.manifest?.application;
    if (!Array.isArray(applications)) return config;

    for (const application of applications) {
      const metaData = application["meta-data"];
      if (!metaData) continue;

      const metaDataArray = Array.isArray(metaData) ? metaData : [metaData];
      for (const item of metaDataArray) {
        if (
          item.$?.["android:name"] ===
          "com.google.firebase.messaging.default_notification_color"
        ) {
          item.$["tools:replace"] = "android:resource";
          break;
        }
      }
    }

    return config;
  });
}

module.exports = withFirebaseManifestFix;
