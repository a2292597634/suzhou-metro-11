## Why

`add-excel-import-export` 将导入导出改为服务端 API 方式后，纯静态部署环境（如 GitHub Pages）无法调用后端 API，导致导出、导入、下载模板功能完全不可用。需要增加前端 SheetJS 降级方案，确保静态部署时功能仍可用。

另外修复了两个降级 bug：1) 降级导入只更新内存 state 不写 localStorage，刷新生效；2) 降级导入后 `loadData()` 会用旧数据覆盖刚导入的数据。

## What Changes

- **js/modules/data.js**:
  - `exportExcel()` 和 `downloadTemplate()`: fetch blob 下载（一次请求），5s 超时 → 失败降级 SheetJS 生成
  - `importExcel()`: fetch API，10s 超时 → 网络异常降级 SheetJS 解析
  - `fallbackImport()`: SheetJS 解析 → 更新 state → **写入 localStorage** → 返回 `{ source: 'local' }`
- **js/modules/main.js**: 两处导入回调检测 `result.source === 'local'` 时跳过 `loadData()`，直接用内存 state 重算和渲染

## Capabilities

### Modified Capabilities
- `module-data`: Excel 导入导出降级逻辑，含 localStorage 持久化和 source 标记

## 测试策略

- **单元测试**：更新 `tests/data.test.js`，覆盖降级路径和 localStorage 写入

## 成功标准

- [ ] 静态部署时导出/导入/模板功能正常
- [ ] 降级导入数据不丢失（写 localStorage，不被 loadData 覆盖）
- [ ] 有后端时优先走 API 路径
- [ ] `npm test` 零失败

## Impact

| 文件 | 变更 |
|------|------|
| `js/modules/data.js` | 降级函数、blob 下载、超时控制、localStorage 保存 |
| `js/modules/main.js` | 导入回调 source 判断，降级时跳过 loadData |
