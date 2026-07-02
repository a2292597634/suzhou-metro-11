import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer';

const EDGE_CANDIDATES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
];

function findLocalBrowser() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  return EDGE_CANDIDATES.find(candidate => existsSync(candidate));
}

export function launchBrowser(options = {}) {
  const executablePath = findLocalBrowser();
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
    ...(executablePath ? { executablePath } : {}),
    ...options
  });
}