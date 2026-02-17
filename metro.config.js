const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Fix: tslib __spreadArray/__extends issues with moti in Expo Go
// Resolve tslib to the ES6 build which exports correctly.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "tslib") {
    return {
      type: "sourceFile",
      filePath: require.resolve("tslib/tslib.es6.js"),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
