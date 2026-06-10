# module-utils Specification

## 用途
通用工具函数模块规范（避让算法、出租率计算、HTML 转义）。
## Requirements
### Requirement: 工具模块提供卡片重叠避让
工具模块须实现检测和解决站点卡片重叠的算法。

#### Scenario: 检测水平重叠
- **WHEN** 两个上方排列的卡片在水平方向重叠时
- **THEN** 它们在水平方向分开，最大偏移 50px

#### Scenario: 检测垂直重叠
- **WHEN** 两个右侧排列的卡片在垂直方向重叠时
- **THEN** 它们在垂直方向分开，最大偏移 50px

#### Scenario: 线路边界保护
- **WHEN** 卡片会与 x=1700 处的垂直线段重叠时
- **THEN** 卡片与线路保持安全距离（18px）

### Requirement: 工具模块提供出租率计算
工具模块须计算出租率，多经点位不计入。

#### Scenario: 计算站点出租率
- **WHEN** 计算包含混合商铺类型的站点出租率时
- **THEN** 多经点位被排除在计算外

#### Scenario: 计算全局出租率
- **WHEN** 计算整体出租率时
- **THEN** 结果为（已出租 / 总数）× 100，保留 1 位小数

### Requirement: 工具模块提供 HTML 转义
工具模块须通过转义用户可编辑文本中的 HTML 来防止 XSS。转义函数 MUST 处理任意输入类型（null、undefined、数字、字符串）。

#### Scenario: 转义 HTML 字符
- **WHEN** 渲染包含 <、>、&、" 的文本时
- **THEN** 文本在插入 DOM 前被安全转义

#### Scenario: 转义函数处理 null 输入
- **WHEN** 传入 null 到转义函数
- **THEN** 返回空字符串

#### Scenario: 转义函数处理 undefined 输入
- **WHEN** 传入 undefined 到转义函数
- **THEN** 返回空字符串

#### Scenario: 转义函数处理数字输入
- **WHEN** 传入数字到转义函数
- **THEN** 返回对应的字符串表示

