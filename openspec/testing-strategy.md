# 测试策略规范

> 本规范为所有 OpenSpec change 的测试工作提供统一标准。每个 change 的 propose → apply → archive 全生命周期必须遵守此规范，不得跳过、不得绕开。

---

## 一、测试金字塔（三层架构）

```
        ▲
       ╱ ╲    E2E 测试（Puppeteer）
      ╱   ╲   — 完整用户场景
     ╱─────╲  — 浏览器级验证
    ╱         ╲
   ╱  集成测试  ╲  — 模块间协作
  ╱   (jsdom)   ╲ — 跨模块数据流
 ╱─────────────────╲
╱     单元测试       ╲ — 纯函数、DOM、状态
╱  (Vitest + jsdom)  ╲ — 单个模块隔离测试
────────────────────────
```

### 1. 单元测试（必做）

**范围**：每个 `js/modules/*.js` 模块的导出函数、纯逻辑、DOM 操作、状态变更。

**工具**：Vitest + jsdom + @testing-library/dom

**要求**：
- 每个新增/修改的模块必须有对应的测试文件
- 测试文件命名：`tests/<模块名>.test.js`
- 覆盖率底线：模块内所有导出函数至少有一个正向测试用例
- 复杂逻辑必须有边界条件测试（空值、异常输入、极限值）

**执行命令**：`npm test`（一次性） / `npm run test:watch`（开发时）

### 2. 集成测试（视变更类型决定）

**范围**：模块间的协作链路。

**触发条件**（满足任一即需编写）：
- 变更涉及 2 个及以上模块的联动修改
- 变更修改了模块间接口（函数签名、事件名、state 结构）
- 变更涉及页面路由或导航状态同步
- 变更涉及数据流（API → state → render → interaction）

**测试文件命名**：`tests/integration/<场景名>.test.js`

### 3. E2E 测试（关键 change 必做）

**范围**：真实浏览器中的完整用户场景。

**触发条件**（满足任一即需编写）：
- 新增页面或大幅重构页面结构
- 涉及用户核心操作流程（增删改查）
- 涉及跨页面状态持久化（localStorage、URL 参数）

**工具**：Puppeteer（已安装在 package.json 中）

**测试文件命名**：`tests/e2e/<场景名>.test.js`

---

## 二、变更类型 → 测试层级映射

| 变更类型 | 示例 | 单元 | 集成 | E2E |
|---------|------|------|------|-----|
| **新建模块** | 新增 `js/modules/xxx.js` | ✅ 必做 | ✅ 必做 | — |
| **修改模块** | 修改 `data.js` 的 CRUD 逻辑 | ✅ 必做 | 视联动情况 | — |
| **样式调整** | 修改 CSS Token、颜色 | — | — | — |
| **新增页面** | 新建 `xxx.html` | ✅ 必做 | ✅ 必做 | ✅ 必做 |
| **重构页面** | 重写 `index.html` 结构 | ✅ 必做 | ✅ 必做 | ✅ 必做 |
| **增删改查** | 商铺新增/删除/编辑 | ✅ 必做 | ✅ 必做 | ✅ 必做 |
| **路由变更** | 新增页面路径、修改导航 | ✅ 必做 | ✅ 必做 | ✅ 必做 |
| **纯配置** | 修改 vite 配置、环境变量 | — | — | — |
| **Bug 修复** | 修复某个函数的逻辑错误 | ✅ 必做 | 视影响范围 | — |

> **样式调整和纯配置变更**可以豁免测试，但必须在 tasks.md 中明确标注「本变更不涉及逻辑，豁免测试」并说明理由。

---

## 三、TDD 执行流程（不可绕开）

每个功能点必须按以下三步执行：

### Step 1: Red（写失败测试）

- 先写测试用例，描述期望行为
- 运行测试，确认测试**失败**（Red）
- 如果测试通过，说明测试本身有问题（测的不是新功能，或期望描述不准确）

### Step 2: Green（写最小实现）

- 写最小代码使测试通过
- 禁止在使测试通过之前写「额外」的代码
- 运行测试，确认全部通过（Green）

### Step 3: Refactor（重构）

- 在测试保护下重构代码
- 每次重构后运行测试，确保没有破坏已有功能
- 可以拆分函数、重命名变量、消除重复

### 违规判定

以下行为视为违反 TDD：
- 先写实现代码，后补测试
- 测试和实现代码在同一 commit 中且测试并非先写
- 跳过 Red 阶段直接 Green
- 用 mock 覆盖核心业务逻辑以「伪造」测试通过

---

## 四、测试基础设施

### 4.1 已有基础设施（当前状态）

| 组件 | 状态 | 文件 |
|------|------|------|
| Vitest | ✅ 已安装 | `package.json` devDependencies |
| jsdom | ✅ 已安装 | `package.json` devDependencies |
| @testing-library/dom | ✅ 已安装 | `package.json` devDependencies |
| Puppeteer | ✅ 已安装 | `package.json` devDependencies |
| 配置文件 | ✅ 已创建 | `vitest.config.js` |
| 测试目录 | ✅ 已创建 | `tests/` |
| E2E 同源预览服务 | ✅ 已创建 | `tools/design-preview-server.js` |

### 4.2 测试目录规范

```
tests/
├── setup.test.js          # 环境验证（已有）
├── nav.test.js            # 导航模块（已有）
├── router.test.js         # 路由模块（已有）
├── <模块名>.test.js       # 单元测试（按模块一一对应）
├── integration/           # 集成测试
│   ├── nav-router.test.js
│   └── data-render.test.js
└── e2e/                   # E2E 测试
    ├── home-flow.test.js
    └── shop-crud.test.js
```

### 4.3 运行脚本

```bash
npm test              # 运行单元与集成测试（排除 tests/e2e/**）
npm run test:e2e      # 运行 E2E 测试（需先启动目标页面服务）
npm run test:all      # 运行单元、集成与 E2E（需先启动目标页面服务）
npm run test:watch    # 监听模式（开发用）
node scripts/check-test-coverage.js  # 检查覆盖率
```

首页 E2E 的本地同源预览可在两个 PowerShell 终端中运行：

```powershell
node tools/design-preview-server.js
$env:PORT='4173'; npm run test:e2e
```

预览服务对正式页面返回 `Content-Security-Policy: default-src 'self'`，用于验证与生产一致的资源约束；E2E 不 mock 首页渲染、导航或交互。
涉及后端写接口或测试数据库状态的 E2E 文件必须串行运行，避免跨文件并发污染共享数据库。`npm run test:e2e` 使用 `--no-file-parallelism`。E2E 浏览器启动统一使用 `tests/e2e/browser-helper.js`：优先读取 `PUPPETEER_EXECUTABLE_PATH`，本地缺少 Puppeteer 下载版 Chrome 时可回退到系统 Edge。

---

## 五、覆盖率检查脚本

`scripts/check-test-coverage.js` 自动执行以下检查：

1. **模块覆盖**：`js/modules/*.js` 每个模块是否有对应的 `tests/<模块名>.test.js`
2. **数量底线**：每个测试文件至少包含 3 个测试用例（describe/it）
3. **执行验证**：运行 `npm test` 确保全部通过
4. **报告输出**：生成 Markdown 格式的覆盖率报告

运行方式：
```bash
node scripts/check-test-coverage.js
```

---

## 六、测试检查清单

每个 change 在以下节点必须执行检查清单：

- **Propose 阶段**：在 `tasks.md` 中显式列出测试任务（不可隐含）
- **Apply 阶段**：每个功能点执行 TDD（Red → Green → Refactor）
- **完成阶段**：运行覆盖率检查脚本，确认通过
- **Archive 阶段**：在 change 归档前，确认所有测试任务已完成

详细检查清单见：`openspec/templates/testing-checklist.md`
