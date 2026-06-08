/**
 * 共享状态 — 所有模块的中心数据源
 */

export const state = {
  // 画布配置
  config: {
    width: 2520,
    height: 1080,
    mainLineY: 480,
    storageKey: 'suzhou_m11_battle_map_data_v4'
  },

  // 商业价值分级
  gradeInfo: {
    S: { name: 'S级（核心商圈/换乘）', desc: '', color: '#d4380d' },
    A: { name: 'A级（重点发展站）', desc: '', color: '#fa8c16' },
    B: { name: 'B级（潜力提升站）', desc: '', color: '#facc14' },
    C: { name: 'C级（培育优化站）', desc: '', color: '#52c41a' }
  },

  // 站点数据
  stations: [],

  // 全局统计
  globalStats: {},

  // API 基础地址（优先从 HTML data-api-base 属性读取）
  apiBase: (typeof document !== 'undefined' && document.documentElement?.dataset?.apiBase) || '',

  // 视口状态
  viewport: {
    scale: 1,
    x: 0,
    y: 0,
    minScale: 0.3,
    maxScale: 3
  },

  // 拖动状态
  isDragging: false,
  dragStart: { x: 0, y: 0 },
  lastMouse: { x: 0, y: 0 },

  // 触控状态
  isTouchDragging: false,
  touchStart: { x: 0, y: 0 },
  lastTouchDistance: 0,
  touchMid: { x: 0, y: 0 },

  // 当前编辑的站点索引
  editingStationIdx: null
};
