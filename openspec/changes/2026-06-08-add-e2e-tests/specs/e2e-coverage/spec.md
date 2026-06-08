## ADDED Requirements

### Requirement: 首页 E2E 覆盖
MUST 有 E2E 测试验证首页可加载、导航栏正常、数据来源指示器可见。

#### Scenario: 首页加载验证
- **WHEN** 运行 E2E 测试访问 index.html
- **THEN** 验证导航栏存在、导航链接包含三个页面、数据来源指示器有文字内容

### Requirement: 作战图 E2E 覆盖
MUST 有 E2E 测试验证作战图可加载、页面标题可见、数据来源指示器可见。

#### Scenario: 作战图加载验证
- **WHEN** 运行 E2E 测试访问 battle-map.html
- **THEN** 验证导航栏存在、页面标题可见、数据来源指示器可见

### Requirement: 数据可视化 E2E 覆盖
MUST 有 E2E 测试验证图表容器、筛选联动、卡片展开和数据来源指示器。

#### Scenario: 数据可视化功能验证
- **WHEN** 运行 E2E 测试访问 data-viz.html
- **THEN** 验证图表 SVG 容器存在、筛选后图表更新、展开卡片后详情可见、数据来源指示器可见

## Testing Notes

- 本 change 为纯测试，豁免额外测试
- 运行方式：启动 server.js 后 `npx vitest run tests/e2e/`
- 采用单页加载模式避免重复导航超时
