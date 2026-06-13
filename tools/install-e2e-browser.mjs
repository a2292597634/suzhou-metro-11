import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  Browser,
  detectBrowserPlatform,
  install
} from '@puppeteer/browsers';
import { PUPPETEER_REVISIONS } from 'puppeteer-core/internal/revisions.js';

const cacheDir = process.env.PUPPETEER_CACHE_DIR
  || path.join(os.homedir(), '.cache', 'puppeteer');
const platform = detectBrowserPlatform();
const buildId = PUPPETEER_REVISIONS.chrome;

if (!platform) {
  throw new Error(`Unsupported browser platform: ${process.platform}/${process.arch}`);
}

const installedBrowser = await install({
  browser: Browser.CHROME,
  buildId,
  cacheDir,
  platform
});

if (!fs.existsSync(installedBrowser.executablePath)) {
  throw new Error(`Chrome executable missing: ${installedBrowser.executablePath}`);
}

console.log(`Chrome ready: ${installedBrowser.executablePath}`);
