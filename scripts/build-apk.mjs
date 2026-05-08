#!/usr/bin/env node
/**
 * Build the unified Jaki APK (one app, both Arthur and Jaki modes).
 *
 * Usage:
 *   node scripts/build-apk.mjs
 *   npm run apk
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = resolve(__dir, '..');

const APP_ID   = 'arthur.demo.com';
const APP_NAME = 'Jaki';

const run = (cmd) => {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit' });
};

// ── 1. Web build ──────────────────────────────────────────────────────────────
run('npm run build');

// ── 2. Patch Android applicationId and app_name ──────────────────────────────
const gradlePath = resolve(root, 'android/app/build.gradle');
let gradle = readFileSync(gradlePath, 'utf8');
gradle = gradle
  .replace(/namespace\s*=\s*"[^"]*"/, `namespace = "${APP_ID}"`)
  .replace(/applicationId\s+"[^"]*"/, `applicationId "${APP_ID}"`);
writeFileSync(gradlePath, gradle);

const stringsPath = resolve(root, 'android/app/src/main/res/values/strings.xml');
let strings = readFileSync(stringsPath, 'utf8');
strings = strings
  .replace(/<string name="app_name">[^<]*<\/string>/, `<string name="app_name">${APP_NAME}</string>`)
  .replace(/<string name="title_activity_main">[^<]*<\/string>/, `<string name="title_activity_main">${APP_NAME}</string>`)
  .replace(/<string name="package_name">[^<]*<\/string>/, `<string name="package_name">${APP_ID}</string>`)
  .replace(/<string name="custom_url_scheme">[^<]*<\/string>/, `<string name="custom_url_scheme">${APP_ID}</string>`);
writeFileSync(stringsPath, strings);

const capPath = resolve(root, 'capacitor.config.ts');
let cap = readFileSync(capPath, 'utf8');
cap = cap
  .replace(/appId:\s*'[^']*'/, `appId: '${APP_ID}'`)
  .replace(/appName:\s*'[^']*'/, `appName: '${APP_NAME}'`);
writeFileSync(capPath, cap);

// ── 3. Sync Capacitor ─────────────────────────────────────────────────────────
run('npx cap sync android');

// ── 4. Build APK via Gradle ───────────────────────────────────────────────────
run('./android/gradlew assembleDebug -p android');

// ── 5. Copy APK to project root ───────────────────────────────────────────────
const apkSrc  = resolve(root, 'android/app/build/outputs/apk/debug/app-debug.apk');
const apkDest = resolve(root, 'jaki-debug.apk');
copyFileSync(apkSrc, apkDest);
console.log('\n✅ APK ready: jaki-debug.apk');
