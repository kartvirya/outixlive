const { withAppBuildGradle } = require("@expo/config-plugins");
const generateCode = require("@expo/config-plugins/build/utils/generateCode");

/**
 * Adds release signing config to app/build.gradle.
 * Requires keystore.properties at project root with: storeFile, storePassword, keyAlias, keyPassword
 * Keystore file path in storeFile is relative to android/app/ (e.g. ../../keystore/outix-release.keystore)
 */
function withReleaseSigning(config) {
  return withAppBuildGradle(config, async (config) => {
    let contents = config.modResults.contents;

    if (contents.includes("keystorePropsFile")) {
      return config;
    }

    // 1. Add release to signingConfigs (after debug block)
    const releaseSigningConfig = `
        def keystorePropsFile = rootProject.file("../../keystore.properties")
        if (keystorePropsFile.exists()) {
            def keystoreProps = new Properties()
            keystoreProps.load(new FileInputStream(keystorePropsFile))
            release {
                storeFile file(keystoreProps["storeFile"] ?: "../../keystore/outix-release.keystore")
                storePassword keystoreProps["storePassword"]
                keyAlias keystoreProps["keyAlias"]
                keyPassword keystoreProps["keyPassword"]
            }
        }
`;

    const merged1 = generateCode.mergeContents({
      newSrc: releaseSigningConfig,
      tag: "releaseSigningConfig",
      src: contents,
      anchor: /keyPassword 'android'\s*\n\s*\}/,
      comment: "//",
    });
    contents = merged1.contents;

    // 2. Replace release buildType signingConfig
    contents = contents.replace(
      /signingConfig signingConfigs\.debug(\s*\n\s*def enableShrinkResources)/,
      'def _kp = rootProject.file("../../keystore.properties"); signingConfig _kp.exists() ? signingConfigs.release : signingConfigs.debug$1'
    );

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withReleaseSigning;
