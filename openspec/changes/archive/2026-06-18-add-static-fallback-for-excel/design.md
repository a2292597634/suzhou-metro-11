## Context

`add-excel-import-export` 将导入导出迁移到服务端 API（ExcelJS 引擎），但纯静态部署环境无需后端，导致功能不可用。前端仍保留 `xlsx.full.min.js`（SheetJS），可做降级。

## Goals / Non-Goals

**Goals:**
- 静态部署时 Excel 导入导出功能正常
- 降级导入数据持久化到 localStorage
- 有后端时不降级，走完整 API 路径

**Non-Goals:**
- 降级模式下不提供多 Sheet 模板（只有单 Sheet）

## Decisions

### 1. blob 下载替代 HEAD 探测

**选择：fetch + blob + AbortController 超时**

- 一次请求完成探测+下载，比 HEAD+GET 少一次往返
- 5s 超时用于导出/模板下载，10s 用于导入上传
- 超时或网络异常触发降级

### 2. 降级导入写 localStorage

fallbackImport 更新 state 后调用 `saveToLocal()`，返回 `{ source: 'local' }`。确保降级数据不会因 `loadData()` 或页面刷新丢失。

### 3. main.js 根据 source 分流

`result.source === 'local'` → 跳过 `loadData()`，直接 calcGlobalStats + render
`result.source !== 'local'` → 调 `loadData()` 从服务端刷新

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 降级模板只有单 Sheet（无验证下拉）| 静态部署用户仍可用基本功能；说明列标题即可 |
| AbortController 不兼容 IE | 本项目目标现代浏览器 |

## Open Questions

1. 降级模板是否应该也生成站点信息和分级标准 Sheet？
2. 是否需要在 UI 上提示用户当前处于「离线模式」？
