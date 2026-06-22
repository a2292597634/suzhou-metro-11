/**
 * 数据管理 — 站点数据、全局统计、加载/保存、导入导出
 */

import { state } from './state.js';
import { config, calcRate, normalizeGrade } from './utils.js';

const DEFAULT_STATION_GRADES = {
  weiting: 'B',
  caoxieshan: 'C',
  yangchenghudong: 'C',
  zhengyi: 'B',
  lianhuagongyuan: 'B',
  zuchongzhi: 'A',
  kunshanwenhua: 'B',
  gongqing: 'B',
  jiangpu: 'A',
  baimajing: 'A',
  yushanguangchang: 'A',
  xiuyi: 'A',
  kunshanchengshi: 'B',
  jinpudaqiao: 'B',
  shunfanbei: 'C',
  yuchijing: 'C',
  baihetan: 'A',
  bingxi: 'A',
  xiajiahe: 'C',
  shengzhuang: 'C',
  zhangjilu: 'C',
  xiaqiao: 'C',
  shentongjing: 'B',
  lujia: 'B',
  huaqiaobolan: 'A',
  jishan: 'B',
  huaxigongyuan: 'C',
  huaqiao: 'S'
};

function applyDefaultStationGrades(stations) {
  return stations.map(station => ({
    ...station,
    grade: normalizeGrade(DEFAULT_STATION_GRADES[station.id] || station.grade)
  }));
}

// 默认站点数据（坐标、等级、商铺列表）
export function getDefaultStations() {
  const stations = [
    { id: 'weiting', name: '唯亭站', grade: 'C',
      shops: [{ no: 1, shortNo: 'S11-1', name: 'A商铺', type: '商铺', area: 18.69, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
      x: 80, y: 480, pos: 'top', transfer: false },
    { id: 'caoxieshan', name: '草鞋山站', grade: 'C',
      shops: [{ no: 2, shortNo: 'S11-2', name: 'A商铺（2号出口）', type: '商铺', area: 13.88, tenant: '无人便利店', contact: '', openDate: '', status: '营业中', remark: '' }, { no: 3, shortNo: 'S11-3', name: 'B商铺（4号出口）', type: '商铺', area: 24.38, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
      x: 170, y: 480, pos: 'bottom', transfer: false },
    { id: 'yangchenghudong', name: '阳澄湖东站', grade: 'A',
      shops: [{ no: 4, shortNo: 'S11-4', name: 'A商铺（3号出口）', type: '商铺', area: 25.72, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
      { no: 5, shortNo: 'S11-5', name: 'B1商铺（4号出口）', type: '商铺', area: 11.85, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
      { no: 6, shortNo: 'S11-6', name: 'B2商铺（4号出口）', type: '商铺', area: 15.4, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
      x: 260, y: 480, pos: 'top', transfer: false },
    { id: 'zhengyi', name: '正仪站', grade: 'B',
      shops: [{ no: 7, shortNo: 'S11-7', name: 'A商铺（3号出口）', type: '商铺', area: 20.46, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }, { no: 8, shortNo: 'S11-8', name: 'B商铺（4号出口）', type: '商铺', area: 20.66, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
      x: 350, y: 480, pos: 'bottom', transfer: false },
    { id: 'lianhuagongyuan', name: '莲湖公园站', grade: 'A',
      shops: [{ no: 9, shortNo: 'S11-9', name: 'A商铺（2号出口）', type: '商铺', area: 15.14, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
      { no: 10, shortNo: 'S11-10', name: 'B商铺（3号出口）', type: '商铺', area: 11.85, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
      { no: 11, shortNo: 'S11-11', name: 'C商铺（4号出口）', type: '商铺', area: 13.4, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
      x: 440, y: 480, pos: 'top', transfer: false },
    { id: 'zuchongzhi', name: '祖冲之公园站', grade: 'C',
      shops: [{ no: 12, shortNo: 'S11-12', name: 'A商铺（3号出口）', type: '商铺', area: 14.69, tenant: '无人便利店', contact: '', openDate: '', status: '营业中', remark: '' },
      { no: 13, shortNo: 'S11-13', name: 'B商铺（4号出口）', type: '商铺', area: 19.11, tenant: '牙博士口腔', contact: '', openDate: '', status: '营业中', remark: '' },
      { no: 14, shortNo: '待定', name: '多经点位1', type: '多经点位', area: 17.28, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
      { no: 15, shortNo: '待定', name: '多经点位2', type: '多经点位', area: 17.28, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
      x: 530, y: 480, pos: 'bottom', transfer: false },
    { id: 'kunshanwenhua', name: '昆山文化艺术中心站', grade: 'S',
      shops: [{ no: 16, shortNo: 'S11-14', name: 'A商铺（3号出口）', type: '商铺', area: 29.23, tenant: '昆山有礼', contact: '', openDate: '', status: '营业中', remark: '' }, { no: 17, shortNo: 'S11-15', name: 'B商铺（4号出口）', type: '商铺', area: 28.27, tenant: '美汇口腔', contact: '', openDate: '', status: '营业中', remark: '' }],
      x: 620, y: 480, pos: 'top', transfer: false },
    { id: 'gongqing', name: '共青站', grade: 'B',
      shops: [{ no: 18, shortNo: 'S11-16', name: 'A商铺（1号出口）', type: '商铺', area: 14.63, tenant: '11号咖啡店', contact: '', openDate: '', status: '营业中', remark: '' }, { no: 19, shortNo: 'S11-17', name: 'B商铺（2号出口）', type: '商铺', area: 25.12, tenant: '美汇口腔', contact: '', openDate: '', status: '营业中', remark: '' }],
      x: 710, y: 480, pos: 'bottom', transfer: false },
    { id: 'jiangpu', name: '江浦站', grade: 'C',
      shops: [{ no: 20, shortNo: 'S11-18', name: 'A商铺（4号出口）', type: '商铺', area: 12.68, tenant: '牙博士口腔', contact: '', openDate: '', status: '营业中', remark: '' },
      { no: 21, shortNo: 'S11-19', name: 'A1商铺（4号出口）', type: '商铺', area: 13.04, tenant: '包一切馅饼', contact: '', openDate: '', status: '营业中', remark: '' },
      { no: 22, shortNo: 'S11-18-1', name: '多经点位', type: '多经点位', area: 7.44, tenant: '手机维修店', contact: '', openDate: '', status: '营业中', remark: '' }],
      x: 800, y: 480, pos: 'top', transfer: false },
    { id: 'baimajing', name: '白马泾路站', grade: 'B',
      shops: [{ no: 23, shortNo: 'S11-20', name: 'A商铺（1号出口）', type: '商铺', area: 28.8, tenant: '怀旧零食店', contact: '', openDate: '', status: '营业中', remark: '' }, { no: 24, shortNo: 'S11-21', name: 'B商铺（3号出口）', type: '商铺', area: 27.69, tenant: '有一家便利店', contact: '', openDate: '', status: '营业中', remark: '' }],
      x: 890, y: 480, pos: 'bottom', transfer: false },
    { id: 'yushanguangchang', name: '玉山广场站', grade: 'S',
      shops: [{ no: 25, shortNo: 'S11-22', name: 'A商铺（3号出口）', type: '商铺', area: 32.0, tenant: '11号便利店', contact: '', openDate: '', status: '营业中', remark: '' },
      { no: 26, shortNo: 'S11-23', name: 'B商铺（3号出口）', type: '商铺', area: 15.0, tenant: '11号咖啡店', contact: '', openDate: '', status: '营业中', remark: '' },
      { no: 27, shortNo: 'S11-24', name: 'C商铺（1号2号出口）', type: '商铺', area: 20.9, tenant: '包一切馅饼', contact: '', openDate: '', status: '营业中', remark: '' },
      { no: 28, shortNo: 'S11-18-2', name: '多经点位1', type: '多经点位', area: 15.12, tenant: '美汇口腔', contact: '', openDate: '', status: '营业中', remark: '' },
      { no: 29, shortNo: '待定', name: '多经点位2', type: '多经点位', area: 15.12, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
      x: 980, y: 480, pos: 'top', transfer: false },
    { id: 'xiuyi', name: '绣衣站', grade: 'B',
      shops: [{ no: 30, shortNo: 'S11-25', name: 'A商铺', type: '商铺', area: 17.5, tenant: '牙博士口腔', contact: '', openDate: '', status: '营业中', remark: '' }, { no: 31, shortNo: '待定', name: '多经点位', type: '多经点位', area: 18.9, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
      x: 1070, y: 480, pos: 'bottom', transfer: false },
    { id: 'kunshanchengshi', name: '昆山城市广场站', grade: 'S',
      shops: [{ no: 32, shortNo: 'S11-26', name: 'A商铺（1号出口）', type: '商铺', area: 13.72, tenant: '昆山有礼', contact: '', openDate: '', status: '营业中', remark: '' },
      { no: 33, shortNo: 'S11-27', name: 'B商铺（2号出口）', type: '商铺', area: 23.2, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
      { no: 34, shortNo: 'S11-28', name: 'C商铺（4号出口）', type: '商铺', area: 14.53, tenant: '无人便利店', contact: '', openDate: '', status: '营业中', remark: '' }],
      x: 1160, y: 480, pos: 'top', transfer: false },
    { id: 'jinpudaqiao', name: '金浦大桥东站', grade: 'A',
      shops: [{ no: 35, shortNo: 'S11-29', name: 'A商铺（1号出口）', type: '商铺', area: 14.04, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
      { no: 36, shortNo: 'S11-30', name: 'B商铺（3号出口）', type: '商铺', area: 12.74, tenant: '11号咖啡店', contact: '', openDate: '', status: '营业中', remark: '' },
      { no: 37, shortNo: 'S11-31', name: 'C商铺（2号出口）', type: '商铺', area: 10.88, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
      x: 1250, y: 480, pos: 'bottom', transfer: false },
    { id: 'shunfanbei', name: '顺帆北路站', grade: 'C',
      shops: [{ no: 38, shortNo: 'S11-32', name: 'A商铺（1号出口）', type: '商铺', area: 14.03, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }, { no: 39, shortNo: 'S11-33', name: 'B商铺（3号出口）', type: '商铺', area: 14.8, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
      x: 1340, y: 480, pos: 'top', transfer: false },
    { id: 'yuchijing', name: '鱼池泾站', grade: 'C',
      shops: [{ no: 40, shortNo: 'S11-34', name: 'A商铺（2号出口）', type: '商铺', area: 17.85, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }, { no: 41, shortNo: 'S11-35', name: 'B商铺（4号出口）', type: '商铺', area: 12.97, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
      x: 1430, y: 480, pos: 'bottom', transfer: false },
    { id: 'baihetan', name: '白河潭站', grade: 'C',
      shops: [{ no: 42, shortNo: 'S11-36', name: 'A商铺（1号出口）', type: '商铺', area: 24.8, tenant: '汇城房产', contact: '', openDate: '', status: '营业中', remark: '' },
      { no: 43, shortNo: 'S11-37', name: 'B商铺（3号出口）', type: '商铺', area: 21.09, tenant: '牙博士口腔', contact: '', openDate: '', status: '营业中', remark: '' },
      { no: 44, shortNo: '待定', name: '多经点位', type: '多经点位', area: 22.68, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
      x: 1520, y: 480, pos: 'top', transfer: false },
    { id: 'bingxi', name: '兵希站', grade: 'C',
      shops: [{ no: 45, shortNo: 'S11-38', name: 'A商铺（1号出口）', type: '商铺', area: 21.16, tenant: '全家便利店', contact: '', openDate: '', status: '营业中', remark: '' },
      { no: 46, shortNo: 'S11-39', name: 'A1商铺（1号出口）', type: '商铺', area: 16.65, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
      { no: 47, shortNo: 'S11-40', name: 'A2商铺（1号出口）', type: '商铺', area: 22.55, tenant: '咖啡店', contact: '', openDate: '', status: '营业中', remark: '' }],
      x: 1610, y: 480, pos: 'bottom', transfer: false },
    { id: 'xiajiahe', name: '夏驾河公园站', grade: 'B',
      shops: [{ no: 48, shortNo: 'S11-41', name: 'A商铺（1号出口）', type: '商铺', area: 29.86, tenant: '美宜佳超市', contact: '', openDate: '', status: '营业中', remark: '' }],
      x: 1700, y: 480, pos: 'top', transfer: false },
    { id: 'shengzhuang', name: '盛庄站', grade: 'C',
      shops: [{ no: 49, shortNo: 'S11-43', name: 'A商铺（3号出口）', type: '商铺', area: 13.53, tenant: '自习室', contact: '', openDate: '', status: '营业中', remark: '' }, { no: 50, shortNo: 'S11-44', name: 'B商铺（4号出口）', type: '商铺', area: 12.18, tenant: '自习室', contact: '', openDate: '', status: '营业中', remark: '' }],
      x: 1700, y: 580, pos: 'right', transfer: false },
    { id: 'zhangjilu', name: '章基路南站', grade: 'C',
      shops: [{ no: 51, shortNo: 'S11-45', name: 'A商铺（1号出口）', type: '商铺', area: 10.12, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }, { no: 52, shortNo: 'S11-46', name: 'B商铺（3号出口）', type: '商铺', area: 29.66, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
      x: 1700, y: 720, pos: 'left', transfer: false },
    { id: 'xiaqiao', name: '夏桥站', grade: 'C',
      shops: [{ no: 53, shortNo: 'S11-47', name: 'A商铺（1号出口）', type: '商铺', area: 12.75, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
      x: 1700, y: 780, pos: 'right', transfer: false },
    { id: 'shentongjing', name: '神童泾站', grade: 'B',
      shops: [{ no: 54, shortNo: 'S11-48', name: 'A商铺（3号出口）', type: '商铺', area: 19.46, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
      x: 1810, y: 800, pos: 'bottom', transfer: false },
    { id: 'lujia', name: '菉葭站', grade: 'C',
      shops: [{ no: 55, shortNo: 'S11-49', name: 'A商铺（1号出口）', type: '商铺', area: 18.36, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
      { no: 56, shortNo: 'S11-50', name: 'B商铺（3号出口）', type: '商铺', area: 23.74, tenant: '便利店', contact: '', openDate: '', status: '营业中', remark: '' },
      { no: 57, shortNo: 'S11-51', name: 'C商铺（5号出口）', type: '商铺', area: 18.21, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
      x: 1920, y: 820, pos: 'top', transfer: false },
    { id: 'huaqiaobolan', name: '花桥博览中心站', grade: 'A',
      shops: [{ no: 58, shortNo: 'S11-52', name: 'A商铺（1号出口）', type: '商铺', area: 11.2, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
      { no: 59, shortNo: 'S11-53', name: 'B商铺（2号出口）', type: '商铺', area: 14.98, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
      { no: 60, shortNo: 'S11-54', name: 'C商铺（3号出口）', type: '商铺', area: 12.57, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
      { no: 61, shortNo: 'S11-55', name: 'D商铺（4号出口）', type: '商铺', area: 16.59, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
      x: 2040, y: 840, pos: 'bottom', transfer: false },
    { id: 'jishan', name: '集善站', grade: 'C',
      shops: [{ no: 62, shortNo: 'S11-56', name: 'A商铺（1号出口)', type: '商铺', area: 17.01, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }, { no: 63, shortNo: 'S11-57', name: 'B商铺（2号出口)', type: '商铺', area: 15.67, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
      x: 2150, y: 840, pos: 'top', transfer: false },
    { id: 'huaxigongyuan', name: '花溪公园站', grade: 'B',
      shops: [{ no: 64, shortNo: 'S11-58', name: 'A商铺（1号出口）', type: '商铺', area: 14.88, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
      { no: 65, shortNo: 'S11-59', name: 'B商铺（2号出口）', type: '商铺', area: 24.64, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' },
      { no: 66, shortNo: 'S11-60', name: 'C商铺（3号出口）', type: '商铺', area: 24.64, tenant: '', contact: '', openDate: '', status: '未出租', remark: '' }],
      x: 2270, y: 840, pos: 'bottom', transfer: false },
    { id: 'huaqiao', name: '花桥站', grade: 'S',
      shops: [{ no: 67, shortNo: '待定', name: 'A号商铺', type: '商铺', area: 19.81, tenant: '蜜雪冰城', contact: '', openDate: '', status: '营业中', remark: '上海花桥站' },
      { no: 68, shortNo: '待定', name: 'B号商铺', type: '商铺', area: 27.14, tenant: '', contact: '', openDate: '', status: '装修中', remark: '上海花桥站' },
      { no: 69, shortNo: '待定', name: 'C号商铺', type: '商铺', area: 21.3, tenant: '全家', contact: '', openDate: '', status: '营业中', remark: '上海花桥站' },
      { no: 70, shortNo: '待定', name: 'D号商铺', type: '商铺', area: 34.14, tenant: '喜士多', contact: '', openDate: '', status: '营业中', remark: '上海花桥站' },
      { no: 71, shortNo: '待定', name: 'E号商铺', type: '商铺', area: 28.23, tenant: '', contact: '', openDate: '', status: '装修中', remark: '苏州花桥站' },
      { no: 72, shortNo: '待定', name: 'F号商铺', type: '商铺', area: 10.54, tenant: '苏燕记', contact: '', openDate: '', status: '营业中', remark: '苏州花桥站' },
      { no: 73, shortNo: '待定', name: 'G号商铺', type: '商铺', area: 14.09, tenant: '牙博士', contact: '', openDate: '', status: '营业中', remark: '苏州花桥站' }],
      x: 2380, y: 840, pos: 'top', transfer: true, transferLine: '上海11号线' },
  ];
  return applyDefaultStationGrades(stations);
}

export function getDefaultGlobalStats() {
  return {
    statsDate: '2024年5月20日',
    totalShops: 66,
    rentedShops: 33,
    vacantShops: 33,
    rentRate: '50.0%'
  };
}

// 计算全局统计（自动从站点商铺状态计算，多经点位不计入）
export function calcGlobalStats() {
  let total = 0, rented = 0, vacant = 0;
  state.stations.forEach(s => {
    (s.shops || []).forEach(shop => {
      if (shop.type === '多经点位') return;
      total++;
      if (shop.status === '营业中' || shop.status === '装修中') {
        rented++;
      } else {
        vacant++;
      }
    });
  });
  state.globalStats.totalShops = total;
  state.globalStats.rentedShops = rented;
  state.globalStats.vacantShops = vacant;
}

// 派发数据来源变更事件
function notifySource(source) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('datasource:change', { detail: { source } }));
  }
}

// 加载数据（后端API > localStorage > 默认）
export async function loadData() {
  // 先尝试从后端 API 加载
  try {
    const res = await fetch(`${state.apiBase}/api/data`);
    if (res.ok) {
      const result = await res.json();
      if (result.data) {
        const stations = result.data.stations;
        state.stations = (Array.isArray(stations) && stations.length > 0) ? stations : getDefaultStations();

        const globalStats = result.data.globalStats;
        state.globalStats = (globalStats && Object.keys(globalStats).length > 0) ? globalStats : getDefaultGlobalStats();

        const gradeInfo = result.data.gradeInfo;
        if (gradeInfo && Object.keys(gradeInfo).length > 0) state.gradeInfo = gradeInfo;

        console.log('✅ 已从服务器加载数据');
        notifySource('server');
        return { source: 'server' };
      }
    }
  } catch (e) {
    console.warn('服务器不可用，尝试本地存储', e);
  }

  // 回退到 localStorage
  try {
    const saved = localStorage.getItem(config.storageKey);
    if (saved) {
      const data = JSON.parse(saved);
      const stations = data.stations;
      state.stations = (Array.isArray(stations) && stations.length > 0) ? stations : getDefaultStations();

      const globalStats = data.globalStats;
      state.globalStats = (globalStats && Object.keys(globalStats).length > 0) ? globalStats : getDefaultGlobalStats();

      const gradeInfo = data.gradeInfo;
      if (gradeInfo && Object.keys(gradeInfo).length > 0) state.gradeInfo = gradeInfo;

      console.log('✅ 已从本地存储加载数据');
      notifySource('local');
      return { source: 'local' };
    }
  } catch (e) {
    console.warn('加载保存数据失败，使用默认数据', e);
  }

  // 尝试从 /data/default-data.json 加载默认数据
  try {
    const res = await fetch('/data/default-data.json');
    if (res.ok) {
      const defaultData = await res.json();
      state.stations = defaultData.stations || [];
      state.globalStats = defaultData.globalStats || getDefaultGlobalStats();
      if (defaultData.gradeInfo) state.gradeInfo = defaultData.gradeInfo;
      console.log('✅ 已从 JSON 文件加载默认数据');
      notifySource('default');
      return { source: 'default' };
    }
  } catch (e) {
    console.warn('JSON 默认数据加载失败，使用内联兜底', e);
  }

  // 内联兜底（最终降级）
  state.stations = getDefaultStations();
  state.globalStats = getDefaultGlobalStats();
  notifySource('default');
  return { source: 'default' };
}

// 登录 — 向服务端提交密码获取 HttpOnly Cookie
export async function login(password) {
  try {
    const res = await fetch(`${state.apiBase}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      state.isAuthenticated = true;
      return { success: true };
    }
    const body = await res.json().catch(() => ({}));
    return { success: false, error: body.error || '登录失败' };
  } catch (e) {
    return { success: false, error: '网络错误：无法连接到服务器' };
  }
}

// 检查认证状态
export async function checkAuth() {
  try {
    const res = await fetch(`${state.apiBase}/api/auth-status`, {
      credentials: 'include'
    });
    if (res.ok) {
      const body = await res.json();
      state.isAuthenticated = !!body.authenticated;
      return body.authenticated;
    }
  } catch (e) { /* 忽略 */ }
  return false;
}

// 保存到后端 API
export async function saveData() {
  const data = {
    stations: state.stations,
    globalStats: state.globalStats,
    gradeInfo: state.gradeInfo
  };

  // 先尝试保存到后端
  try {
    const res = await fetch(`${state.apiBase}/api/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ data })
    });

    if (res.ok) {
      const result = await res.json();
      // 更新前端各站点的版本号（乐观锁闭环）
      if (result.versions) {
        for (const [stationId, newVersion] of Object.entries(result.versions)) {
          const station = state.stations.find(s => s.id === stationId);
          if (station) {
            station.version = newVersion;
          }
        }
      }
      saveToLocal(data);
      notifySource('server');
      return { success: true, source: 'server' };
    }

    // 409 版本冲突 — 不退回 localStorage，提示用户刷新
    if (res.status === 409) {
      const body = await res.json().catch(() => ({}));
      return {
        success: false,
        source: 'server',
        conflict: true,
        error: body.detail || '数据已被他人修改，请刷新页面后重试',
        stationId: body.stationId
      };
    }

    // 401 未认证 — 提示登录
    if (res.status === 401) {
      return { success: false, source: 'server', needLogin: true, error: '请先登录后再保存' };
    }

    // 其他服务端错误
    const body = await res.json().catch(() => ({}));
    return { success: false, source: 'server', error: body.error || '服务器保存失败' };
  } catch (e) {
    console.warn('服务器保存失败，回退到本地', e);
  }

  // 回退到 localStorage（仅在网络不可达时）
  try {
    saveToLocal(data);
    notifySource('local');
    return { success: true, source: 'local' };
  } catch (e) {
    console.error('本地保存也失败', e);
    notifySource('local');
    return { success: false, source: 'local', error: e.message };
  }
}

// 保存到 localStorage
export function saveToLocal(data) {
  try {
    localStorage.setItem(config.storageKey, JSON.stringify({
      ...data,
      savedAt: new Date().toISOString()
    }));
  } catch (e) {
    console.error('本地保存失败', e);
    throw e;
  }
}

// 导出 Excel（优先服务端 blob 下载，不可用时降级到前端 SheetJS）
export async function exportExcel() {
  const url = `${state.apiBase}/api/export-excel`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      // 服务端可用，下载 blob
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `轨道交通11号线商铺信息表_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      return;
    }
  } catch (e) {
    // 网络不可达，降级
  }
  fallbackExport();
}

// 前端降级导出（SheetJS 浏览器端生成）
function fallbackExport() {
  const headers = ['车站', '简洁编号', '铺号', '类型', '面积(㎡)', '电量', '上下水', '状态', '商户', '备注'];
  const rows = [headers];

  state.stations.forEach(s => {
    (s.shops || []).forEach(shop => {
      rows.push([
        s.name, shop.shortNo || '', shop.name || '', shop.type || '商铺',
        shop.area || 0, shop.power || '', shop.water || '/',
        shop.status || '未出租', shop.tenant || '', shop.remark || ''
      ]);
    });
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, '商铺信息');
  XLSX.writeFile(wb, `轨道交通11号线商铺信息表_${new Date().toLocaleDateString()}.xlsx`);
}

// 下载空白模板（优先服务端 blob 下载，不可用时降级到前端 SheetJS）
export async function downloadTemplate() {
  const url = `${state.apiBase}/api/template-excel`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = '11号线商铺信息模板.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      return;
    }
  } catch (e) {
    // 降级
  }
  fallbackTemplate();
}

// 前端降级模板（SheetJS 浏览器端生成）
function fallbackTemplate() {
  const headers = ['车站', '简洁编号', '铺号', '类型', '面积(㎡)', '电量', '上下水', '状态', '商户', '备注'];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  XLSX.utils.book_append_sheet(wb, ws, '商铺信息');
  XLSX.writeFile(wb, '11号线商铺信息模板.xlsx');
}

// 导入 Excel（优先服务端 API，不可用时降级到前端 SheetJS）
export async function importExcel(input) {
  const file = input.files[0];
  if (!file) return { success: false, error: '未选择文件' };

  // 优先尝试服务端 API
  const formData = new FormData();
  formData.append('file', file);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${state.apiBase}/api/import-excel`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.status === 401) {
      return { success: false, needLogin: true, error: '请先登录后再导入' };
    }

    if (res.ok) {
      const result = await res.json();
      input.value = '';
      return { ...result, source: 'server' };
    }
  } catch (e) {
    // 网络不可达，降级
  }

  // 降级：前端 SheetJS 导入
  return await fallbackImport(input);
}

// 前端降级导入（SheetJS 解析 → 更新 state → 保存 localStorage）
function fallbackImport(input) {
  return new Promise((resolve) => {
    const file = input.files[0];
    if (!file) return resolve({ success: false, error: '未选择文件' });

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (json.length < 2) {
          input.value = '';
          return resolve({ success: false, error: 'Excel 文件为空或格式不正确' });
        }

        const shopsByStation = {};
        let currentStation = null;

        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          if (!row[1]) continue;

          const stationName = row[0] ? String(row[0]).trim() : currentStation;
          if (!stationName) continue;
          currentStation = stationName;

          if (!shopsByStation[stationName]) shopsByStation[stationName] = [];
          shopsByStation[stationName].push({
            shortNo: row[1] ? String(row[1]) : '',
            name: row[2] ? String(row[2]) : '',
            type: row[3] ? String(row[3]) : '商铺',
            area: parseFloat(row[4]) || 0,
            power: row[5] ? String(row[5]) : '',
            water: row[6] ? String(row[6]) : '/',
            status: row[7] ? String(row[7]) : '未出租',
            tenant: row[8] ? String(row[8]) : '',
            remark: row[9] ? String(row[9]) : ''
          });
        }

        let updated = 0;
        state.stations.forEach(s => {
          if (shopsByStation[s.name]) {
            s.shops = shopsByStation[s.name].map((shop, idx) => ({
              no: idx + 1, ...shop,
              contact: '', openDate: ''
            }));
            updated += s.shops.length;
          }
        });

        // 降级导入后保存到 localStorage，防止刷新丢失和 loadData 覆盖
        saveToLocal({ stations: state.stations, globalStats: state.globalStats, gradeInfo: state.gradeInfo });

        input.value = '';
        resolve({ success: true, source: 'local', summary: { created: 0, updated, skipped: 0, errors: 0 }, errors: [] });
      } catch (err) {
        input.value = '';
        resolve({ success: false, error: '导入失败：' + err.message });
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// 恢复默认
export function resetData(onComplete) {
  if (!confirm('确定要恢复默认数据吗？所有自定义修改将丢失！')) return;
  state.stations = getDefaultStations();
  state.globalStats = getDefaultGlobalStats();
  state.gradeInfo = {
    S: { name: 'S级（核心商圈/换乘）', desc: '', color: '#d4380d' },
    A: { name: 'A级（重点发展站）', desc: '', color: '#fa8c16' },
    B: { name: 'B级（潜力提升站）', desc: '', color: '#facc14' },
    C: { name: 'C级（培育优化站）', desc: '', color: '#52c41a' }
  };
  localStorage.removeItem(config.storageKey);
  if (onComplete) onComplete();
}
