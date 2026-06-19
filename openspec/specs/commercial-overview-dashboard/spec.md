# commercial-overview-dashboard Specification

## Purpose
TBD - created by archiving change refactor-home-dashboard-2026-06-11. Update Purpose after archive.
## Requirements
### Requirement: 首页综合看板结构
系统 SHALL 在 `index.html` 按顺序显示经营总览头图、5 个核心 KPI、站点商业趋势和站点经营概览，并 SHALL 不显示旧的独立排名统计区。

#### Scenario: 首页完成加载
- **WHEN** 用户访问 `index.html` 且站点数据加载完成
- **THEN** 页面依次显示经营总览头图、整体出租率、商业点位、已出租、装修中、空置点位、站点商业趋势和站点经营概览

#### Scenario: 首页没有站点数据
- **WHEN** `state.stations` 为空数组
- **THEN** KPI 显示 0，趋势图和经营概览显示空状态且页面不抛出 JavaScript 异常

### Requirement: 看板数据使用真实站点数据
系统 SHALL 从 `state.stations` 中排除 `type === "多经点位"` 的记录后计算商铺总数、已租、装修、空置、总面积、已租面积和出租率；系统 MUST NOT 在首页生成数据模型不存在的“数据状态”或“最近更新”字段。

#### Scenario: 计算核心指标
- **WHEN** 一个站点包含营业中、装修中、未出租商铺和多经点位
- **THEN** KPI 和站点统计分别计算营业中、装修中、未出租数量，多经点位仅计入多经点位列且不计入出租率分母

#### Scenario: 计算出租率
- **WHEN** 一个站点有 2 个营业中、1 个装修中和1 个未出租商铺
- **THEN** 系统显示该站点出租率为 `75.0%`

#### Scenario: 统计口径一致
- **WHEN** 系统同时渲染 KPI、趋势图、详情卡和经营概览
- **THEN** “商业点位”表示非多经点位商铺总数，“已出租”表示 `营业中` 数量，“装修中”单独统计，“出租率”按 `(营业中 + 装修中) / 商业点位` 计算

### Requirement: 首页操作仅指向现有能力
系统 MUST NOT 显示当前系统不存在的“通知公告”或“点位台账”入口；首页如展示行动按钮，按钮 SHALL 仅链接到现有的 `data-viz.html` 或 `battle-map.html`。

#### Scenario: 不显示无效入口
- **WHEN** 首页完成加载
- **THEN** 页面不存在“查看通知公告”或“进入点位台账”按钮

#### Scenario: 首页行动按钮可访问
- **WHEN** 首页展示“管理商业信息”或“查看线路资产”按钮
- **THEN** 按钮分别链接到 `data-viz.html` 或 `battle-map.html` 且不存在空链接

### Requirement: 首页等级统计和筛选使用当前站点等级
首页经营概览 SHALL 使用当前 `state.stations[].grade` 的规范化结果计算等级统计、生成等级徽标 class，并执行 S/A 级重点站筛选。首页 MUST NOT 使用旧硬编码等级或非站点数据来源决定筛选结果。

#### Scenario: 等级统计随站点数据变化
- **WHEN** `state.stations` 中包含 1 个 S 级、2 个 A 级、1 个 B 级、1 个 C 级站点
- **THEN** `calcHomeStats()` 返回的 `gradeCount` 为 `{ S: 1, A: 2, B: 1, C: 1 }`

#### Scenario: S/A 筛选使用当前等级
- **WHEN** 站点表格中一个站点的当前 `grade` 为 `A`
- **AND** 用户点击 `data-station-filter="priority"` 的筛选按钮
- **THEN** 该站点保持可见

#### Scenario: 等级徽标 class 使用规范化等级
- **WHEN** 站点当前 `grade` 为小写 `a`
- **THEN** 首页站点表格和趋势详情使用 A 级徽标 class

### Requirement: 全站点三折线趋势
系统 SHALL 为 `state.stations` 中全部站点绘制商业点位、已出租和空置三条直线折线；折线 SHALL 使用原生 SVG，默认隐藏数据圆点。

#### Scenario: 渲染全部站点
- **WHEN** 系统加载默认 28 个站点
- **THEN** 趋势画布包含 28 个站点交互节点，三条折线分别包含 28 个数据点

#### Scenario: 动态 Y 轴
- **WHEN** 最大商业点位数量发生变化
- **THEN** Y 轴最大刻度至少等于该最大值，水平网格线与对应刻度位置对齐

#### Scenario: 站名换行
- **WHEN** 站点名称超过 5 个中文字符
- **THEN** 趋势图站名按每 5 个字符换行且不显示额外的“X 个点位”副标题

### Requirement: 趋势悬停与边缘移动
系统 SHALL 在用户悬停站点时显示垂直参考线、三个空心数据圆点和站点详情卡；详情 SHALL 在指针离开站点或趋势卡后保持最后状态。画布 SHALL 仅在指针进入左右各 20% 边缘区域时移动。

#### Scenario: 悬停站点
- **WHEN** 用户将指针移动到任一站点交互节点
- **THEN** 详情卡显示站点名称、价值等级、商业点位、已出租、装修、空置和出租率

#### Scenario: 中央区域不移动
- **WHEN** 指针位于趋势视口中央 60% 区域
- **THEN** 横向画布偏移保持不变

#### Scenario: 边缘区域移动
- **WHEN** 指针进入趋势视口左侧或右侧 20% 区域
- **THEN** 画布以 `requestAnimationFrame` 平滑向对应方向移动且不超过首尾边界

#### Scenario: 详情保持
- **WHEN** 用户已经悬停一个站点后将指针移出趋势卡
- **THEN** 最后一个站点详情卡、参考线和数据圆点继续显示

#### Scenario: 触屏浏览趋势
- **WHEN** 用户在触屏设备上横向拖动趋势视口并点击一个站点
- **THEN** 趋势画布可原生横向滚动且该站点详情、参考线和三个数据圆点保持显示

#### Scenario: 键盘浏览趋势
- **WHEN** 键盘用户聚焦一个站点交互节点
- **THEN** 系统显示与指针悬停相同的站点详情并提供可辨识的焦点样式

### Requirement: 站点经营概览真实字段
系统 SHALL 在固定高度可滚动表格中显示全部站点，并仅显示站点、价值等级、商铺、多经点位、总面积、已租面积、已租/装修/空置、出租率和展开操作。

#### Scenario: 默认展示全部站点
- **WHEN** 用户未使用搜索或筛选
- **THEN** 表格按线路原始顺序包含全部站点，表头在表格内部滚动时保持固定

#### Scenario: 面积字段
- **WHEN** 站点含有多个商铺和多经点位
- **THEN** 总面积与已租面积仅汇总非多经点位商铺，并分别保留 1 位小数和 `㎡` 单位

### Requirement: 经营概览搜索筛选
系统 SHALL 提供“全部站点”“S / A 级”“低出租率”三个筛选按钮和站名搜索框；低出租率 SHALL 定义为出租率小于 80%。

#### Scenario: 按站名搜索
- **WHEN** 用户在搜索框输入“花桥”
- **THEN** 表格仅显示站名包含“花桥”的站点及其对应详情行

#### Scenario: 筛选重点等级
- **WHEN** 用户点击“S / A 级”
- **THEN** 表格仅显示价值等级为 S 或 A 的站点

#### Scenario: 筛选低出租率
- **WHEN** 用户点击“低出租率”
- **THEN** 表格仅显示出租率小于 80% 的站点

#### Scenario: 搜索与筛选组合
- **WHEN** 用户选择“S / A 级”并输入带前后空格的站名关键词
- **THEN** 系统先去除关键词前后空格，再显示同时满足等级和站名条件的站点

#### Scenario: 筛选没有结果
- **WHEN** 搜索与筛选组合没有匹配站点
- **THEN** 表格显示明确的空结果提示且不残留已展开的详情行

### Requirement: 站点商铺明细
系统 SHALL 保留站点行展开能力，并在详情中显示该站点全部商铺和多经点位的编号、名称、属性、面积、租户和状态。

#### Scenario: 展开站点
- **WHEN** 用户点击一个站点主行或展开按钮
- **THEN** 紧邻该主行的详情行展开并显示该站点商铺明细

#### Scenario: 切换站点
- **WHEN** 用户在一个详情已展开时点击另一个站点
- **THEN** 原详情收起且新站点详情展开

#### Scenario: 键盘展开站点
- **WHEN** 键盘用户聚焦展开按钮并按 Enter 或 Space
- **THEN** 对应详情切换展开状态，按钮的 `aria-expanded` 与详情状态一致

### Requirement: 动态内容安全输出
系统 SHALL 使用 `escapeHtml()` 或 `textContent` 输出站点、商铺、租户及其他数据源文本，并 MUST NOT 将未经转义的数据直接拼接为可执行 HTML。

#### Scenario: 数据含 HTML 标签
- **WHEN** 站点名、商铺名或租户名包含 `<script>`、事件属性或其他 HTML 字符
- **THEN** 页面将其作为纯文本显示且不创建可执行元素

### Requirement: 首页响应式布局
系统 SHALL 在 1440px、980px 和 640px 断点下保持内容可用，并 SHALL 避免 `body` 出现水平溢出。

#### Scenario: 手机宽度
- **WHEN** 浏览器视口宽度为 390px
- **THEN** KPI 使用两列布局，趋势图和经营表在各自容器内滚动，页面主体宽度不超过视口

### Requirement: 动画偏好与资源约束
系统 SHALL 尊重 `prefers-reduced-motion`，并 SHALL 使用同源、经过压缩的首页图片资源，避免依赖被现有 CSP 阻止的外部字体或样式。

#### Scenario: 用户减少动画
- **WHEN** 浏览器启用 `prefers-reduced-motion: reduce`
- **THEN** 数字递增、区块入场和画布缓动等非必要动画被禁用，核心内容仍立即可见

#### Scenario: 严格 CSP
- **WHEN** 页面由当前 Express 服务以 `Content-Security-Policy: default-src 'self'` 返回
- **THEN** 首页不请求外部字体或样式且控制台无 CSP 资源阻止错误
