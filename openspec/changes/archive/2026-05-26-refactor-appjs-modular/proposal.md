## Why

`js/app.js` 当前是一个 1300+ 行的单体对象（`BattleMap`），所有职责（数据管理、SVG 渲染、DOM 操作、事件绑定、视口控制、导入导出）全部耦合在一起。这导致：代码难以定位、改一处影响全局、无法单元测试、多人协作易冲突。在后续要叠加商铺增删、React 迁移、多人协作等功能前，必须先拆分为模块化解耦的架构。

## What Changes

- **拆分 `app.js` 为 ES Module 多文件结构**，按职责分层：数据层、渲染层、交互层、工具层
- **提取数据管理模块**：站点数据、全局统计、导入导出、持久化（localStorage + API）集中管理
- **提取渲染模块**：SVG 线路渲染、站点卡片渲染、统计面板渲染各自独立
- **提取交互模块**：视口控制（缩放/拖动）、事件监听、编辑功能独立
- **提取工具模块**：避让算法、HTML 转义、出租率计算等纯函数抽离
- **HTML 引入方式改为 `<script type="module">`**，不再使用全局 `app` 对象
- **保持所有现有功能不变**，用户可见行为零变化

## Capabilities

### New Capabilities
- `module-data`：站点数据与全局统计的集中管理（增删改查、计算、导入导出）
- `module-render`：渲染引擎（SVG、卡片、面板、图例）
- `module-interaction`：用户交互（视口控制、事件绑定、编辑）
- `module-utils`：通用工具函数（避让算法、计算、转义等）

### Modified Capabilities
- 无现有规范变更（本项目尚无 openspec/specs 目录）

## Impact

- `js/app.js` → 被拆分为 `js/modules/` 下多个文件，原文件废弃
- `index.html` → `<script src="js/app.js">` 改为 `<script type="module" src="js/main.js">`
- 零新依赖，纯原生 JS 模块化
- 所有现有功能（编辑、导入导出、打印、视口控制）保持行为一致
