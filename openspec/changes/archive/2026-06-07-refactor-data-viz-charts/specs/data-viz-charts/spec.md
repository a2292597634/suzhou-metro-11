## ADDED Requirements

### Requirement: 纯 SVG 实现，零外部依赖
`charts.js` MUST 使用纯 SVG 元素渲染图表，SHALL 不依赖任何第三方图表库（如 Chart.js、D3.js、ECharts 等）。每个图表函数接收数据数组 + 配置对象，返回完整的 SVG 字符串。

#### Scenario: 图表模块无外部 import
- **WHEN** 检查 `js/modules/charts.js` 的 import 语句
- **THEN** 仅 import 项目内部模块（如有需要），不 import 任何第三方图表库

#### Scenario: 图表函数返回 SVG 字符串
- **WHEN** 调用 `renderBarChart(stations, options)`
- **THEN** 返回值是一个包含完整 `<svg>` 标签的字符串，可直接通过 `innerHTML` 插入 DOM

### Requirement: 出租率柱状图
`renderBarChart(stations, options)` MUST 为每个站点渲染一根垂直柱，高度与出租率成正比，X 轴标注站点名称，Y 轴标注百分比刻度。

#### Scenario: 柱状图基本渲染
- **WHEN** 传入 28 个站点数据
- **THEN** SVG 中包含 28 根垂直柱（`<rect>` 元素）
- **AND** 每根柱的高度与对应站点的出租率正相关
- **AND** Y 轴标注 0%、25%、50%、75%、100% 刻度线
- **AND** X 轴标注站点名称（文字旋转 45°）
- **AND** 图表标题为"各站点出租率"

#### Scenario: 柱的颜色渐变
- **WHEN** 站点出租率 ≥ 70%
- **THEN** 对应柱使用 `--color-fresh-green`（#16a34a）
- **WHEN** 站点出租率在 40%–69%
- **THEN** 对应柱使用 `--color-warm-orange`（#ea580c）
- **WHEN** 站点出租率 < 40%
- **THEN** 对应柱使用红色（#ef4444）

#### Scenario: 空数据柱状图
- **WHEN** 传入空站点数组
- **THEN** SVG 显示"暂无数据"占位文字
- **AND** 不抛出异常

#### Scenario: 单站点柱状图
- **WHEN** 传入仅 1 个站点
- **THEN** SVG 中包含 1 根柱，居中显示
- **AND** 柱状图正常渲染，不因数据量少而变形

### Requirement: 柱状图 Tooltip
柱状图每根柱在 hover 时 MUST 显示 tooltip，包含站点名称和出租率数值。

#### Scenario: Hover 显示 tooltip
- **WHEN** 用户鼠标悬停在某个站点的柱上
- **THEN** 在柱上方出现 tooltip，内容为："站点名称：XX.X%"
- **AND** 被 hover 的柱颜色加深（opacity 从 1 变为 0.8）

#### Scenario: 鼠标移出隐藏 tooltip
- **WHEN** 用户鼠标移出柱
- **THEN** tooltip 隐藏
- **AND** 柱颜色恢复原始 opacity

### Requirement: 分级占比环形图
`renderDonutChart(gradeCount, options)` MUST 以环形图（中心镂空的饼图）展示各商业价值等级（S / A / B / C）的站点数量占比。

#### Scenario: 环形图基本渲染
- **WHEN** 传入 `{ S: 3, A: 5, B: 7, C: 13 }` 分级数量
- **THEN** SVG 中包含 4 个扇区（`<path>` 元素），分别代表 S/A/B/C 级
- **AND** 每个扇区使用对应等级颜色（S=#d4380d, A=#fa8c16, B=#facc14, C=#52c41a）
- **AND** 中心镂空半径约为外半径的 60%
- **AND** 中心显示总站点数（如 "28"）
- **AND** 图表标题为"站点等级分布"

#### Scenario: 扇区标签显示百分比
- **WHEN** 环形图渲染完成
- **THEN** 每个扇区旁显示标签："X级 N个 (XX%)"
- **AND** 标签使用 `--font-inter` 字体，字号 `--text-caption`

#### Scenario: 单一等级
- **WHEN** 所有站点均为同一等级
- **THEN** 环形图显示为完整圆环（360° 单色），中心显示总数

### Requirement: 经营状态分布图
`renderStatusChart(stations, options)` MUST 以分组柱状图展示各站点的商铺经营状态（营业中 / 未出租 / 装修中）分布。

#### Scenario: 状态分布图基本渲染
- **WHEN** 传入站点数据
- **THEN** SVG 中每个站点有 3 根并排的柱（营业中 / 未出租 / 装修中）
- **AND** 营业中柱使用 `--color-fresh-green`（#16a34a）
- **AND** 未出租柱使用红色（#ef4444）
- **AND** 装修中柱使用 `--color-warm-orange`（#ea580c）
- **AND** 图表标题为"各站点经营状态分布"
- **AND** 底部显示图例

#### Scenario: 移动端状态图简化
- **WHEN** 视口宽度 ≤ 768px
- **THEN** 状态分布图仅显示前 10 个站点（按出租率降序）
- **AND** 柱间距缩小以适应窄屏

### Requirement: 图表颜色使用 CSS 自定义属性
所有图表颜色 MUST 通过读取 CSS 自定义属性（`getComputedStyle`）获取，确保与 `platform.css` 设计系统 Token 一致。

#### Scenario: 颜色从 CSS Token 读取
- **WHEN** 图表函数需要颜色值
- **THEN** 通过 `getComputedStyle(document.documentElement).getPropertyValue('--color-fresh-green')` 读取
- **AND** 若 Token 不存在，回退到硬编码默认值（与 DESIGN.md 一致）

### Requirement: 图表响应式适配
图表 MUST 在不同视口宽度下调整布局。

#### Scenario: 桌面端三列布局
- **WHEN** 视口宽度 > 768px
- **THEN** 三个图表（出租率柱状图、分级环形图、状态分布图）并排显示为三列

#### Scenario: 移动端单列布局
- **WHEN** 视口宽度 ≤ 768px
- **THEN** 三个图表堆叠为单列
- **AND** 柱状图 X 轴标签文字缩小为 `--text-caption`（10px），旋转角度减为 30°
- **AND** 状态分布图仅显示前 10 个站点

### Requirement: 筛选后图表同步更新
当用户切换筛选或排序时，图表 MUST 同步更新以反映当前筛选后的数据集。

#### Scenario: 筛选后柱状图更新
- **WHEN** 用户选择"A级"筛选
- **THEN** 柱状图仅显示 A 级站点
- **AND** 环形图更新为仅统计 A 级站点中各子类（如有）或显示筛选提示
- **AND** 状态分布图仅显示 A 级站点

#### Scenario: 恢复"全部"筛选后图表恢复
- **WHEN** 用户从"A级"切换回"全部"筛选
- **THEN** 所有图表恢复显示全部站点数据

## Testing Notes

- **单元测试** (`tests/charts.test.js`)：覆盖 `renderBarChart`、`renderDonutChart`、`renderStatusChart` 三个导出函数
  - 验证返回值为合法 SVG 字符串（包含 `<svg>` 标签）
  - 验证柱数量与输入数据量匹配
  - 验证空数组不抛异常，返回占位文字
  - 验证单站点边界情况
  - 验证颜色映射正确（出租率阈值颜色切换）
- **集成测试** (`tests/integration/viz-charts.test.js`)：验证筛选后 `viz.filterStations()` 的输出传入 `charts.renderBarChart()` 后图表数据正确
- **E2E 测试** (`tests/e2e/data-viz-flow.test.js`)：使用 Puppeteer 验证图表在页面加载后可见、筛选后更新、hover 显示 tooltip
- 不需要 mock：`charts.js` 是纯函数，测试中直接传入构造数据即可
- 需要 DOM 环境：颜色读取测试需要在 jsdom 中设置 CSS 自定义属性
