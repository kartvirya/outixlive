const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * CocoaPods error fix:
 * FirebaseCoreInternal -> GoogleUtilities doesn't define modules when
 * building as static libraries. Enabling modular headers generates module
 * maps and unblocks pod integration.
 */
function withFirebaseModularHeaders(config) {
  return withDangerousMod(config, ["ios", async (config) => {
    const podfilePath = path.join(
      config.modRequest.platformProjectRoot,
      "Podfile"
    );

    if (!fs.existsSync(podfilePath)) return config;

    let contents = await fs.promises.readFile(podfilePath, "utf8");

    if (!contents.includes("use_modular_headers!")) {
      // Insert right after the iOS platform declaration.
      contents = contents.replace(
        /(platform\s*:ios\s*,[^\n]*\n)/,
        "$1\nuse_modular_headers!\n"
      );
    }

    await fs.promises.writeFile(podfilePath, contents);
    return config;
  }]);
}

module.exports = withFirebaseModularHeaders;

