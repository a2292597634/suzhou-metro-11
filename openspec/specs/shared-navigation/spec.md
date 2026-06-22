# shared-navigation Specification

## Purpose
The shared navigation capability defines desktop top navigation and mobile bottom navigation entries, labels, URLs, active page state, and cross-page consistency.

## Requirements
### Requirement: data-viz 页面导航命名为商业信息管理
共享导航 SHALL 将 `data-viz.html` 对应的桌面顶部导航和移动底部导航入口显示为「商业信息管理」。导航的 URL、页面 key 和当前页面激活态 MUST 继续指向 data-viz 页面。

#### Scenario: 桌面导航显示商业信息管理
- **WHEN** 页面初始化共享顶部导航
- **THEN** 指向 `data-viz.html` 的导航链接文本为「商业信息管理」
- **AND** 该链接不显示为「商业分析」或「商业数据」

#### Scenario: 移动底部导航显示商业信息管理
- **WHEN** 页面初始化移动底部导航
- **THEN** 指向 `data-viz.html` 的底部导航项文本为「商业信息管理」
- **AND** 当前页面为 `data-viz.html` 时该导航项保持激活态
