#!/usr/bin/env node
/**
 * Usage:
 *   node scripts/build-apk.mjs jaki
 *   node scripts/build-apk.mjs arthur
 *
 * Builds a debug APK for the named app and copies it to the project root.
 * Each app gets a unique applicationId so both can be installed on the same device.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, '..');

const APP = process.argv[2];
if (APP !== 'jaki' && APP !== 'arthur') {
  console.error('Usage: node scripts/build-apk.mjs jaki|arthur');
  process.exit(1);
}

const config = {
  jaki: {
    appId: 'jaki.demo.com',
    appName: 'Jaki',
    html: 'jaki.html',
    strings: 'jaki',
  },
  arthur: {
    appId: 'arthur.demo.com',
    appName: 'Arthur',
    html: 'arthur.html',
    strings: 'arthur',
  },
}[APP];

const run = (cmd) => {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit' });
};

// ── 1. Web build ───────────────────────────────────────────────────────────
run('npm run build');

// ── 2. Swap index.html to point at the right app ────────────────────────────
console.log(`\n▶ Copying dist/${config.html} → dist/index.html`);
copyFileSync(resolve(root, 'dist', config.html), resolve(root, 'dist', 'index.html'));

// ── 3. Patch Android applicationId and app_name ─────────────────────────────
const gradlePath = resolve(root, 'android/app/build.gradle');
let gradle = readFileSync(gradlePath, 'utf8');
gradle = gradle
  .replace(/namespace\s*=\s*"[^"]*"/, `namespace = "${config.appId}"`)
  .replace(/applicationId\s+"[^"]*"/, `applicationId "${config.appId}"`);
writeFileSync(gradlePath, gradle);

const stringsPath = resolve(root, 'android/app/src/main/res/values/strings.xml');
let strings = readFileSync(stringsPath, 'utf8');
strings = strings
  .replace(/<string name="app_name">[^<]*<\/string>/, `<string name="app_name">${config.appName}</string>`)
  .replace(/<string name="title_activity_main">[^<]*<\/string>/, `<string name="title_activity_main">${config.appName}</string>`)
  .replace(/<string name="package_name">[^<]*<\/string>/, `<string name="package_name">${config.appId}</string>`)
  .replace(/<string name="custom_url_scheme">[^<]*<\/string>/, `<string name="custom_url_scheme">${config.appId}</string>`);
writeFileSync(stringsPath, strings);

// Also update capacitor.config.ts appId so cap sync is consistent
const capPath = resolve(root, 'capacitor.config.ts');
let cap = readFileSync(capPath, 'utf8');
cap = cap
  .replace(/appId:\s*'[^']*'/, `appId: '${config.appId}'`)
  .replace(/appName:\s*'[^']*'/, `appName: '${config.appName}'`);
writeFileSync(capPath, cap);

// ── 4. Patch AndroidManifest — add HOME category for Arthur so it can be set as launcher
const manifestPath = resolve(root, 'android/app/src/main/AndroidManifest.xml');
let manifest = readFileSync(manifestPath, 'utf8');
if (APP === 'arthur') {
  // Add HOME + DEFAULT so Arthur appears in "Choose home app" settings
  manifest = manifest.replace(
    '<category android:name="android.intent.category.LAUNCHER" />',
    '<category android:name="android.intent.category.LAUNCHER" />\n                <category android:name="android.intent.category.HOME" />\n                <category android:name="android.intent.category.DEFAULT" />',
  );
} else {
  // Strip HOME/DEFAULT from Jaki builds (in case a previous Arthur build left them)
  manifest = manifest
    .replace(/\n\s*<category android:name="android.intent.category.HOME" \/>/g, '')
    .replace(/\n\s*<category android:name="android.intent.category.DEFAULT" \/>/g, '');
}
writeFileSync(manifestPath, manifest);

// ── 5. Sync Capacitor ───────────────────────────────────────────────────────
run('npx cap sync android');

// ── 6. Build APK via Gradle ─────────────────────────────────────────────────
run('./android/gradlew assembleDebug -p android');

// ── 7. Copy APK to project root ─────────────────────────────────────────────
const apkSrc = resolve(root, 'android/app/build/outputs/apk/debug/app-debug.apk');
const apkDest = resolve(root, `${APP}-debug.apk`);
copyFileSync(apkSrc, apkDest);
console.log(`\n✅ APK ready: ${APP}-debug.apk`);
