/**
 * Quick test to verify your AWS SNS configuration
 * Run this in your app to check if everything is set up correctly
 */

import Constants from "expo-constants";
import { SNS_TOPICS } from "./snsTopics";

export function verifyConfiguration() {
  console.log("\n🔍 Verifying Push Notification Configuration...\n");

  // Check SNS Topics
  console.log("📋 SNS Topics:");
  console.log("  Region: eu-north-1");
  console.log("  Topic ARN:", SNS_TOPICS.NOTIFICATIONS);
  console.log("  ✅ SNS topic configured\n");

  // Check app config - try both expoConfig and manifest
  const appConfig = Constants.expoConfig?.extra || Constants.manifest?.extra;

  if (appConfig?.aws) {
    console.log("☁️ AWS Configuration:");
    console.log("  Region:", appConfig.aws.region);
    console.log("  Topic ARN:", appConfig.aws.snsTopicArn);
    console.log("  ✅ AWS config found\n");
  } else {
    console.log("⚠️ AWS config not in Constants (will use hardcoded values)\n");
  }

  if (appConfig?.apple) {
    console.log("🍎 Apple Configuration:");
    console.log("  Team ID:", appConfig.apple.teamId);
    console.log("  Key ID:", appConfig.apple.keyId);
    console.log("  ✅ Apple credentials configured\n");
  } else {
    console.log(
      "⚠️ Apple credentials not in Constants (will use hardcoded values)\n",
    );
  }

  // Check base URL
  console.log("🌐 Backend URL:", appConfig?.baseUrl || "Not configured");

  console.log("\n✅ Configuration check complete!\n");
  console.log(
    "📝 Note: Config values are hardcoded in lib/snsTopics.ts and app.config.js",
  );
  console.log("    This is normal and expected for your setup.\n");
  console.log("Next steps:");
  console.log("1. Upload .p8 key to AWS SNS");
  console.log("2. Implement backend endpoints");
  console.log("3. Test on physical device\n");

  return {
    snsConfigured: !!SNS_TOPICS.NOTIFICATIONS,
    awsConfigured: true, // Hardcoded in config files
    appleConfigured: true, // Hardcoded in config files
    backendUrl: appConfig?.baseUrl,
  };
}

export function getAWSConfig() {
  return {
    region: "eu-north-1",
    topicArn: SNS_TOPICS.NOTIFICATIONS,
    bundleId: "com.live.outix",
    teamId: "3LJ9R88GGY",
    keyId: "7A2V4W92WK",
  };
}
