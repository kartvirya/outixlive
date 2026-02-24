const { withGradleProperties } = require("@expo/config-plugins");

/**
 * Increases Gradle HTTP timeouts to reduce "Read timed out" errors when
 * downloading Maven dependencies (e.g. apollo-runtime-android from Maven Central).
 * Default is ~10s; we set 2 minutes for slow/unreliable networks.
 */
function withGradleNetworkTimeout(config) {
  return withGradleProperties(config, (config) => {
    const timeoutMs = "120000"; // 2 minutes
    // systemProp. prefix makes these JVM system properties for Gradle's HTTP client
    const props = [
      { type: "property", key: "systemProp.org.gradle.internal.http.connectionTimeout", value: timeoutMs },
      { type: "property", key: "systemProp.org.gradle.internal.http.socketTimeout", value: timeoutMs },
    ];
    // Avoid duplicates
    const existingKeys = new Set(config.modResults.map((p) => p.key));
    for (const p of props) {
      if (!existingKeys.has(p.key)) {
        config.modResults.push(p);
        existingKeys.add(p.key);
      }
    }
    return config;
  });
}

module.exports = withGradleNetworkTimeout;
