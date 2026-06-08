# 任务清单：前端连接真实后端 API

## 1. 基线确认

- [ ] 1.1 运行 `npx vitest run` 确认 161 用例全绿

## 2. data.js — loadData/saveData 增强（TDD）

### 2.T 测试（先写失败测试）

- [ ] 2.T.1 在 `tests/data.test.js` 中新增 `loadData()` 返回值测试（Red）
  - Mock fetch 200 → 返回 `{ source: 'server' }` 且 dispatch `datasource:change` 事件
  - Mock fetch 失败 + localStorage 有数据 → 返回 `{ source: 'local' }` 且 dispatch 事件
  - Mock fetch 失败 + localStorage 空 → 返回 `{ source: 'default' }` 且 dispatch 事件
- [ ] 2.T.2 在 `tests/data.test.js` 中新增 `saveData()` dispatch 事件测试（Red）
  - Mock fetch 200 → 验证 dispatch `datasource:change` 事件，detail 为 `{ source: 'server' }`
  - Mock fetch 失败 → 验证 dispatch 事件，detail 为 `{ source: 'local' }`
- [ ] 2.T.3 运行新增测试确认失败（Red 验证）

### 2.1 实现

- [ ] 2.1.1 修改 `loadData()`：各成功分支 dispatch `new CustomEvent('datasource:change', { detail: { source } })`，返回 `{ source }`
- [ ] 2.1.2 修改 `saveData()`：成功后 dispatch `datasource:change` 事件
- [ ] 2.1.3 运行测试确认通过（Green）

## 3. state.js — apiBase 配置化（TDD）

### 3.T 测试（先写失败测试）

- [ ] 3.T.1 在 `tests/state.test.js` 中新增 apiBase 配置测试（Red）
  - 设置 `document.documentElement.dataset.apiBase = 'http://example.com'` → 验证值为该 URL
  - 无 `data-api-base` 属性 → 验证值为 `''`

### 3.1 实现

- [ ] 3.1.1 修改 `state.js`：`apiBase` 使用安全读取 `(typeof document !== 'undefined' && document.documentElement?.dataset?.apiBase) || ''`
- [ ] 3.1.2 运行测试确认通过（Green）

## 4. nav.js — 数据来源指示器（TDD）

### 4.T 测试（先写失败测试）

- [ ] 4.T.1 在 `tests/nav.test.js` 中新增指示器测试（Red）
  - `initNav()` 后验证导航栏中存在 `#datasource-indicator` 元素
  - dispatch `datasource:change` 事件 `{ source: 'server' }` → 验证指示器文字含"服务器数据"
  - dispatch `datasource:change` 事件 `{ source: 'local' }` → 验证指示器文字含"本地缓存"
  - dispatch `datasource:change` 事件 `{ source: 'default' }` → 验证指示器文字含"演示数据"

### 4.1 实现

- [ ] 4.1.1 在 `nav.js` 的 `createTopNav()` 右侧操作区注入指示器 DOM：`<span id="datasource-indicator" class="datasource-badge">...</span>`
- [ ] 4.1.2 在 `initNav()` 中注册 `window.addEventListener('datasource:change', ...)` 监听事件，更新指示器内容和样式
- [ ] 4.1.3 指示器初始状态为"检测中…"（加载中灰色）
- [ ] 4.1.4 运行测试确认通过（Green）

## 5. 验证与回归

- [ ] 5.1 运行 `npx vitest run` 确认全绿，零回归
- [ ] 5.2 运行 `node scripts/check-test-coverage.js` 确认覆盖
- [ ] 5.3 浏览器验证：
  - 启动 PostgreSQL + 服务器 → 三页均显示"🟢 服务器数据"
  - 停掉 PostgreSQL 保留服务器 → 保存时弹出警告 toast → 指示器变为"🟡 本地缓存"
  - 刷新页面 → 从 localStorage 加载 → 指示器显示"🟡 本地缓存"
