## 上下文

`data.js` 的三层回退已经实现（API → localStorage → 默认数据），但完全静默——用户无法感知数据来源。`state.apiBase = ''` 硬编码，生产部署不灵活。

当前 `saveData()` 在 `main.js` 中被调用了 7 个不同地方（saveNow、importExcel、saveStationEdit、grade edit、stats edit、station card edit、resetData），如果让每个调用点都手动更新 UI 指示器，改动散乱且容易遗漏。

## 目标 / 非目标

**目标：**
- 数据来源对用户可见
- API 地址可配置
- 保存回退时主动提醒
- 改动集中，页面 init 代码无需修改

**非目标：**
- 不改变三层回退逻辑本身
- 不引入新的 UI 框架

## 关键决策

### 决策 1：事件驱动而非手动调用

**选择：** `data.js` 在每次 load/save 完成后 dispatch 自定义事件，`nav.js` 监听事件自动更新指示器。

```
data.loadData() → dispatch 'datasource:change' → nav 自动更新指示器
data.saveData() → dispatch 'datasource:change' → nav 自动更新指示器
```

**优点：**
- `main.js` / `home.js` / `viz.js` 的 init 代码一行不改
- `saveData()` 的 7 个调用点全部自动覆盖
- 解耦：data 模块不知道 nav 的存在

**替代方案：**
- ❌ 让每个调用点手动调 `nav.updateDataSource()` — 散落 7+ 处，必漏

### 决策 2：apiBase 安全读取

`document.documentElement` 在 Node.js 环境可能不存在。使用可选链：

```js
apiBase: (typeof document !== 'undefined' && document.documentElement?.dataset?.apiBase) || ''
```

### 决策 3：指示器更新时机

不仅 `loadData()` 时更新，**每次 `saveData()` 也更新**。因为可能出现：
- 加载时服务器正常 → 指示器显示"服务器"
- 保存时服务器挂了 → 回退到本地 → 指示器必须更新为"本地"

### 决策 4：不新增 toast 系统

`main.js` 的 `saveNow()` 已经根据 `result.source` 显示不同 toast，保持不变。`viz.js` 的 `saveCard()` 同样已有逻辑，仅需微调文案。

## 数据流

```
┌──────────┐  loadData()   ┌──────────────┐  dispatch event  ┌─────────┐
│  页面     │ ────────────→ │   data.js    │ ───────────────→ │  nav.js │
│ init()   │ ←── 返回数据   │              │                  │ 更新指示器│
└──────────┘               │  saveData()  │                  └─────────┘
                           │  (7个调用点)  │
                           └──────────────┘
                               ↑
                          所有调用点自动触发事件
                          无需手动通知 nav
```

## 改动范围

```
js/modules/
  data.js          # [修改] loadData/saveData dispatch 'datasource:change' 事件
                   #        loadData 返回 { source } 对象
  state.js         # [修改] apiBase 从 DOM dataset 安全读取
  nav.js           # [修改] createTopNav 注入指示器 DOM，监听事件更新
  main.js          # [不变]
  home.js          # [不变]
  viz.js           # [不变]
```

## 风险

| 风险 | 缓解 |
|------|------|
| CustomEvent 在旧浏览器不支持 | 项目目标浏览器均支持（Chrome/Edge 2015+） |
| 页面加载时事件在 nav 监听注册前触发 | nav 注入在 `document.body.prepend` 前完成，早于 loadData 调用 |
| jsdom 测试中 document 未就绪 | state.js 用可选链保护 |

## 未决问题

1. `datasource:change` 事件是否要在 toast 中复用？`main.js` 的 saveNow 已经独立处理 toast，保持现状即可。
2. 初始加载时指示器显示什么？在 `loadData` 完成前显示加载中（"检测中…"），完成后切换到实际来源。
