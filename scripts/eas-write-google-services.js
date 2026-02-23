#!/usr/bin/env node
/**
 * EAS Build hook: write google-services.json from EAS secret GOOGLE_SERVICES_JSON.
 * Run before npm install so the file exists when expo prebuild runs.
 *
 * One-time setup: eas secret:create --name GOOGLE_SERVICES_JSON --value "$(cat google-services.json)"
 */

const fs = require('fs');
const path = require('path');

const content = process.env.GOOGLE_SERVICES_JSON;
const outPath = path.join(__dirname, '..', 'google-services.json');

if (!content) {
  if (process.env.EAS_BUILD_PLATFORM === 'android') {
    console.error('GOOGLE_SERVICES_JSON secret is not set. Create it with:');
    console.error('  eas secret:create --name GOOGLE_SERVICES_JSON --value "$(cat google-services.json)"');
    process.exit(1);
  }
  process.exit(0);
}

fs.writeFileSync(outPath, content, 'utf8');
console.log('Wrote google-services.json from EAS secret');
