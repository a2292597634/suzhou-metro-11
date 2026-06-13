/**
 * 导航模块 —— 苏州地铁11号线商业信息综合平台
 * 提供顶部导航栏（桌面端）和底部标签栏（移动端）的注入与切换功能
 */

/**
 * 页面配置映射
 * key: 页面标识
 * label: 导航显示文字
 * href: 页面文件路径
 */
const PAGE_CONFIG = {
  home:   { label: '经营总览', href: 'index.html' },
  data:   { label: '商业分析', href: 'data-viz.html' },
  battle: { label: '线路资产', href: 'battle-map.html' }
};

const BRAND_CONFIG = {
  logo: 'assets/design/logo-concept-02-v1-160.png',
  title: '11号线商业信息综合平台',
  subtitle: '苏州轨道交通 · 商业资产与点位管理'
};

/**
 * 移动端底部标签栏配置
 * key: 页面标识
 * label: 标签文字（较顶部导航更简短）
 * icon: 内联 SVG 图标
 */
const BOTTOM_NAV_CONFIG = {
  home: {
    label: '总览',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
  },
  data: {
    label: '分析',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`
  },
  battle: {
    label: '资产',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 21 18 21 2 16 6 8 2 1 6"/></svg>`
  }
};

let cleanupNav = null;

/**
 * 根据 URL 路径自动检测当前页面标识
 * @returns {string} 页面标识，如 'home'、'data'、'battle'
 */
function detectActivePage() {
  const path = window.location.pathname;
  const filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';

  if (filename === 'index.html' || filename === '') return 'home';
  if (filename === 'data-viz.html') return 'data';
  if (filename === 'battle-map.html') return 'battle';

  // 兜底：尝试从文件名前缀推断
  if (filename.startsWith('data')) return 'data';
  if (filename.startsWith('battle')) return 'battle';
  return 'home';
}

function createBrand() {
  const brand = document.createElement('div');
  brand.className = 'topnav-brand';

  const logo = document.createElement('img');
  logo.className = 'topnav-logo';
  logo.src = BRAND_CONFIG.logo;
  logo.width = 40;
  logo.height = 40;
  logo.alt = '';

  const brandText = document.createElement('span');
  brandText.className = 'topnav-brand-text';

  const title = document.createElement('span');
  title.className = 'topnav-title';
  title.textContent = BRAND_CONFIG.title;

  const subtitle = document.createElement('span');
  subtitle.className = 'topnav-subtitle';
  subtitle.textContent = BRAND_CONFIG.subtitle;

  brandText.append(title, subtitle);
  brand.append(logo, brandText);
  return brand;
}

function createTopNavLinks(activePage) {
  const links = document.createElement('div');
  links.className = 'topnav-links';

  Object.entries(PAGE_CONFIG).forEach(([key, config]) => {
    const link = document.createElement('a');
    link.className = 'nav-link';
    link.href = config.href;
    link.dataset.page = key;
    link.textContent = config.label;
    const isActive = key === activePage;
    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    links.appendChild(link);
  });

  return links;
}

function createTopNavActions() {
  const actions = document.createElement('div');
  actions.className = 'topnav-actions';

  const refreshBtn = document.createElement('button');
  refreshBtn.className = 'nav-link';
  refreshBtn.type = 'button';
  refreshBtn.title = '刷新数据';
  refreshBtn.setAttribute('aria-label', '刷新数据');
  refreshBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>`;
  refreshBtn.addEventListener('click', () => window.location.reload());

  const sourceIndicator = document.createElement('span');
  sourceIndicator.id = 'datasource-indicator';
  sourceIndicator.className = 'datasource-badge';
  sourceIndicator.textContent = '检测中…';

  actions.append(refreshBtn, sourceIndicator);
  return actions;
}

/**
 * 创建顶部导航栏 DOM 元素
 * @param {string} activePage 当前激活的页面标识
 * @returns {HTMLElement} 顶部导航栏元素
 */
function createTopNav(activePage) {
  const nav = document.createElement('nav');
  nav.className = 'topnav';

  const inner = document.createElement('div');
  inner.className = 'topnav-inner';

  inner.append(
    createBrand(),
    createTopNavLinks(activePage),
    createTopNavActions()
  );
  nav.appendChild(inner);

  return nav;
}

/**
 * 创建移动端底部标签栏 DOM 元素
 * @param {string} activePage 当前激活的页面标识
 * @returns {HTMLElement} 底部标签栏元素
 */
function createBottomNav(activePage) {
  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';

  Object.entries(BOTTOM_NAV_CONFIG).forEach(([key, config]) => {
    const btn = document.createElement('button');
    btn.className = 'bnav-item';
    btn.dataset.page = key;

    if (key === activePage) {
      btn.classList.add('active');
      btn.setAttribute('aria-current', 'page');
    }

    // 图标
    const iconWrapper = document.createElement('span');
    iconWrapper.innerHTML = config.icon;

    // 文字
    const label = document.createElement('span');
    label.textContent = config.label;

    btn.appendChild(iconWrapper);
    btn.appendChild(label);

    // 点击跳转
    const pageConfig = PAGE_CONFIG[key];
    if (pageConfig) {
      btn.addEventListener('click', () => {
        window.location.href = pageConfig.href;
      });
    }

    nav.appendChild(btn);
  });

  return nav;
}

/**
 * 初始化导航模块
 * 根据当前设备宽度自动选择顶部导航栏或底部标签栏
 * @param {string} [activePage] 当前激活的页面标识，如未提供则自动从 URL 检测
 */
export function initNav(activePage) {
  if (cleanupNav) cleanupNav();
  document.querySelectorAll('.topnav, .bottom-nav').forEach(element => element.remove());

  // 若未传入 activePage，则从 URL 自动推断
  const currentPage = activePage || detectActivePage();

  // 注入顶部导航栏（桌面端显示，移动端通过 CSS 隐藏）
  const topNav = createTopNav(currentPage);
  document.body.prepend(topNav);

  // 注入底部标签栏（移动端显示，桌面端通过 CSS 隐藏）
  const bottomNav = createBottomNav(currentPage);
  document.body.appendChild(bottomNav);

  // 监听数据来源变更事件，自动更新指示器
  const handleDataSourceChange = (e) => {
    if (e.detail && e.detail.source) {
      updateDataSourceIndicator(e.detail.source);
    }
  };

  const handleNavUpdate = (e) => {
    if (e.detail && e.detail.page) {
      updateActiveState(e.detail.page);
    }
  };

  // 滚动时给导航栏添加阴影
  let ticking = false;
  let rafId = null;
  const handleScroll = () => {
    if (!ticking) {
      rafId = window.requestAnimationFrame(() => {
        topNav.classList.toggle('scrolled', window.scrollY > 4);
        ticking = false;
        rafId = null;
      });
      ticking = true;
    }
  };

  window.addEventListener('datasource:change', handleDataSourceChange);
  document.addEventListener('nav:update', handleNavUpdate);
  window.addEventListener('scroll', handleScroll, { passive: true });

  cleanupNav = () => {
    window.removeEventListener('datasource:change', handleDataSourceChange);
    document.removeEventListener('nav:update', handleNavUpdate);
    window.removeEventListener('scroll', handleScroll);
    if (rafId !== null) window.cancelAnimationFrame(rafId);
    topNav.remove();
    bottomNav.remove();
    cleanupNav = null;
  };
}

/**
 * 数据来源显示配置
 */
const SOURCE_LABELS = {
  server: { dot: '🟢', text: '服务器数据' },
  local:  { dot: '🟡', text: '本地缓存' },
  default:{ dot: '⚪', text: '演示数据' }
};

/**
 * 更新数据来源指示器
 * @param {string} source 数据来源：'server' | 'local' | 'default'
 */
function updateDataSourceIndicator(source) {
  const indicator = document.getElementById('datasource-indicator');
  if (!indicator) return;
  const info = SOURCE_LABELS[source] || SOURCE_LABELS.default;
  indicator.textContent = `${info.dot} ${info.text}`;
}

/**
 * 更新导航栏的激活状态（适用于 SPA 场景）
 * @param {string} page 新的激活页面标识
 */
export function updateActiveState(page) {
  // 更新顶部导航链接
  document.querySelectorAll('.topnav .nav-link').forEach(link => {
    const isActive = link.dataset.page === page;
    link.classList.toggle('active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  // 更新底部标签栏
  document.querySelectorAll('.bottom-nav .bnav-item').forEach(btn => {
    const isActive = btn.dataset.page === page;
    btn.classList.toggle('active', isActive);
    if (isActive) {
      btn.setAttribute('aria-current', 'page');
    } else {
      btn.removeAttribute('aria-current');
    }
  });
}
