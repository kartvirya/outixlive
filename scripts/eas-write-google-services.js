#!/usr/bin/env node
/**
 * EAS Build hook: ensure google-services.json exists for Android builds.
 * 1. If GOOGLE_SERVICES_JSON env is set (cloud/EAS secret) -> write it to file
 * 2. If file already exists (e.g. from .easignore for local builds) -> no-op
 * 3. Otherwise -> error (missing for Android)
 *
 * For cloud: eas env:create production --name GOOGLE_SERVICES_JSON --value "$(cat google-services.json)" --type string --visibility secret
 * For local: .easignore includes !google-services.json so the file is in the build archive
 */

const fs = require('fs');
const path = require('path');

const content = process.env.GOOGLE_SERVICES_JSON;
const outPath = path.join(__dirname, '..', 'google-services.json');

if (content) {
  fs.writeFileSync(outPath, content, 'utf8');
  console.log('Wrote google-services.json from EAS env');
  process.exit(0);
}

// No env var - check if file already exists (e.g. local build with .easignore)
if (fs.existsSync(outPath)) {
  console.log('google-services.json already present (from archive)');
  process.exit(0);
}

if (process.env.EAS_BUILD_PLATFORM === 'android') {
  console.error('google-services.json is missing. Either:');
  console.error('  1. Add .easignore with !google-services.json so the file is included (local builds)');
  console.error('  2. Set EAS env: eas env:create production --name GOOGLE_SERVICES_JSON --value "$(cat google-services.json)" --type string --visibility secret');
  process.exit(1);
}

process.exit(0);
