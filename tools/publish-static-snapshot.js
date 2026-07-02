/**
 * 静态快照发布脚本
 * 默认要求显式发布配置；--dry-run 只导出和验证，不 commit、不 push。
 */
require('dotenv').config();

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { exportStaticSnapshot } = require('./export-static-snapshot');

const REQUIRED_ENV = [
  'STATIC_PUBLISH_BRANCH',
  'STATIC_PUBLISH_REMOTE',
  'STATIC_PUBLISH_AUTHOR_NAME',
  'STATIC_PUBLISH_AUTHOR_EMAIL'
];

function getPublishConfig(env = process.env) {
  const missing = REQUIRED_ENV.filter(key => !env[key] || !env[key].trim());
  if (missing.length > 0) {
    throw new Error(`缺少静态发布配置: ${missing.join(', ')}`);
  }

  const branch = env.STATIC_PUBLISH_BRANCH.trim();
  if (branch === 'main' || branch.startsWith('codex/')) {
    throw new Error(`禁止发布到 ${branch} 分支，请显式指定静态发布分支`);
  }

  return {
    branch,
    remote: env.STATIC_PUBLISH_REMOTE.trim(),
    authorName: env.STATIC_PUBLISH_AUTHOR_NAME.trim(),
    authorEmail: env.STATIC_PUBLISH_AUTHOR_EMAIL.trim(),
    exportRoot: env.STATIC_EXPORT_ROOT ? path.resolve(env.STATIC_EXPORT_ROOT) : path.resolve(__dirname, '..')
  };
}

function assertExportedFiles(exportRoot) {
  const requiredFiles = [
    path.join(exportRoot, 'data', 'default-data.json'),
    path.join(exportRoot, 'data', 'static-manifest.json')
  ];
  for (const filePath of requiredFiles) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`静态发布文件不存在: ${filePath}`);
    }
  }
}

function runGit(args, options = {}) {
  return execFileSync('git', args, { stdio: 'pipe', encoding: 'utf8', ...options });
}

async function publishStaticSnapshot(options = {}) {
  const env = options.env || process.env;
  const dryRun = options.dryRun ?? process.argv.includes('--dry-run');
  const config = getPublishConfig(env);
  const manifest = await exportStaticSnapshot({ outputRoot: config.exportRoot });
  assertExportedFiles(config.exportRoot);

  if (dryRun) {
    const message = [
      `dry-run：静态快照已导出 ${manifest.snapshotId}`,
      `目标远端: ${config.remote}`,
      `目标分支: ${config.branch}`,
      'dry-run：不会 commit 或 push'
    ].join('\n');
    return { dryRun: true, manifest, message };
  }

  runGit(['add', 'data/default-data.json', 'data/static-manifest.json', 'assets/shop-photos'], { cwd: config.exportRoot });
  runGit([
    '-c', `user.name=${config.authorName}`,
    '-c', `user.email=${config.authorEmail}`,
    'commit', '-m', `chore: 发布静态快照 ${manifest.snapshotId}`
  ], { cwd: config.exportRoot });
  runGit(['push', config.remote, `HEAD:${config.branch}`], { cwd: config.exportRoot });

  return { dryRun: false, manifest, message: `静态快照已发布到 ${config.remote}/${config.branch}` };
}

async function main() {
  const result = await publishStaticSnapshot();
  console.log(result.message);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = {
  publishStaticSnapshot,
  getPublishConfig
};