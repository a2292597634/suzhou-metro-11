import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const packageJsonPath = path.join(projectRoot, 'package.json');
const npmCliPath = process.env.npm_execpath;
const prismaCliPath = path.join(
  projectRoot,
  'node_modules',
  'prisma',
  'build',
  'index.js',
);
const localOpenSpecCliPath = path.join(
  projectRoot,
  'node_modules',
  '@fission-ai',
  'openspec',
  'bin',
  'openspec.js',
);

function fail(message) {
  console.error(`\n❌ ${message}`);
  process.exit(1);
}

function run(label, command, args, options = {}) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    env: process.env,
    stdio: options.capture ? 'pipe' : 'inherit',
    encoding: 'utf8',
  });

  if (result.error) {
    if (options.allowFailure) return result;
    fail(`${label}失败：${result.error.message}`);
  }
  if (result.status !== 0 && !options.allowFailure) {
    fail(`${label}失败，退出码 ${result.status}`);
  }
  return result;
}

function runNpm(label, args, options = {}) {
  if (!npmCliPath) {
    fail('请通过 npm run setup 执行初始化脚本');
  }
  return run(label, process.execPath, [npmCliPath, ...args], options);
}


function parseVersion(version) {
  const match = String(version).trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return match.slice(1).map(Number);
}

function isAtLeast(actual, minimum) {
  for (let index = 0; index < minimum.length; index += 1) {
    if (actual[index] > minimum[index]) return true;
    if (actual[index] < minimum[index]) return false;
  }
  return true;
}

function getGlobalOpenSpecVersion() {
  const result = runNpm(
    '检查全局 OpenSpec',
    ['list', '--global', '@fission-ai/openspec', '--depth=0', '--json'],
    { capture: true, allowFailure: true },
  );

  try {
    const tree = JSON.parse(result.stdout || '{}');
    return tree.dependencies?.['@fission-ai/openspec']?.version ?? null;
  } catch {
    return null;
  }
}

if (!existsSync(packageJsonPath)) {
  fail('请在项目根目录执行 npm run setup');
}

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const expectedOpenSpec = packageJson.devDependencies?.['@fission-ai/openspec'];
if (!/^\d+\.\d+\.\d+$/.test(expectedOpenSpec ?? '')) {
  fail('package.json 未使用精确版本锁定 @fission-ai/openspec');
}

console.log('🚇 苏州地铁 11 号线项目环境初始化');
console.log(`项目目录：${projectRoot}`);
console.log(`OpenSpec 目标版本：${expectedOpenSpec}`);

run('检查 Git', 'git', ['--version']);
runNpm('检查 npm', ['--version']);

const currentNode = parseVersion(process.versions.node);
const minimumNode = [20, 19, 0];
if (!currentNode || !isAtLeast(currentNode, minimumNode)) {
  fail(`Node.js 必须不低于 20.19.0，当前为 ${process.versions.node}`);
}
console.log(`✓ Node.js ${process.versions.node}`);

runNpm('按照 package-lock.json 安装依赖', ['ci']);
run('生成 Prisma Client', process.execPath, [prismaCliPath, 'generate']);

const localVersion = run(
  '验证项目 OpenSpec',
  process.execPath,
  [localOpenSpecCliPath, '--version'],
  { capture: true },
).stdout.trim();
if (localVersion !== expectedOpenSpec) {
  fail(`项目 OpenSpec 应为 ${expectedOpenSpec}，实际为 ${localVersion}`);
}
console.log(`✓ 项目 OpenSpec ${localVersion}`);

let globalVersion = getGlobalOpenSpecVersion();
if (globalVersion !== expectedOpenSpec) {
  console.log(
    `全局 OpenSpec 当前为 ${globalVersion ?? '未安装'}，正在安装 ${expectedOpenSpec}……`,
  );
  runNpm(
    '安装团队固定的全局 OpenSpec',
    ['install', '--global', `@fission-ai/openspec@${expectedOpenSpec}`],
  );
  globalVersion = getGlobalOpenSpecVersion();
}
if (globalVersion !== expectedOpenSpec) {
  fail(`全局 OpenSpec 应为 ${expectedOpenSpec}，实际为 ${globalVersion ?? '未安装'}`);
}
console.log(`✓ 全局 OpenSpec ${globalVersion}`);

if (existsSync(path.join(projectRoot, '.env'))) {
  console.log('✓ 已检测到 .env');
} else {
  console.warn('⚠ 未检测到 .env；需要数据库或服务端功能时，请根据 .env.example 配置。');
}

console.log('\n✅ 环境初始化完成');
console.log('建议下一步运行：npm test');
