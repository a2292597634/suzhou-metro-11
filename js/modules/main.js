/**
 * 主入口 — 模块组装、初始化、全局事件绑定
 */

import { state } from './state.js';
import * as data from './data.js';
import * as render from './render.js';
import * as viewport from './viewport.js';
import * as interaction from './interaction.js';

// 统一的保存处理——检查 needLogin 和 conflict
async function handleSave(context) {
  const result = await data.saveData();
  if (result.conflict) {
    interaction.showToast('⚠️ ' + result.error, 'error');
  } else if (result.needLogin) {
    const password = prompt('请输入管理密码：');
    if (password) {
      const loginResult = await data.login(password);
      if (loginResult.success) {
        interaction.showToast('✅ 登录成功，重新保存...');
        // 重试——不递归，直接调 saveData
        const retry = await data.saveData();
        if (retry.success) {
          interaction.showToast('💾 数据已保存到服务器');
        } else if (retry.conflict) {
          interaction.showToast('⚠️ ' + retry.error, 'error');
        } else {
          interaction.showToast('💾 数据已保存到本地', 'error');
        }
      } else {
        interaction.showToast('❌ ' + loginResult.error, 'error');
      }
    }
  } else if (result.source === 'server') {
    interaction.showToast('💾 数据已保存到服务器');
  } else {
    interaction.showToast('💾 数据已保存到本地（服务器不可用）');
  }
}

// 全局 app 对象
window.app = {
  saveNow: () => handleSave(),

  exportExcel: () => {
    data.exportExcel();
    interaction.showToast('📥 Excel 导出下载中...');
  },

  downloadTemplate: () => {
    data.downloadTemplate();
    interaction.showToast('📋 模板下载中...');
  },

  importExcel: async (input) => {
    if (input.files && input.files[0]) {
      const result = await data.importExcel(input);
      if (result.needLogin) {
        interaction.showToast('⚠️ ' + result.error, 'error');
      } else if (result.success) {
        // 重新加载数据以获取服务器端更新
        await data.loadData();
        data.calcGlobalStats();
        render.renderAll();
        bindEventsAfterRender();
        const s = result.summary;
        interaction.showToast(`📤 导入完成：新增 ${s.created} 条，更新 ${s.updated} 条` + (s.errors > 0 ? `，${s.errors} 条错误` : ''));
      } else {
        interaction.showToast('❌ ' + (result.error || '导入失败'), 'error');
      }
    }
  },

  resetData: () => {
    data.resetData(() => {
      data.calcGlobalStats();
      render.renderAll();
      bindEventsAfterRender();
      interaction.showToast('🔄 已恢复默认数据');
    });
  },

  printMap: () => interaction.printMap(),

  closeModal: () => interaction.closeModal(),

  saveStationEdit: () => {
    interaction.saveStationEdit(async () => {
      data.calcGlobalStats();
      render.renderAll();
      bindEventsAfterRender();
      await data.saveData();
      interaction.closeModal();
      interaction.showToast('✅ 站点数据已更新');
    });
  },

  zoomIn: () => viewport.zoomIn(),
  zoomOut: () => viewport.zoomOut(),

  resetViewport: () => {
    viewport.resetViewport();
    interaction.showToast('🔍 视图已重置');
  },

  showHDExportHelp: () => interaction.showHDExportHelp(),
  closeHDExportModal: () => interaction.closeHDExportModal(),

  addShopRow: () => interaction.addShopRow(),
  deleteShopRow: (btn) => interaction.deleteShopRow(btn)
};

// 渲染后绑定的事件（需要在 DOM 更新后执行）
function bindEventsAfterRender() {
  // 分级编辑监听
  document.querySelectorAll('.editable-grade').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const gradeKey = el.dataset.grade;
      const field = el.dataset.field;
      interaction.makeEditable(el, async (val) => {
        state.gradeInfo[gradeKey][field] = val;
        el.dataset.raw = val;
        const displayVal = val.trim() !== '' ? val : '      ';
        el.textContent = displayVal;
        await data.saveData();
        interaction.showToast('✅ 分级信息已更新');
      }, false, true);
    });
  });

  // 统计面板全局编辑监听
  document.querySelectorAll('.stats-panel .editable-num').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      interaction.makeEditable(el, async (val) => {
        const field = el.dataset.field;
        state.globalStats[field] = val === '' ? '' : (parseInt(val) || 0);
        render.renderAll();
        bindEventsAfterRender();
        await data.saveData();
      });
    });
  });

  document.querySelectorAll('.stats-panel .editable').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      interaction.makeEditable(el, async (val) => {
        const field = el.dataset.field;
        state.globalStats[field] = val;
        render.renderAll();
        bindEventsAfterRender();
        await data.saveData();
      }, false);
    });
  });

  // 站点卡片内数字编辑监听
  document.querySelectorAll('#stationsLayer .editable-num').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      interaction.makeEditable(el, async (val) => {
        const idx = parseInt(el.dataset.idx);
        const field = el.dataset.field;
        const numVal = parseInt(val) || 0;
        state.stations[idx][field] = numVal;
        data.calcGlobalStats();
        render.renderAll();
        bindEventsAfterRender();
        await data.saveData();
      });
    });
  });

  // 站点卡片双击打开编辑器（事件委托）
  const stationsLayer = document.getElementById('stationsLayer');
  if (stationsLayer) {
    stationsLayer.addEventListener('dblclick', (e) => {
      const card = e.target.closest('.station-card');
      if (!card) return;
      const idx = parseInt(card.dataset.idx);
      if (idx >= 0) interaction.openStationEditor(idx);
    });
  }
}

// 初始化全局按钮事件绑定（替代 onclick 属性）
function bindGlobalButtons() {
  const bind = (id, event, handler) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  };

  bind('btn-print', 'click', window.app.printMap);
  bind('btn-hd-export', 'click', window.app.showHDExportHelp);
  bind('btn-export-excel', 'click', window.app.exportExcel);
  bind('btn-download-template', 'click', window.app.downloadTemplate);
  bind('btn-import-excel', 'click', () => document.getElementById('importFile').click());
  bind('btn-reset', 'click', window.app.resetData);
  bind('btn-save', 'click', window.app.saveNow);
  bind('btn-modal-cancel', 'click', window.app.closeModal);
  bind('btn-modal-save', 'click', window.app.saveStationEdit);
  bind('btn-hd-close', 'click', window.app.closeHDExportModal);

  const overlay = document.getElementById('overlay');
  if (overlay) {
    overlay.addEventListener('click', () => {
      window.app.closeModal();
      window.app.closeHDExportModal();
    });
  }
}

// 初始化
async function init() {
  // 初始化导航和路由
  try {
    const { initNav } = await import('./nav.js');
    const { initRouter } = await import('./router.js');
    initNav('battle');
    initRouter();
  } catch (e) {
    console.log('导航模块未加载');
  }

  await data.loadData();
  data.calcGlobalStats();
  render.renderAll();
  bindEventsAfterRender();
  bindGlobalButtons();

  // 设置全局事件监听
  interaction.setupEventListeners(async (input) => {
    const result = await data.importExcel(input);
    if (result.needLogin) {
      interaction.showToast('⚠️ ' + result.error, 'error');
    } else if (result.success) {
      await data.loadData();
      data.calcGlobalStats();
      render.renderAll();
      bindEventsAfterRender();
      const s = result.summary;
      interaction.showToast(`📤 导入完成：新增 ${s.created} 条，更新 ${s.updated} 条` + (s.errors > 0 ? `，${s.errors} 条错误` : ''));
    } else {
      interaction.showToast('❌ ' + (result.error || '导入失败'), 'error');
    }
  });

  viewport.initViewport();
}

// 启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
