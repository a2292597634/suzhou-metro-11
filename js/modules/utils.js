/**
 * 工具函数 — 纯函数，无状态依赖
 */

// 画布配置（常量，各模块共享）
export const config = {
  width: 2520,
  height: 1080,
  mainLineY: 480,
  storageKey: 'suzhou_m11_battle_map_data_v4'
};

export const VALID_GRADES = ['S', 'A', 'B', 'C'];
const VALID_GRADE_SET = new Set(VALID_GRADES);

export function normalizeGrade(grade, fallback = 'C') {
  const normalized = String(grade || '').trim().toUpperCase();
  if (VALID_GRADE_SET.has(normalized)) return normalized;
  return VALID_GRADE_SET.has(fallback) ? fallback : 'C';
}

export function getGradeClass(grade, prefix = 'grade-') {
  const normalized = String(grade || '').trim().toUpperCase();
  if (!VALID_GRADE_SET.has(normalized)) return '';
  return `${prefix}${normalized}`;
}

export function groupStationsByGrade(stations) {
  const groups = Object.fromEntries(VALID_GRADES.map(grade => [grade, []]));
  (Array.isArray(stations) ? stations : []).forEach(station => {
    groups[normalizeGrade(station?.grade)].push(station);
  });
  return groups;
}

// 计算出租率（支持空值）
export function calcRate(total, rented) {
  if (total === '' || total === null || total === undefined || total === 0) return '';
  if (rented === '' || rented === null || rented === undefined) return '';
  const totalNum = parseInt(total) || 0;
  const rentedNum = parseInt(rented) || 0;
  if (totalNum === 0) return '';
  return ((rentedNum / totalNum) * 100).toFixed(1);
}

// HTML 转义（防止 XSS，用于文本内容上下文）
export function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  if (typeof text !== 'string') text = String(text);
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// HTML 属性转义（防止 XSS，用于 value="..." / data-*="..." 等属性上下文）
// 额外转义双引号和单引号，防止属性注入
export function escapeAttr(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// 动态避让：检测卡片重叠并微调位置
export function resolveCardOverlaps(cards) {
  const minGap = 4;
  const maxIter = 30;
  const maxShift = 50;

  for (let iter = 0; iter < maxIter; iter++) {
    let moved = false;

    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        const a = cards[i];
        const b = cards[j];

        const overlapLeft = Math.max(a.left, b.left);
        const overlapRight = Math.min(a.left + a.width, b.left + b.width);
        const overlapTop = Math.max(a.top, b.top);
        const overlapBottom = Math.min(a.top + a.height, b.top + b.height);

        if (overlapRight > overlapLeft && overlapBottom > overlapTop) {
          const overlapW = overlapRight - overlapLeft;
          const overlapH = overlapBottom - overlapTop;
          moved = true;

          const bothTop = a.pos === 'top' && b.pos === 'top';
          const bothBottom = a.pos === 'bottom' && b.pos === 'bottom';
          const bothRight = a.pos === 'right' && b.pos === 'right';
          const bothLeft = a.pos === 'left' && b.pos === 'left';
          const topBottom = (a.pos === 'top' && b.pos === 'bottom') || (a.pos === 'bottom' && b.pos === 'top');

          if (bothTop || bothBottom) {
            const half = (overlapW + minGap) / 2;
            a.left = Math.max(a.origLeft - maxShift, a.left - half);
            b.left = Math.min(b.origLeft + maxShift, b.left + half);
          } else if (bothRight || bothLeft) {
            const half = (overlapH + minGap) / 2;
            a.top = Math.max(a.origTop - maxShift, a.top - half);
            b.top = Math.min(b.origTop + maxShift, b.top + half);
          } else if (topBottom) {
            const half = (overlapH + minGap) / 2;
            if (a.pos === 'top') {
              a.top = Math.max(a.origTop - maxShift, a.top - half);
              b.top = Math.min(b.origTop + maxShift, b.top + half);
            } else {
              a.top = Math.min(a.origTop + maxShift, a.top + half);
              b.top = Math.max(b.origTop - maxShift, b.top - half);
            }
          } else {
            if (overlapW < overlapH) {
              const half = (overlapW + minGap) / 2;
              a.left = Math.max(a.origLeft - maxShift, Math.min(a.origLeft + maxShift, a.left - half));
              b.left = Math.max(b.origLeft - maxShift, Math.min(b.origLeft + maxShift, b.left + half));
            } else {
              const half = (overlapH + minGap) / 2;
              a.top = Math.max(a.origTop - maxShift, Math.min(a.origTop + maxShift, a.top - half));
              b.top = Math.max(b.origTop - maxShift, Math.min(b.origTop + maxShift, b.top + half));
            }
          }
        }
      }
    }

    if (!moved) break;
  }
}

// 线路边界保护：确保卡片不与垂直线路段重叠
export function enforceLineBoundaries(cards) {
  const VERT_X = 1700;
  const VERT_Y1 = 480;
  const VERT_Y2 = 780;
  const SAFE_GAP = 18;
  const MAX_SHIFT = 50;

  cards.forEach(card => {
    const cL = card.left;
    const cR = card.left + card.width;
    const cT = card.top;
    const cB = card.top + card.height;
    const cx = (cL + cR) / 2;

    if (cB <= VERT_Y1 || cT >= VERT_Y2) return;

    if (cx < VERT_X) {
      const maxRight = VERT_X - SAFE_GAP;
      if (cR > maxRight) {
        card.left = Math.max(card.origLeft - MAX_SHIFT, maxRight - card.width);
      }
    } else {
      const minLeft = VERT_X + SAFE_GAP;
      if (cL < minLeft) {
        card.left = Math.min(card.origLeft + MAX_SHIFT, minLeft);
      }
    }
  });
}
