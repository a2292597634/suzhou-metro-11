/**
 * 测试覆盖率检查脚本
 * 自动检查：1)每个模块是否有对应测试文件 2)测试数量底线 3)全部通过
 *
 * 运行方式：node scripts/check-test-coverage.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ───────────────────────── 配置 ─────────────────────────

const MODULES_DIR = path.resolve(__dirname, '..', 'js', 'modules');
const TESTS_DIR = path.resolve(__dirname, '..', 'tests');
const MIN_TESTS_PER_FILE = 3;
const STRUCTURE_ONLY = process.argv.includes('--structure-only');

// 不需要测试的模块（纯入口、纯配置、纯副作用）
const EXCLUDED_MODULES = ['main.js'];

// 颜色输出（兼容 Windows PowerShell）
const C = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  gray: (s) => `\x1b[90m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`
};

// ───────────────────────── 工具函数 ─────────────────────────

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function listFiles(dir, ext) {
  if (!exists(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(ext))
    .map((f) => path.basename(f, ext));
}

function countTests(testPath) {
  if (!exists(testPath)) return 0;
  const content = fs.readFileSync(testPath, 'utf-8');
  // 粗略统计 it() 和 test() 调用数量
  const itMatches = content.match(/\bit\s*\(/g) || [];
  const testMatches = content.match(/\btest\s*\(/g) || [];
  return itMatches.length + testMatches.length;
}

// ───────────────────────── 检查 1：模块覆盖 ─────────────────────────

function checkModuleCoverage() {
  console.log(C.bold('\n━━━ 检查 1：模块测试覆盖 ━━━\n'));

  const modules = listFiles(MODULES_DIR, '.js').filter(
    (m) => !EXCLUDED_MODULES.includes(`${m}.js`)
  );

  const covered = [];
  const missing = [];

  for (const mod of modules) {
    const testPath = path.join(TESTS_DIR, `${mod}.test.js`);
    if (exists(testPath)) {
      covered.push({ name: mod, path: testPath });
    } else {
      missing.push(mod);
    }
  }

  console.log(`模块总数: ${modules.length}`);
  console.log(`已覆盖: ${C.green(covered.length)}`);
  if (missing.length > 0) {
    console.log(`未覆盖: ${C.red(missing.length)}`);
    for (const m of missing) {
      console.log(`  ${C.red('✗')} js/modules/${m}.js → 缺失 tests/${m}.test.js`);
    }
  } else {
    console.log(`未覆盖: ${C.green('0')} ✅`);
  }

  return { ok: missing.length === 0, covered, missing };
}

// ───────────────────────── 检查 2：测试数量底线 ─────────────────────────

function checkTestCount(covered) {
  console.log(C.bold('\n━━━ 检查 2：测试数量底线（每个文件 ≥3 个用例） ━━━\n'));

  const lowCount = [];

  for (const { name, path: p } of covered) {
    const count = countTests(p);
    if (count < MIN_TESTS_PER_FILE) {
      lowCount.push({ name, count });
      console.log(`  ${C.yellow('⚠')} tests/${name}.test.js — ${count} 个用例（要求 ≥${MIN_TESTS_PER_FILE}）`);
    } else {
      console.log(`  ${C.green('✓')} tests/${name}.test.js — ${count} 个用例`);
    }
  }

  if (lowCount.length === 0) {
    console.log(C.green('所有测试文件均满足数量要求 ✅'));
  }

  return { ok: lowCount.length === 0, lowCount };
}

// ───────────────────────── 检查 3：执行验证 ─────────────────────────

function checkExecution() {
  console.log(C.bold('\n━━━ 检查 3：执行验证（npm test） ━━━\n'));

  try {
    const output = execSync('npm test', {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf-8',
      timeout: 60000
    });
    console.log(output);

    // 检查是否有失败
    const failedMatch = output.match(/failed\s*\((\d+)\)/i) || output.match(/Tests\s+(\d+)\s+failed/i);
    if (failedMatch && parseInt(failedMatch[1]) > 0) {
      return { ok: false, error: `${failedMatch[1]} 个测试失败` };
    }

    const passedMatch = output.match(/Tests\s+(\d+)\s+passed/i);
    if (passedMatch) {
      console.log(C.green(`\n全部 ${passedMatch[1]} 个测试通过 ✅`));
      return { ok: true, passed: parseInt(passedMatch[1]) };
    }

    // Vitest run 的另一种输出格式
    const runMatch = output.match(/Tests\s+.*\s+passed\s+\((\d+)\)/i);
    if (runMatch) {
      console.log(C.green(`\n全部测试通过 ✅`));
      return { ok: true, passed: parseInt(runMatch[1]) };
    }

    console.log(C.yellow('无法解析测试结果，请手动确认'));
    return { ok: true };
  } catch (err) {
    console.log(C.red(err.stdout || err.message || '测试执行失败'));
    return { ok: false, error: err.message };
  }
}

// ───────────────────────── 报告汇总 ─────────────────────────

function printSummary(results) {
  console.log(C.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(C.bold('              覆盖率检查报告'));
  console.log(C.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  const { moduleCoverage, testCount, execution } = results;

  const allOk = moduleCoverage.ok && testCount.ok && execution.ok;

  console.log(`模块覆盖: ${moduleCoverage.ok ? C.green('通过 ✅') : C.red('未通过 ❌')} (${moduleCoverage.covered.length}/${moduleCoverage.covered.length + moduleCoverage.missing.length})`);
  console.log(`数量底线: ${testCount.ok ? C.green('通过 ✅') : C.red('未通过 ❌')}`);
  const executionStatus = execution.skipped
    ? C.yellow('跳过（由独立测试步骤执行）')
    : `${execution.ok ? C.green('通过 ✅') : C.red('未通过 ❌')} ${execution.passed ? `(${execution.passed} 个测试)` : ''}`;
  console.log(`执行验证: ${executionStatus}`);

  console.log(C.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  if (allOk) {
    console.log(C.bold(C.green('           所有检查通过 🎉')));
  } else {
    console.log(C.bold(C.red('           存在未通过项，请修复后重试')));
    process.exitCode = 1;
  }
  console.log(C.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
}

// ───────────────────────── 主流程 ─────────────────────────

function main() {
  console.log(C.bold('\n🔍 苏州地铁11号线商业信息综合平台 — 测试覆盖率检查\n'));

  const moduleCoverage = checkModuleCoverage();
  const testCount = checkTestCount(moduleCoverage.covered);
  const execution = STRUCTURE_ONLY
    ? { ok: true, skipped: true }
    : checkExecution();
  printSummary({ moduleCoverage, testCount, execution });
}

main();
