const { withProjectBuildGradle } = require("@expo/config-plugins");
const generateCode = require("@expo/config-plugins/build/utils/generateCode");

const notifeeMavenRepo = `
    maven {
      url "$rootDir/../node_modules/@notifee/react-native/android/libs"
    }
`;

/**
 * Adds Notifee Maven repo to root build.gradle so app.notifee:core can be resolved.
 * Required for Expo SDK 53+ / React Native 0.73+ due to extraMavenRepos propagation issues.
 * @see https://github.com/invertase/notifee/issues/1226
 */
function withNotifeeAndroidFix(config) {
  return withProjectBuildGradle(config, async (config) => {
    const { contents } = generateCode.mergeContents({
      newSrc: notifeeMavenRepo,
      tag: "notifeeAndroidWorkaround",
      src: config.modResults.contents,
      anchor: /maven\s*\{\s*url\s*['"]https:\/\/www\.jitpack\.io['"]\s*\}/,
      comment: "//",
      offset: 1,
    });

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withNotifeeAndroidFix;
