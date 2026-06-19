/**
 * SVG 图表引擎 — 商业信息管理图表
 * 纯 SVG 实现，零外部依赖，使用项目 CSS Token 配色
 *
 * 导出函数：
 *   renderBarChart(stations, options)  — 出租率柱状图
 *   renderDonutChart(gradeCount, options) — 分级占比环形图
 *   renderStatusChart(stations, options) — 经营状态分布图
 */

import { normalizeGrade } from './utils.js';

// ============================================
// 颜色工具
// ============================================

/** 从 CSS 自定义属性读取颜色，读取失败时使用默认值 */
function getCSSColor(propName, fallback) {
  try {
    if (typeof document !== 'undefined' && document.documentElement) {
      const val = getComputedStyle(document.documentElement).getPropertyValue(propName).trim();
      if (val) return val;
    }
  } catch (e) { /* 忽略 */ }
  return fallback;
}

// 颜色常量（与 DESIGN.md 和 platform.css 一致）
const COLORS = {
  freshGreen: '#16a34a',
  warmOrange: '#ea580c',
  accentBlue: '#3b82f6',
  red: '#ef4444',
  gradeS: '#d4380d',
  gradeA: '#fa8c16',
  gradeB: '#facc14',
  gradeC: '#52c41a',
  borderLight: '#e5e5e5',
  inkBlack: '#0a0a0a',
  subtleAsh: '#f5f5f5',
  canvasWhite: '#ffffff'
};

// ============================================
// 通用 SVG 工具
// ============================================

/** 创建 SVG 文本元素 */
function svgText(x, y, text, { fontSize = 12, fill = COLORS.inkBlack, anchor = 'middle', transform = '' } = {}) {
  const t = transform ? ` transform="${transform}"` : '';
  return `<text x="${x}" y="${y}" font-size="${fontSize}" fill="${fill}" text-anchor="${anchor}" font-family="Inter, sans-serif"${t}>${escapeXml(text)}</text>`;
}

/** 转义 XML 特殊字符 */
function escapeXml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** 空数据占位 */
function emptyState(text, width, height) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <text x="${width / 2}" y="${height / 2}" font-size="14" fill="${COLORS.inkBlack}" text-anchor="middle" font-family="Inter, sans-serif">${text}</text>
  </svg>`;
}

// ============================================
// 数据计算辅助
// ============================================

function calcRate(station) {
  const shops = (station.shops || []).filter(s => s.type !== '多经点位');
  if (!shops.length) return 0;
  const rented = shops.filter(s => s.status === '营业中').length;
  return Math.round((rented / shops.length) * 100);
}

function countByGrade(stations) {
  const count = { S: 0, A: 0, B: 0, C: 0 };
  stations.forEach(station => {
    count[normalizeGrade(station?.grade)]++;
  });
  return count;
}

// ============================================
// renderBarChart — 出租率柱状图
// ============================================

/**
 * 渲染出租率柱状图
 * @param {Array} stations 站点数组
 * @param {Object} [options] 可选配置
 * @param {number} [options.width=800] SVG 宽度
 * @param {number} [options.height=400] SVG 高度
 * @returns {string} SVG 字符串
 */
export function renderBarChart(stations, options = {}) {
  const width = options.width || 1100;
  const height = options.height || 480;

  if (!stations || !stations.length) {
    return emptyState('暂无数据', width, height);
  }

  const margin = { top: 44, right: 30, bottom: 90, left: 55 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const barWidth = Math.min(36, (chartW / stations.length) * 0.65);
  const gap = chartW / stations.length;

  // 颜色阈值
  function barColor(rate) {
    if (rate >= 70) return COLORS.freshGreen;
    if (rate >= 40) return COLORS.warmOrange;
    return COLORS.red;
  }

  // Y 轴刻度
  const yTicks = [0, 25, 50, 75, 100];

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">`;

  // 标题
  svg += svgText(width / 2, 26, '各站点出租率', { fontSize: 18, fill: COLORS.inkBlack });

  // 背景
  svg += `<rect x="${margin.left}" y="${margin.top}" width="${chartW}" height="${chartH}" fill="${COLORS.canvasWhite}" stroke="${COLORS.borderLight}" stroke-width="1"/>`;

  // Y 轴刻度线和标签
  yTicks.forEach(tick => {
    const y = margin.top + chartH - (tick / 100) * chartH;
    svg += `<line x1="${margin.left}" y1="${y}" x2="${margin.left + chartW}" y2="${y}" stroke="${COLORS.borderLight}" stroke-width="1" stroke-dasharray="4,4"/>`;
    svg += svgText(margin.left - 8, y + 5, `${tick}%`, { fontSize: 12, fill: COLORS.inkBlack, anchor: 'end' });
  });

  // 柱状图
  stations.forEach((station, i) => {
    const rate = calcRate(station);
    const barH = (rate / 100) * chartH;
    const x = margin.left + i * gap + (gap - barWidth) / 2;
    const y = margin.top + chartH - barH;
    const color = barColor(rate);

    // Tooltip 数据属性
    svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${Math.max(barH, 0.5)}" fill="${color}" rx="2" data-tooltip="${escapeXml(station.name)}：${rate}%"><title>${escapeXml(station.name)}：${rate}%</title></rect>`;

    // X 轴标签（旋转 45°）
    const labelX = margin.left + i * gap + gap / 2;
    svg += svgText(labelX, height - margin.bottom + 44, station.name, {
      fontSize: 11,
      fill: COLORS.inkBlack,
      anchor: 'end',
      transform: `rotate(-45, ${labelX}, ${height - margin.bottom + 44})`
    });
  });

  svg += '</svg>';
  return svg;
}

// ============================================
// renderDonutChart — 分级占比环形图
// ============================================

/**
 * 渲染分级占比环形图
 * @param {Object} gradeCount 分级数量，如 { S: 3, A: 5, B: 7, C: 13 }
 * @param {Object} [options] 可选配置
 * @param {number} [options.size=300] SVG 尺寸
 * @returns {string} SVG 字符串
 */
export function renderDonutChart(gradeCount, options = {}) {
  const size = options.size || 300;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.38;
  const innerR = outerR * 0.6; // 中心镂空

  const entries = Object.entries(gradeCount).filter(([, count]) => count > 0);
  if (!entries.length) {
    return emptyState('暂无数据', size, size);
  }

  const total = entries.reduce((sum, [, c]) => sum + c, 0);
  const gradeColors = { S: COLORS.gradeS, A: COLORS.gradeA, B: COLORS.gradeB, C: COLORS.gradeC };

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="100%" height="100%">`;

  // 标题
  svg += svgText(cx, 22, '站点等级分布', { fontSize: 14, fill: COLORS.inkBlack });

  let startAngle = -Math.PI / 2; // 从顶部开始

  entries.forEach(([grade, count]) => {
    const sliceAngle = (count / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;

    // 计算弧线路径
    const x1 = cx + outerR * Math.cos(startAngle);
    const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle);
    const y2 = cy + outerR * Math.sin(endAngle);
    const x3 = cx + innerR * Math.cos(endAngle);
    const y3 = cy + innerR * Math.sin(endAngle);
    const x4 = cx + innerR * Math.cos(startAngle);
    const y4 = cy + innerR * Math.sin(startAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    const color = gradeColors[grade] || COLORS.inkBlack;

    // 外弧 + 内弧（反向）
    const path = `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;

    svg += `<path d="${path}" fill="${color}" stroke="${COLORS.canvasWhite}" stroke-width="1.5">
      <title>${grade}级：${count}个站点（${Math.round(count / total * 100)}%）</title>
    </path>`;

    // 标签（在扇区中间角度）
    const midAngle = startAngle + sliceAngle / 2;
    const labelR = outerR * 1.35;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);
    const pct = Math.round(count / total * 100);
    svg += svgText(lx, ly, `${grade}级 ${count}个(${pct}%)`, { fontSize: 10, fill: COLORS.inkBlack, anchor: midAngle > Math.PI / 2 && midAngle < 3 * Math.PI / 2 ? 'end' : 'start' });

    startAngle = endAngle;
  });

  // 中心文字
  svg += svgText(cx, cy - 6, total, { fontSize: 28, fill: COLORS.inkBlack });
  svg += svgText(cx, cy + 16, '个站点', { fontSize: 11, fill: COLORS.inkBlack });

  svg += '</svg>';
  return svg;
}

// ============================================
// renderStatusChart — 经营状态分布图
// ============================================

/**
 * 渲染经营状态分组柱状图
 * @param {Array} stations 站点数组
 * @param {Object} [options] 可选配置
 * @param {number} [options.width=800] SVG 宽度
 * @param {number} [options.height=400] SVG 高度
 * @param {number} [options.maxStations=28] 最大显示站点数（移动端限制用）
 * @returns {string} SVG 字符串
 */
export function renderStatusChart(stations, options = {}) {
  const width = options.width || 1100;
  const height = options.height || 480;
  const maxStations = options.maxStations || stations.length;

  if (!stations || !stations.length) {
    return emptyState('暂无数据', width, height);
  }

  const displayStations = stations.slice(0, maxStations);

  const margin = { top: 44, right: 30, bottom: 90, left: 55 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const statusColors = {
    '营业中': COLORS.freshGreen,
    '未出租': COLORS.red,
    '装修中': COLORS.warmOrange
  };
  const statuses = ['营业中', '未出租', '装修中'];

  const groupWidth = chartW / displayStations.length;
  const barW = Math.max(4, (groupWidth * 0.6) / 3);

  // 计算 Y 轴最大值
  let maxCount = 0;
  displayStations.forEach(station => {
    const shops = (station.shops || []).filter(s => s.type !== '多经点位');
    statuses.forEach(status => {
      const count = shops.filter(s => s.status === status).length;
      if (count > maxCount) maxCount = count;
    });
  });
  maxCount = Math.max(maxCount, 1);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">`;

  // 标题
  svg += svgText(width / 2, 26, '各站点经营状态分布', { fontSize: 18, fill: COLORS.inkBlack });

  // 背景
  svg += `<rect x="${margin.left}" y="${margin.top}" width="${chartW}" height="${chartH}" fill="${COLORS.canvasWhite}" stroke="${COLORS.borderLight}" stroke-width="1"/>`;

  // Y 轴网格
  for (let i = 0; i <= maxCount; i++) {
    const y = margin.top + chartH - (i / maxCount) * chartH;
    svg += `<line x1="${margin.left}" y1="${y}" x2="${margin.left + chartW}" y2="${y}" stroke="${COLORS.borderLight}" stroke-width="1" stroke-dasharray="4,4"/>`;
    svg += svgText(margin.left - 8, y + 5, String(i), { fontSize: 12, fill: COLORS.inkBlack, anchor: 'end' });
  }

  // 分组柱状图
  displayStations.forEach((station, i) => {
    const shops = (station.shops || []).filter(s => s.type !== '多经点位');
    const groupX = margin.left + i * groupWidth;

    statuses.forEach((status, j) => {
      const count = shops.filter(s => s.status === status).length;
      const barH = (count / maxCount) * chartH;
      const x = groupX + groupWidth * 0.2 + j * barW;
      const y = margin.top + chartH - barH;

      svg += `<rect x="${x}" y="${y}" width="${barW}" height="${Math.max(barH, 0.5)}" fill="${statusColors[status]}" rx="1">
        <title>${escapeXml(station.name)} - ${status}：${count}个</title>
      </rect>`;
    });

    // X 轴标签
    const labelX = groupX + groupWidth / 2;
    svg += svgText(labelX, height - margin.bottom + 42, station.name, {
      fontSize: 11,
      fill: COLORS.inkBlack,
      anchor: 'end',
      transform: `rotate(-45, ${labelX}, ${height - margin.bottom + 42})`
    });
  });

  // 图例
  const legendY = height - 14;
  const legendX = width - 220;
  statuses.forEach((status, i) => {
    const lx = legendX + i * 72;
    svg += `<rect x="${lx}" y="${legendY - 10}" width="14" height="14" fill="${statusColors[status]}" rx="2"/>`;
    svg += svgText(lx + 18, legendY + 2, status, { fontSize: 12, fill: COLORS.inkBlack, anchor: 'start' });
  });

  svg += '</svg>';
  return svg;
}
