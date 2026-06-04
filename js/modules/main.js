/**
 * 主入口 — 模块组装、初始化、全局 app 对象
 */

import { state } from './state.js';
import * as data from './data.js';
import * as render from './render.js';
import * as viewport from './viewport.js';
import * as interaction from './interaction.js';

// 全局 app 对象（供 HTML onclick 调用）
window.app = {
  saveNow: async () => {
    const result = await data.saveData();
    if (result.source === 'server') {
      interaction.showToast('💾 数据已保存到服务器');
    } else {
      interaction.showToast('💾 数据已保存到本地（服务器不可用）');
    }
  },

  exportExcel: () => {
    data.exportExcel();
    interaction.showToast('📥 Excel 已导出');
  },

  importExcel: (input) => {
    if (input.files && input.files[0]) {
      data.importExcel(input, () => {
        data.calcGlobalStats();
        render.renderAll();
        data.saveData();
        interaction.showToast('📤 Excel 导入成功');
      }, (msg) => {
        interaction.showToast(msg, 'error');
      });
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
    interaction.saveStationEdit(() => {
      data.calcGlobalStats();
      render.renderAll();
      bindEventsAfterRender();
      data.saveData();
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
        const displayVal = val.trim() !== '' ? val : '      ';
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

// 初始化
async function init() {
  // 初始化导航和路由（如可用，兼容旧页面）
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

  // 设置全局事件监听
  interaction.setupEventListeners((input) => {
    data.importExcel(input, () => {
      data.calcGlobalStats();
      render.renderAll();
      bindEventsAfterRender();
      data.saveData();
      interaction.showToast('📤 Excel 导入成功');
    }, (msg) => {
      interaction.showToast(msg, 'error');
    });
  });

  viewport.initViewport();
}

// 启动（module script 默认 deferred，DOM 已 ready；但为安全起见做判断）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
