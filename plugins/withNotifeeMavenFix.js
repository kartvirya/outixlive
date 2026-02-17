const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Fix Notifee Maven repo path in build.gradle.
 * expo-build-properties uses $rootDir which resolves to android/app in app module context.
 * We replace it with rootProject.projectDir for correct resolution.
 */
function withNotifeeMavenFix(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const buildGradlePath = path.join(
        config.modRequest.platformProjectRoot,
        "build.gradle"
      );
      let contents = await fs.promises.readFile(buildGradlePath, "utf8");

      // Fix Notifee path: $rootDir resolves wrong in app context
      contents = contents.replace(
        /\$rootDir\/\.\.\/node_modules\/@notifee\/react-native\/android\/libs/g,
        '${rootProject.projectDir}/../node_modules/@notifee/react-native/android/libs'
      );

      await fs.promises.writeFile(buildGradlePath, contents);
      return config;
    },
  ]);
}

module.exports = withNotifeeMavenFix;
