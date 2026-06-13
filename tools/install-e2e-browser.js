const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  Browser,
  detectBrowserPlatform,
  install
} = require('@puppeteer/browsers');
const { PUPPETEER_REVISIONS } = require('puppeteer-core/internal/revisions.js');

async function installE2EBrowser() {
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
}

if (require.main === module) {
  installE2EBrowser().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { installE2EBrowser };
