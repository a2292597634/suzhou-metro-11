/**
 * 视口控制 — 缩放、拖动、触控
 */

import { state } from './state.js';
import { config } from './utils.js';

/** 获取 #app 实际尺寸（兼容顶部导航栏占用空间的情况） */
export function getAppSize() {
  const app = document.getElementById('app');
  if (app) {
    const rect = app.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2
    };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    cx: window.innerWidth / 2,
    cy: window.innerHeight / 2
  };
}

export function applyTransform() {
  const map = document.querySelector('.battle-map');
  if (map) {
    map.style.transform = `translate(${state.viewport.x}px, ${state.viewport.y}px) scale(${state.viewport.scale})`;
  }
}

export function zoom(delta, screenX, screenY) {
  const factor = delta < 0 ? 1.1 : 0.9;
  const newScale = Math.max(state.viewport.minScale, Math.min(state.viewport.maxScale, state.viewport.scale * factor));

  const appSize = getAppSize();
  const relX = screenX - appSize.cx - state.viewport.x;
  const relY = screenY - appSize.cy - state.viewport.y;

  state.viewport.x += relX * (1 - newScale / state.viewport.scale);
  state.viewport.y += relY * (1 - newScale / state.viewport.scale);
  state.viewport.scale = newScale;

  applyTransform();
}

export function fitToScreen() {
  const appSize = getAppSize();
  const vw = appSize.width;
  const vh = appSize.height;
  const padding = 40;
  const scaleX = (vw - padding) / config.width;
  const scaleY = (vh - padding) / config.height;
  const newScale = Math.min(scaleX, scaleY, 1);

  const mapW = config.width * state.viewport.scale;
  const mapH = config.height * state.viewport.scale;
  const isOffScreen = Math.abs(state.viewport.x) > mapW / 2 + vw || Math.abs(state.viewport.y) > mapH / 2 + vh;

  if (state.viewport.scale > newScale * 1.5 || isOffScreen || state.viewport.scale < newScale * 0.5) {
    state.viewport.scale = newScale;
    state.viewport.x = 0;
    state.viewport.y = 0;
    applyTransform();
  }
}

export function resetViewport() {
  const appSize = getAppSize();
  const vw = appSize.width;
  const vh = appSize.height;
  const padding = 40;
  const scaleX = (vw - padding) / config.width;
  const scaleY = (vh - padding) / config.height;
  state.viewport.scale = Math.min(scaleX, scaleY, 1);
  state.viewport.x = 0;
  state.viewport.y = 0;
  applyTransform();
}

export function initViewport() {
  const appSize = getAppSize();
  const vw = appSize.width;
  const vh = appSize.height;
  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const padding = isMobile ? 10 : 60;
  const scaleX = (vw - padding) / config.width;
  const scaleY = (vh - padding) / config.height;
  state.viewport.scale = Math.min(scaleX, scaleY, 1);
  state.viewport.x = 0;
  state.viewport.y = 0;
  applyTransform();
  initViewportEvents();
  addViewportControls();
}

export function initViewportEvents() {
  const appEl = document.getElementById('app');
  if (!appEl) return;

  appEl.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    const rect = appEl.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    zoom(e.deltaY, cx, cy);
  }, { passive: false });

  appEl.addEventListener('mousedown', (e) => {
    if (e.button === 2) {
      state.isDragging = true;
      state.dragStart.x = e.clientX;
      state.dragStart.y = e.clientY;
      state.lastMouse.x = e.clientX;
      state.lastMouse.y = e.clientY;
      appEl.classList.add('dragging');
      e.preventDefault();
    }
  });

  appEl.addEventListener('mousemove', (e) => {
    if (!state.isDragging) return;
    const dx = e.clientX - state.lastMouse.x;
    const dy = e.clientY - state.lastMouse.y;
    state.viewport.x += dx;
    state.viewport.y += dy;
    state.lastMouse.x = e.clientX;
    state.lastMouse.y = e.clientY;
    applyTransform();
  });

  appEl.addEventListener('mouseup', () => {
    if (state.isDragging) {
      state.isDragging = false;
      appEl.classList.remove('dragging');
    }
  });

  appEl.addEventListener('mouseleave', () => {
    if (state.isDragging) {
      state.isDragging = false;
      appEl.classList.remove('dragging');
    }
  });

  appEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  appEl.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      state.isTouchDragging = true;
      state.touchStart.x = e.touches[0].clientX;
      state.touchStart.y = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      state.isTouchDragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      state.lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
      state.touchMid.x = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      state.touchMid.y = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    }
  }, { passive: false });

  appEl.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && state.isTouchDragging) {
      e.preventDefault();
      const dx = e.touches[0].clientX - state.touchStart.x;
      const dy = e.touches[0].clientY - state.touchStart.y;
      state.viewport.x += dx;
      state.viewport.y += dy;
      state.touchStart.x = e.touches[0].clientX;
      state.touchStart.y = e.touches[0].clientY;
      applyTransform();
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (state.lastTouchDistance > 0) {
        const delta = state.lastTouchDistance - distance;
        const rect = appEl.getBoundingClientRect();
        const cx = state.touchMid.x - rect.left;
        const cy = state.touchMid.y - rect.top;
        zoom(delta * 0.5, cx, cy);
      }
      state.lastTouchDistance = distance;
      state.touchMid.x = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      state.touchMid.y = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    }
  }, { passive: false });

  appEl.addEventListener('touchend', () => {
    state.isTouchDragging = false;
    state.lastTouchDistance = 0;
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      fitToScreen();
    }, 150);
  });
}

export function addViewportControls() {
  if (document.querySelector('.viewport-controls')) return;

  const controls = document.createElement('div');
  controls.className = 'viewport-controls';

  const zoomInBtn = document.createElement('button');
  zoomInBtn.className = 'viewport-btn';
  zoomInBtn.title = '放大';
  zoomInBtn.textContent = '+';
  zoomInBtn.addEventListener('click', zoomIn);

  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.className = 'viewport-btn';
  zoomOutBtn.title = '缩小';
  zoomOutBtn.textContent = '−';
  zoomOutBtn.addEventListener('click', zoomOut);

  const resetBtn = document.createElement('button');
  resetBtn.className = 'viewport-btn';
  resetBtn.title = '重置视图';
  resetBtn.textContent = '⟲';
  resetBtn.addEventListener('click', resetViewport);

  controls.appendChild(zoomInBtn);
  controls.appendChild(zoomOutBtn);
  controls.appendChild(resetBtn);
  document.body.appendChild(controls);
}

export function zoomIn() {
  const appSize = getAppSize();
  const cx = appSize.cx + state.viewport.x;
  const cy = appSize.cy + state.viewport.y;
  zoom(-1, cx, cy);
}

export function zoomOut() {
  const appSize = getAppSize();
  const cx = appSize.cx + state.viewport.x;
  const cy = appSize.cy + state.viewport.y;
  zoom(1, cx, cy);
}
