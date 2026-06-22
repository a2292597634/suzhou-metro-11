# station-grade-linkage Specification

## Purpose
The station grade linkage capability ensures every page uses the current station grade as the single source for display, filtering, statistics, editing, chart callbacks, and cross-page refresh behavior.

## Requirements
### Requirement: 全站车站商业等级显示使用单一数据源
系统 SHALL 将当前 `state.stations[].grade` 作为全网站车站商业等级显示、筛选、统计和编辑的单一数据源。任何页面或模块 MUST NOT 使用独立硬编码等级、副本等级字段或 `gradeInfo.desc` 来决定某个车站当前属于 S/A/B/C 哪一档。

#### Scenario: 主作战图跟随当前等级
- **WHEN** 任一站点的 `state.stations[].grade` 被保存为 `A`
- **THEN** 主作战图商业价值分级面板将该站点显示在 A 级名单
- **AND** 不再显示在保存前的旧等级名单

#### Scenario: 首页经营概览跟随当前等级
- **WHEN** 任一站点的 `state.stations[].grade` 被保存为 `S`
- **THEN** 首页站点表格、趋势详情和 S/A 重点站筛选均按 S 级处理该站点

#### Scenario: 商业信息管理页跟随当前等级
- **WHEN** 任一站点的 `state.stations[].grade` 被保存为 `C`
- **THEN** 商业信息管理页站点卡片、等级筛选、站点价值等级管理模块和图表回调均按 C 级处理该站点

#### Scenario: 等级编辑入口互相同步
- **WHEN** 用户通过单个站点卡片详情修改等级并保存
- **THEN** 站点价值等级管理模块显示保存后的等级
- **AND** 用户通过站点价值等级管理模块批量修改等级并保存后，单个站点卡片详情显示保存后的等级
