#!/usr/bin/env node
/**
 * EAS Build post-install hook: write android/local.properties with sdk.dir for local builds.
 * Required for `eas build --local` - Gradle needs to know where the Android SDK is.
 *
 * Run with ANDROID_HOME set, e.g.:
 *   ANDROID_HOME=/home/bikash/Android eas build --platform android --local
 */

const fs = require('fs');
const path = require('path');

if (process.env.EAS_BUILD_PLATFORM !== 'android') {
  process.exit(0);
}

const sdkPath =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  (process.env.HOME && path.join(process.env.HOME, 'Android', 'Sdk')) ||
  (process.env.HOME && path.join(process.env.HOME, 'Android'));

if (!sdkPath || !fs.existsSync(sdkPath)) {
  console.error('Android SDK not found. Set ANDROID_HOME before running eas build --local, e.g.:');
  console.error('  ANDROID_HOME=/home/bikash/Android eas build --platform android --local');
  process.exit(1);
}

const androidDir = path.join(__dirname, '..', 'android');
const localPropsPath = path.join(androidDir, 'local.properties');

if (!fs.existsSync(androidDir)) {
  console.error('android/ directory not found - post-install may be running too early');
  process.exit(1);
}

const content = `sdk.dir=${sdkPath.replace(/\\/g, '/')}
`;
fs.writeFileSync(localPropsPath, content, 'utf8');
console.log('Wrote android/local.properties with sdk.dir=' + sdkPath);
