## 为什么做这个变更

当前数据加载/保存流程有三层回退（服务器 API → localStorage → 默认数据），但用户完全不知道数据来自哪里——所有状态信息只输出到 `console.log`，页面上没有任何反馈。保存失败静默回退到 localStorage 时用户也毫无察觉，下次换浏览器或清缓存数据就丢了。此外 `state.apiBase` 硬编码为空字符串，生产环境如果需要将 API 部署到独立域名无法配置。

## 变更内容

- `loadData()` 和 `saveData()` dispatch `datasource:change` 自定义事件，`nav.js` 监听事件自动更新指示器（页面 init 代码无需改动）
- 顶部导航栏右侧注入数据来源指示器：🟢 服务器数据 / 🟡 本地缓存 / ⚪ 演示数据
- `saveData()` 回退到 localStorage 时，调用方检查返回值弹出警告 toast
- `state.apiBase` 支持通过 `<html data-api-base="...">` 属性配置，含 Node.js 安全守卫

## 能力项

### 新增能力
- `api-connection-indicator`: 数据来源 UI 指示器，告知用户当前数据存储位置
- `api-config`: API 基础地址可配置化

### 修改的能力
- `module-data`: `loadData()` 和 `saveData()` 的返回值结构变更（向后兼容，新增字段）

## 影响范围

**修改文件：**
- `js/modules/data.js` — `loadData()` / `saveData()` 返回来源信息并 dispatch 事件
- `js/modules/state.js` — `apiBase` 从 DOM dataset 安全读取
- `js/modules/nav.js` — 顶部导航栏注入数据来源指示器，监听事件更新

**不修改：**
- `main.js` / `home.js` / `viz.js` — 事件驱动，页面 init 代码无需改动
- `css/platform.css` — 指示器使用现有 Token

## 测试策略

依据 `openspec/testing-strategy.md`，本 change 涉及**修改模块**（data.js、state.js）和**新建 UI 组件**（来源指示器）：

| 模块 | 测试层级 | 测试文件 | 说明 |
|------|---------|---------|------|
| data.js（修改） | 单元测试 | `tests/data.test.js` | 验证返回值新增 source 字段，apiBase 配置来源 |
| state.js（修改） | 单元测试 | `tests/state.test.js` | 验证 apiBase 从 DOM 读取 |
| nav.js（修改） | 单元测试 | `tests/nav.test.js` | 验证指示器 DOM 注入 |
| 集成 | 集成测试 | `tests/integration/api-fallback.test.js` | 验证 API 失败时的完整回退链路和 UI 反馈 |

TDD 执行顺序：每个功能点按 Red → Green → Refactor。

## 成功标准

- [ ] `loadData()` 返回 `{ source: 'server' | 'local' | 'default' }` 来源信息
- [ ] `saveData()` 返回 `{ success, source: 'server' | 'local' }` 来源信息
- [ ] 页面加载后顶部导航栏显示数据来源指示器（服务器 / 本地 / 默认）
- [ ] 保存回退到 localStorage 时显示警告 toast
- [ ] `<html data-api-base="http://api.example.com">` 可配置 API 地址
- [ ] `npx vitest run` 全绿，零回归
