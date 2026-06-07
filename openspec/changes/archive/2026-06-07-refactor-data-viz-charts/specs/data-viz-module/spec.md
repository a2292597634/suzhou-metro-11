## ADDED Requirements

### Requirement: 模块使用共享数据源
viz.js MUST 通过 `data.js` 的 `loadData()` 函数加载站点数据，并将数据写入 `state.stations` 共享状态。页面 MUST NOT 维护私有数据副本。

#### Scenario: 页面加载时从 API 获取数据
- **WHEN** 用户打开 `data-viz.html`
- **THEN** viz.js 调用 `data.loadData()` 从服务器 API（`GET /api/data`）加载数据
- **AND** 数据写入 `state.stations` 共享状态
- **AND** 加载完成后渲染卡片网格

#### Scenario: API 不可用时回退到 localStorage
- **WHEN** 服务器 API 返回错误或不可达
- **THEN** viz.js 通过 `data.loadData()` 的三层回退（API → localStorage → 默认数据）加载数据
- **AND** 页面正常渲染，不显示错误状态

#### Scenario: 编辑保存通过 data.saveData() 写入
- **WHEN** 用户在 data-viz 页面编辑站点或商铺后保存
- **THEN** viz.js 调用 `data.saveData()` 将 `state.stations` 写入服务器 API（`POST /api/data`）
- **AND** 若 API 不可用，数据回退写入 localStorage

### Requirement: 等级筛选
viz.js MUST 支持按商业价值等级（S / A / B / C）筛选站点卡片。

#### Scenario: 点击等级筛选按钮
- **WHEN** 用户点击筛选工具栏中的"A级"按钮
- **THEN** 卡片网格仅显示等级为 "A" 的站点
- **AND** "A级"按钮变为激活态（添加 `.active` 类）
- **AND** 其他筛选按钮取消激活态

#### Scenario: 点击"全部"显示所有站点
- **WHEN** 用户点击"全部"筛选按钮
- **THEN** 卡片网格显示所有等级的站点
- **AND** "全部"按钮变为激活态

#### Scenario: 筛选后无匹配站点
- **WHEN** 用户选择某个等级筛选
- **AND** 该等级下没有站点
- **THEN** 卡片网格区域显示"该等级下暂无站点"空态提示

### Requirement: 排序功能
viz.js MUST 支持按出租率和商铺数量对站点卡片进行排序。

#### Scenario: 按出租率降序排列
- **WHEN** 用户点击"出租率 ↓"排序按钮
- **THEN** 站点卡片按出租率从高到低排列
- **AND** "出租率 ↓"按钮变为激活态

#### Scenario: 按出租率升序排列
- **WHEN** 用户点击"出租率 ↑"排序按钮
- **THEN** 站点卡片按出租率从低到高排列

#### Scenario: 按商铺数降序排列
- **WHEN** 用户点击"商铺数 ↓"排序按钮
- **THEN** 站点卡片按商铺总数从多到少排列

#### Scenario: 默认排序按站点坐标
- **WHEN** 用户选择"默认"排序
- **THEN** 站点卡片按 `x` 坐标从小到大排列（即地铁线路从西到东）

### Requirement: 站点卡片渲染
viz.js MUST 渲染包含以下信息的站点概览卡片：站点名称、等级徽章、出租率百分比、总商铺数、已出租数、空置数、总面积、出租率进度条、前 3 个商铺预览。

#### Scenario: 渲染站点卡片概览
- **WHEN** 数据加载完成
- **THEN** 卡片网格中每张卡片显示：
  - 等级徽章（带对应背景色：S=#d4380d, A=#fa8c16, B=#facc14, C=#52c41a）
  - 站点名称
  - 出租率大数字（百分比 + %符号）
  - 总商铺数、已出租数（绿色）、空置数（红色）、总面积
  - 出租率进度条（宽度 = 出租率百分比）
  - 前 3 个商铺的预览行（状态指示点 + 铺号 + 商户名）

#### Scenario: 换乘站显示换乘标签
- **WHEN** 站点的 `transfer` 属性为 `true`
- **THEN** 卡片头部显示蓝色"换乘"标签

#### Scenario: 卡片 hover 效果
- **WHEN** 用户鼠标悬停在卡片上
- **THEN** 卡片阴影加深并向上位移 2px
- **AND** 过渡动画时长 350ms

### Requirement: 卡片展开与详情编辑
viz.js MUST 支持点击展开站点卡片，显示完整站点信息编辑表单和商铺列表表格。

#### Scenario: 展开卡片查看详情
- **WHEN** 用户点击卡片底部的"查看全部 N 个商铺"按钮
- **THEN** 卡片展开，显示详情区域（站点信息表单 + 商铺表格）
- **AND** 卡片变为全宽（`grid-column: 1 / -1`）
- **AND** 按钮文字变为"收起详情"，箭头图标旋转 180°

#### Scenario: 编辑站点信息
- **WHEN** 用户在展开的卡片中修改站点名称、等级或换乘状态
- **AND** 点击"保存修改"按钮
- **THEN** 站点数据更新并保存
- **AND** 显示"✅ 数据已保存" toast 提示

#### Scenario: 编辑商铺信息
- **WHEN** 用户在展开卡片的商铺表格中修改铺号、面积、商户名、状态等字段
- **AND** 点击"保存修改"按钮
- **THEN** 商铺数据更新并保存
- **AND** 卡片概览区（出租率、进度条等）同步更新

#### Scenario: 添加新商铺
- **WHEN** 用户点击"添加商铺"按钮
- **THEN** 商铺表格末尾新增一行，默认值为：铺号"新商铺"、类型"商铺"、面积 0、状态"未出租"
- **AND** 卡片立即重新渲染以显示新行

#### Scenario: 删除商铺
- **WHEN** 用户点击某行商铺的删除按钮
- **AND** 在确认对话框中点击"确定"
- **THEN** 该商铺从站点商铺列表中移除
- **AND** 卡片重新渲染

#### Scenario: 取消编辑
- **WHEN** 用户点击"取消"按钮
- **THEN** 所有未保存的修改被丢弃
- **AND** 卡片恢复为收起状态

### Requirement: 动画进度条
卡片渲染后 MUST 展示进度条从 0 到目标值的生长动画。

#### Scenario: 进度条入场动画
- **WHEN** 卡片网格首次渲染或重新渲染
- **THEN** 每条出租率进度条从 0% 宽度在 800ms 内过渡到目标宽度
- **AND** 各卡片进度条依次启动（每张延迟 20ms），形成波浪效果

### Requirement: 跨页面数据同步
通过 `state.stations` 共享数据，data-viz 页面的编辑 MUST 对其他页面可见。

#### Scenario: 编辑后切换到作战图页面
- **WHEN** 用户在 data-viz 页面修改站点数据并保存
- **AND** 用户导航到 `battle-map.html`
- **THEN** 作战图页面加载 `state.stations` 时包含 data-viz 页面的最新编辑

#### Scenario: 作战图编辑后切换到 data-viz 页面
- **WHEN** 用户在 battle-map 页面编辑站点数据并保存
- **AND** 用户导航到 `data-viz.html`
- **THEN** data-viz 页面加载数据时显示作战图页面的最新编辑

## Testing Notes

- **单元测试** (`tests/viz.test.js`)：覆盖 `filterStations`、`sortStations`、`calcStationStats` 等纯逻辑函数，验证输入输出正确性
- **集成测试** (`tests/integration/viz-data.test.js`)：验证 viz 通过 data.js 加载/保存数据，mock `fetch` 和 `localStorage`
- **E2E 测试** (`tests/e2e/data-viz-flow.test.js`)：使用 Puppeteer 验证页面完整流程（加载 → 筛选 → 展开 → 编辑 → 保存 → 切换页面验证同步）
- 需要 mock：`fetch`（API 请求）、`localStorage`（本地存储回退）
- 不需要 mock：`state`（使用真实 state 对象）、`data.js`（集成测试中使用真实模块）
