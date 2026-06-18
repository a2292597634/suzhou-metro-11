# Tasks: add-static-fallback-for-excel

## 1. 实现降级逻辑

- [x] 1.1 `exportExcel()` 添加 HEAD 探测 + `fallbackExport()`
- [x] 1.2 `downloadTemplate()` 添加 HEAD 探测 + `fallbackTemplate()`
- [x] 1.3 `importExcel()` 添加 catch 降级 + `fallbackImport()`

## 1.T 测试

- [ ] 1.T.1 编写 `tests/data.test.js` 降级测试：mock fetch 网络异常，验证导出走降级
- [ ] 1.T.2 运行测试确认通过

## 2. 验证

- [x] 2.1 `npm test` 全部通过 (314 tests)

---

## 测试检查清单

- [x] **测试策略已定义**
- [ ] **单元测试已编写** — 降级路径测试待补
- [x] **全部测试通过** — 314 tests passed
- [ ] **手动验证完成** — 静态部署环境待验证
