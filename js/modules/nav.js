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
  home:   { label: '首页',   href: 'index.html' },
  data:   { label: '商业数据', href: 'data-viz.html' },
  battle: { label: '作战图',  href: 'battle-map.html' }
};

/**
 * 移动端底部标签栏配置
 * key: 页面标识
 * label: 标签文字（较顶部导航更简短）
 * icon: 内联 SVG 图标
 */
const BOTTOM_NAV_CONFIG = {
  home: {
    label: '首页',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
  },
  data: {
    label: '数据',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`
  },
  battle: {
    label: '作战图',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 21 18 21 2 16 6 8 2 1 6"/></svg>`
  }
};

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

  // 左侧品牌区 —— flex:1 让中间导航居中
  const brand = document.createElement('div');
  brand.className = 'topnav-brand';

  const logo = document.createElement('div');
  logo.className = 'topnav-logo';
  logo.textContent = '11';

  const title = document.createElement('span');
  title.className = 'topnav-title';
  title.textContent = '苏州地铁11号线商业信息综合平台';

  brand.appendChild(logo);
  brand.appendChild(title);

  // 中间导航链接区
  const links = document.createElement('div');
  links.className = 'topnav-links';

  Object.entries(PAGE_CONFIG).forEach(([key, config]) => {
    const link = document.createElement('a');
    link.className = 'nav-link';
    link.href = config.href;
    link.dataset.page = key;
    link.textContent = config.label;

    if (key === activePage) {
      link.classList.add('active');
    }

    links.appendChild(link);
  });

  // 右侧操作区 —— flex:1 与左侧对称，保持导航居中
  const actions = document.createElement('div');
  actions.className = 'topnav-actions';

  // 添加一个刷新按钮（简洁图标）
  const refreshBtn = document.createElement('button');
  refreshBtn.className = 'nav-link';
  refreshBtn.title = '刷新数据';
  refreshBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>`;
  refreshBtn.addEventListener('click', () => {
    window.location.reload();
  });
  actions.appendChild(refreshBtn);

  inner.appendChild(brand);
  inner.appendChild(links);
  inner.appendChild(actions);
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
  // 若未传入 activePage，则从 URL 自动推断
  const currentPage = activePage || detectActivePage();

  // 注入顶部导航栏（桌面端显示，移动端通过 CSS 隐藏）
  const topNav = createTopNav(currentPage);
  document.body.prepend(topNav);

  // 注入底部标签栏（移动端显示，桌面端通过 CSS 隐藏）
  const bottomNav = createBottomNav(currentPage);
  document.body.appendChild(bottomNav);

  // 监听窗口大小变化，确保导航栏显示状态正确（CSS media query 已处理，此处为增强兼容性）
  // 若页面使用了 SPA 路由，可通过事件通知 nav 模块更新高亮状态
  document.addEventListener('nav:update', (e) => {
    if (e.detail && e.detail.page) {
      updateActiveState(e.detail.page);
    }
  });

  // 滚动时给导航栏添加阴影
  const navEl = topNav;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        navEl.classList.toggle('scrolled', window.scrollY > 4);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/**
 * 更新导航栏的激活状态（适用于 SPA 场景）
 * @param {string} page 新的激活页面标识
 */
export function updateActiveState(page) {
  // 更新顶部导航链接
  document.querySelectorAll('.topnav .nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  // 更新底部标签栏
  document.querySelectorAll('.bottom-nav .bnav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });
}
