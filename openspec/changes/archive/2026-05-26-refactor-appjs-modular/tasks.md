## 1. 搭建模块目录结构

- [x] 1.1 创建 `js/modules/` 目录
- [x] 1.2 创建占位文件：`utils.js`、`data.js`、`render.js`、`interaction.js`、`viewport.js`、`main.js`

## 2. 提取工具函数

- [x] 2.1 将 `calcRate()` 迁移到 `utils.js`
- [x] 2.2 将 `escapeHtml()` 迁移到 `utils.js`
- [x] 2.3 将 `resolveCardOverlaps()` 迁移到 `utils.js`
- [x] 2.4 将 `enforceLineBoundaries()` 迁移到 `utils.js`
- [x] 2.5 导出所有工具函数

## 3. 提取数据管理

- [x] 3.1 将 `config` 对象迁移到 `data.js`
- [x] 3.2 将 `gradeInfo` 迁移到 `data.js`
- [x] 3.3 将 `getDefaultStations()` 迁移到 `data.js`
- [x] 3.4 将 `getDefaultGlobalStats()` 迁移到 `data.js`
- [x] 3.5 将 `calcGlobalStats()` 迁移到 `data.js`
- [x] 3.6 将 `loadData()` / `saveData()` / `saveToLocal()` 迁移到 `data.js`
- [x] 3.7 将 `exportExcel()` / `importExcel()` 迁移到 `data.js`
- [x] 3.8 将 `resetData()` 迁移到 `data.js`
- [x] 3.9 导出数据模块 API

## 4. 提取视口控制

- [x] 4.1 将 `viewport` 状态和 `initViewport()` 迁移到 `viewport.js`
- [x] 4.2 将 `applyTransform()` / `zoom()` / `fitToScreen()` / `resetViewport()` 迁移到 `viewport.js`
- [x] 4.3 将所有拖动/触控事件处理迁移到 `viewport.js`
- [x] 4.4 将 `addViewportControls()` 和缩放按钮函数迁移到 `viewport.js`
- [x] 4.5 导出视口模块 API

## 5. 提取渲染功能

- [x] 5.1 将 `renderStatsPanel()` 迁移到 `render.js`
- [x] 5.2 将 `renderSVG()` 迁移到 `render.js`
- [x] 5.3 将 `renderStations()`（含重叠避让调用）迁移到 `render.js`
- [x] 5.4 将 `renderGradePanel()` 迁移到 `render.js`
- [x] 5.5 将 `renderFooter()` 迁移到 `render.js`
- [x] 5.6 将 `attachGradeEditListeners()` 迁移到 `render.js`
- [x] 5.7 将 `attachStationEditListeners()` 迁移到 `render.js`
- [x] 5.8 将 `attachGlobalEditListeners()` 迁移到 `render.js`
- [x] 5.9 导出渲染模块 API

## 6. 提取交互功能

- [x] 6.1 将 `makeEditable()` 迁移到 `interaction.js`
- [x] 6.2 将 `openStationEditor()` / `saveStationEdit()` / `closeModal()` 迁移到 `interaction.js`
- [x] 6.3 将 `setupEventListeners()` 迁移到 `interaction.js`
- [x] 6.4 将 `showToast()` / `printMap()` 迁移到 `interaction.js`
- [x] 6.5 导出交互模块 API

## 7. 创建主入口文件

- [x] 7.1 在 `main.js` 中导入所有模块
- [x] 7.2 实现 `init()`，协调各模块初始化
- [x] 7.3 创建 `app` 全局对象，暴露 HTML onclick 调用的接口
- [x] 7.4 绑定 `DOMContentLoaded` 事件调用 `init()`

## 8. 更新 HTML 并清理旧文件

- [x] 8.1 更新 `index.html`：将 `js/app.js` 替换为 `js/main.js`，使用 `type="module"`
- [x] 8.2 删除 `js/app.js`
- [x] 8.3 检查其他文件是否引用了 `BattleMap` 全局变量

## 9. 测试验证

- [x] 9.1 启动服务器并打开页面
- [x] 9.2 验证 28 个站点全部正确渲染
- [x] 9.3 验证卡片重叠避让正常工作
- [x] 9.4 验证单击数字编辑功能正常
- [x] 9.5 验证双击打开模态框功能正常
- [x] 9.6 验证缩放/拖动/视口控制正常
- [x] 9.7 验证 Excel 导出功能正常
- [x] 9.8 验证保存/重置功能正常
- [x] 9.9 验证打印功能正常
