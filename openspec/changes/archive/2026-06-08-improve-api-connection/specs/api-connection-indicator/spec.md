## ADDED Requirements

### Requirement: loadData 返回数据来源并派发事件
`data.loadData()` MUST 在成功加载后 dispatch `datasource:change` 自定义事件，事件 `detail` 包含 `{ source }` 字段，值为 `'server'`、`'local'` 或 `'default'`。同时 MUST 返回包含 `source` 字段的对象。

#### Scenario: 从服务器加载成功
- **WHEN** API 返回 200 且包含有效数据
- **THEN** `loadData()` dispatch `datasource:change` 事件，`detail.source` 为 `'server'`
- **AND** `loadData()` 返回 `{ source: 'server' }`

#### Scenario: 回退到 localStorage
- **WHEN** API 不可用但 localStorage 中有缓存数据
- **THEN** `loadData()` dispatch `datasource:change` 事件，`detail.source` 为 `'local'`
- **AND** `loadData()` 返回 `{ source: 'local' }`

#### Scenario: 使用默认数据
- **WHEN** API 和 localStorage 均无可用数据
- **THEN** `loadData()` dispatch `datasource:change` 事件，`detail.source` 为 `'default'`
- **AND** `loadData()` 返回 `{ source: 'default' }`

### Requirement: saveData 返回保存目标并派发事件
`data.saveData()` MUST 在保存后 dispatch `datasource:change` 事件，并返回 `{ success: true, source: 'server' | 'local' }`。

#### Scenario: 保存到服务器成功
- **WHEN** `POST /api/data` 返回 200
- **THEN** `saveData()` dispatch `datasource:change` 事件，`detail.source` 为 `'server'`
- **AND** `saveData()` 返回 `{ success: true, source: 'server' }`

#### Scenario: 回退到本地保存
- **WHEN** `POST /api/data` 失败
- **THEN** `saveData()` dispatch `datasource:change` 事件，`detail.source` 为 `'local'`
- **AND** `saveData()` 返回 `{ success: true, source: 'local' }`

### Requirement: 导航栏监听事件更新数据来源指示器
`nav.js` MUST 在 `initNav()` 中注册 `window.addEventListener('datasource:change', handler)` 监听器，根据事件 `detail.source` 更新顶部导航栏右侧的数据来源指示器。

#### Scenario: 显示服务器来源
- **WHEN** 收到 `datasource:change` 事件，`detail.source` 为 `'server'`
- **THEN** 指示器显示绿色圆点和"服务器数据"文字

#### Scenario: 显示本地来源
- **WHEN** 收到 `datasource:change` 事件，`detail.source` 为 `'local'`
- **THEN** 指示器显示黄色圆点和"本地缓存"文字

#### Scenario: 显示默认来源
- **WHEN** 收到 `datasource:change` 事件，`detail.source` 为 `'default'`
- **THEN** 指示器显示灰色圆点和"演示数据"文字

#### Scenario: 初始状态
- **WHEN** `initNav()` 执行完毕但 `datasource:change` 事件尚未触发
- **THEN** 指示器显示灰色圆点和"检测中…"文字

### Requirement: 保存回退时警告用户
当 `saveData()` 回退到 localStorage 时，调用方 MUST 检查返回值并显示警告 toast。

#### Scenario: 保存回退警告
- **WHEN** `saveData()` 返回 `{ source: 'local' }`
- **THEN** 页面显示警告 toast："⚠️ 服务器不可用，数据仅保存到本地缓存"
- **AND** toast 在 3 秒后自动消失

## Testing Notes

- **单元测试** (`tests/data.test.js`)：mock `fetch` 和 `localStorage`，验证：
  - 各场景下返回值含正确 `source` 字段
  - 各场景下正确 dispatch `datasource:change` 事件（通过 `window.addEventListener` 捕获验证）
- **单元测试** (`tests/nav.test.js`)：验证：
  - `initNav()` 注入的导航栏包含 `#datasource-indicator` 元素
  - 手动 dispatch `datasource:change` 事件后指示器 DOM 正确更新
  - 初始状态显示"检测中…"
- **集成测试** (`tests/integration/api-fallback.test.js`)：验证完整加载链路 + 事件触发 + 指示器更新
