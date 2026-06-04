/**
 * 路由模块 —— 苏州地铁11号线商业信息综合平台
 * 提供简单页面路由管理、URL 查询参数同步、动画方向提示等功能
 * 无外部依赖，纯原生 JavaScript 实现
 */

/**
 * 路由配置表
 * key: 页面标识
 * path: 页面文件路径（多页应用跳转用）
 * title: 页面标题
 */
const ROUTES = {
  home:   { path: 'index.html', title: '首页' },
  data:   { path: 'data-viz.html',  title: '商业数据' },
  battle: { path: 'battle-map.html', title: '作战图' }
};

/**
 * 页面切换动画方向映射表
 * 定义从「来源页面」到「目标页面」的动画方向提示
 * 用于为页面切换提供视觉方向感
 */
const DIRECTION_MAP = {
  // home → data: 向右进入
  'home:data':   'right',
  // data → home: 向左返回
  'data:home':   'left',
  // data → battle: 向上进入
  'data:battle': 'up',
  // battle → data: 向下返回
  'battle:data': 'down',
  // home → battle: 向上进入
  'home:battle': 'up',
  // battle → home: 向下返回
  'battle:home': 'down'
};

/**
 * 当前页面标识
 */
let currentPage = '';

/**
 * 页面切换前的回调函数集合
 * 每个回调接收 { from, to, direction } 参数
 */
const beforeHooks = [];

/**
 * 页面切换后的回调函数集合
 * 每个回调接收 { from, to, direction } 参数
 */
const afterHooks = [];

/**
 * 从 URL 路径名中解析当前页面标识
 * @returns {string} 页面标识，如 'home'、'data'、'battle'
 */
function resolvePageFromPath() {
  const path = window.location.pathname;
  const filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';

  if (filename === 'index.html' || filename === '') return 'home';
  if (filename === 'data-viz.html') return 'data';
  if (filename === 'battle-map.html') return 'battle';

  // 兜底推断
  if (filename.startsWith('data')) return 'data';
  if (filename.startsWith('battle')) return 'battle';

  return 'home';
}

/**
 * 从 URL 查询参数中读取页面标识
 * @returns {string|null} 页面标识，若不存在则返回 null
 */
function resolvePageFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const page = params.get('page');
  if (page && ROUTES[page]) {
    return page;
  }
  return null;
}

/**
 * 获取页面切换的动画方向
 * @param {string} fromPage 来源页面
 * @param {string} toPage 目标页面
 * @returns {string} 方向标识：'right'、'left'、'up'、'down'、'none'
 */
function getDirection(fromPage, toPage) {
  if (fromPage === toPage) return 'none';
  const key = `${fromPage}:${toPage}`;
  return DIRECTION_MAP[key] || 'none';
}

/**
 * 同步当前页面状态到 URL 查询参数
 * 使用 history.pushState 实现无刷新 URL 更新
 * @param {string} page 当前页面标识
 */
function syncUrlParams(page) {
  const url = new URL(window.location.href);
  url.searchParams.set('page', page);
  // 保留其他查询参数，仅更新 page
  window.history.pushState({ page }, '', url.toString());
}

/**
 * 触发页面切换前的钩子函数
 * @param {string} from 来源页面
 * @param {string} to 目标页面
 * @param {string} direction 动画方向
 * @returns {boolean} 若任一钩子返回 false，则阻止切换
 */
function runBeforeHooks(from, to, direction) {
  for (const hook of beforeHooks) {
    const result = hook({ from, to, direction });
    if (result === false) {
      return false;
    }
  }
  return true;
}

/**
 * 触发页面切换后的钩子函数
 * @param {string} from 来源页面
 * @param {string} to 目标页面
 * @param {string} direction 动画方向
 */
function runAfterHooks(from, to, direction) {
  afterHooks.forEach(hook => hook({ from, to, direction }));
}

/**
 * 注册页面切换前的钩子
 * @param {Function} callback 回调函数，接收 { from, to, direction }
 */
export function beforeEach(callback) {
  beforeHooks.push(callback);
}

/**
 * 注册页面切换后的钩子
 * @param {Function} callback 回调函数，接收 { from, to, direction }
 */
export function afterEach(callback) {
  afterHooks.push(callback);
}

/**
 * 程序式导航到指定页面
 * 支持多页应用跳转（直接 location.href）和动画方向提示
 * @param {string} page 目标页面标识
 * @param {Object} [options] 可选配置
 * @param {boolean} [options.replace=false] 是否使用 replaceState 而非 pushState
 * @param {boolean} [options.skipHistory=false] 是否跳过 URL 更新
 */
export function navigateTo(page, options = {}) {
  const targetRoute = ROUTES[page];
  if (!targetRoute) {
    console.warn(`[router] 未知页面: ${page}`);
    return;
  }

  const fromPage = currentPage;
  const direction = getDirection(fromPage, page);

  // 执行前置钩子，若返回 false 则阻止导航
  if (!runBeforeHooks(fromPage, page, direction)) {
    return;
  }

  // 更新当前页面标识
  currentPage = page;

  // 同步 URL 查询参数
  if (!options.skipHistory) {
    if (options.replace) {
      const url = new URL(window.location.href);
      url.searchParams.set('page', page);
      window.history.replaceState({ page }, '', url.toString());
    } else {
      syncUrlParams(page);
    }
  }

  // 触发动画方向相关的自定义事件（供页面过渡动画使用）
  window.dispatchEvent(new CustomEvent('route:direction', {
    detail: { from: fromPage, to: page, direction }
  }));

  // 多页应用：执行页面跳转
  // 延迟一帧以确保事件和状态同步完成
  requestAnimationFrame(() => {
    window.location.href = targetRoute.path;
  });

  // 执行后置钩子
  runAfterHooks(fromPage, page, direction);
}

/**
 * 获取当前页面标识
 * @returns {string} 当前页面标识
 */
export function getCurrentPage() {
  return currentPage;
}

/**
 * 获取页面切换的动画方向（供外部查询）
 * @param {string} fromPage 来源页面
 * @param {string} toPage 目标页面
 * @returns {string} 方向标识
 */
export function getTransitionDirection(fromPage, toPage) {
  return getDirection(fromPage, toPage);
}

/**
 * 初始化路由模块
 * 检测当前页面、读取 URL 参数、设置 popstate 监听、触发回调
 * @param {Object} [options] 可选配置
 * @param {Function} [options.onPageChange] 页面变化时的回调函数，接收 { from, to, direction }
 */
export function initRouter(options = {}) {
  // 1. 从 URL 路径解析当前页面
  const pathPage = resolvePageFromPath();

  // 2. 从 URL 查询参数读取页面（若与路径不一致，以路径为准，但可触发回调）
  const queryPage = resolvePageFromQuery();

  // 初始化当前页面
  currentPage = pathPage;

  // 3. 若 URL 中无 page 参数，自动同步
  if (!queryPage) {
    syncUrlParams(currentPage);
  }

  // 4. 监听浏览器前进/后退按钮（popstate）
  window.addEventListener('popstate', (event) => {
    const newPage = (event.state && event.state.page) || resolvePageFromQuery() || resolvePageFromPath();
    if (newPage && newPage !== currentPage && ROUTES[newPage]) {
      const direction = getDirection(currentPage, newPage);

      if (runBeforeHooks(currentPage, newPage, direction)) {
        const fromPage = currentPage;
        currentPage = newPage;

        window.dispatchEvent(new CustomEvent('route:direction', {
          detail: { from: fromPage, to: newPage, direction }
        }));

        if (options.onPageChange) {
          options.onPageChange({ from: fromPage, to: newPage, direction });
        }

        runAfterHooks(fromPage, newPage, direction);
      }
    }
  });

  // 5. 页面加载完成后触发初始回调
  if (options.onPageChange) {
    // 延迟执行，确保页面其他模块已初始化
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        options.onPageChange({
          from: '',
          to: currentPage,
          direction: 'none'
        });
      });
    } else {
      options.onPageChange({
        from: '',
        to: currentPage,
        direction: 'none'
      });
    }
  }

  // 6. 将路由实例挂载到全局，方便内联事件调用
  // 注意：仅在 window 上暴露 navigateTo，不暴露内部状态
  if (typeof window !== 'undefined') {
    window.router = {
      navigateTo,
      getCurrentPage,
      getTransitionDirection,
      beforeEach,
      afterEach
    };
  }
}
