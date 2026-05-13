/**
 * 苏州地铁11号线商业开发作战图
 * 核心逻辑：数据管理、渲染、编辑、保存、打印
 */

const BattleMap = {
  config: {
    width: 2520,
    height: 1080,
    mainLineY: 480,
    storageKey: 'suzhou_m11_battle_map_data_v2'
  },

  // 商业价值分级说明
  gradeInfo: {
    S: { name: 'S级（核心商圈/换乘）', desc: '', color: '#d4380d' },
    A: { name: 'A级（重点发展站）', desc: '', color: '#fa8c16' },
    B: { name: 'B级（潜力提升站）', desc: '', color: '#facc14' },
    C: { name: 'C级（培育优化站）', desc: '', color: '#52c41a' }
  },

  // 默认站点数据（坐标、等级、商铺列表）— 按苏州地铁官网11号线站点顺序
  getDefaultStations() {
    return [
      { id: 'weiting', name: '唯亭站', grade: 'C', shops: [{ no: 1, area: 18.69, tenant: '' }], x: 80, y: 480, pos: 'top', transfer: false },
      { id: 'caoxieshan', name: '草鞋山站', grade: 'C', shops: [{ no: 1, area: 24.38, tenant: '' }, { no: 2, area: 13.88, tenant: '' }], x: 160, y: 480, pos: 'bottom', transfer: false },
      { id: 'yangchenghudong', name: '阳澄湖东站', grade: 'A', shops: [{ no: 1, area: 11.85, tenant: '' }, { no: 2, area: 15.4, tenant: '' }, { no: 3, area: 25.72, tenant: '' }], x: 240, y: 480, pos: 'top', transfer: false },
      { id: 'zhengyi', name: '正仪站', grade: 'B', shops: [{ no: 1, area: 20.66, tenant: '' }, { no: 2, area: 20.46, tenant: '' }], x: 320, y: 480, pos: 'bottom', transfer: false },
      { id: 'lianhuagongyuan', name: '莲湖公园站', grade: 'A', shops: [{ no: 1, area: 13.4, tenant: '' }, { no: 2, area: 11.85, tenant: '' }, { no: 3, area: 15.14, tenant: '' }], x: 400, y: 480, pos: 'top', transfer: false },
      { id: 'zuchongzhi', name: '祖冲之公园站', grade: 'C', shops: [{ no: 1, area: 19.11, tenant: '' }, { no: 2, area: 14.69, tenant: '' }], x: 480, y: 480, pos: 'bottom', transfer: false },
      { id: 'kunshanwenhua', name: '昆山文化艺术中心站', grade: 'S', shops: [{ no: 1, area: 28.27, tenant: '' }, { no: 2, area: 29.23, tenant: '' }], x: 580, y: 480, pos: 'top', transfer: false },
      { id: 'gongqing', name: '共青站', grade: 'B', shops: [{ no: 1, area: 14.63, tenant: '' }, { no: 2, area: 25.12, tenant: '' }], x: 660, y: 480, pos: 'bottom', transfer: false },
      { id: 'jiangpu', name: '江浦站', grade: 'C', shops: [{ no: 1, area: 12.68, tenant: '' }, { no: 2, area: 13.04, tenant: '' }], x: 740, y: 480, pos: 'top', transfer: false },
      { id: 'baimajing', name: '白马泾路站', grade: 'B', shops: [{ no: 1, area: 28.8, tenant: '' }, { no: 2, area: 27.69, tenant: '' }], x: 820, y: 480, pos: 'bottom', transfer: false },
      { id: 'yushanguangchang', name: '玉山广场站', grade: 'S', shops: [{ no: 1, area: 14.2, tenant: '' }, { no: 2, area: 29.8, tenant: '' }, { no: 3, area: 22.3, tenant: '' }], x: 910, y: 480, pos: 'top', transfer: false },
      { id: 'xiuyi', name: '绣衣站', grade: 'B', shops: [{ no: 1, area: 17.5, tenant: '' }], x: 990, y: 480, pos: 'bottom', transfer: false },
      { id: 'kunshanchengshi', name: '昆山城市广场站', grade: 'S', shops: [{ no: 1, area: 14.53, tenant: '' }, { no: 2, area: 13.72, tenant: '' }, { no: 3, area: 23.2, tenant: '' }], x: 1070, y: 480, pos: 'top', transfer: false },
      { id: 'jinpudaqiao', name: '金浦大桥东站', grade: 'A', shops: [{ no: 1, area: 14.6, tenant: '' }, { no: 2, area: 13.16, tenant: '' }, { no: 3, area: 12.2, tenant: '' }], x: 1150, y: 480, pos: 'bottom', transfer: false },
      { id: 'shunfanbei', name: '顺帆北路站', grade: 'C', shops: [{ no: 1, area: 14.03, tenant: '' }, { no: 2, area: 14.8, tenant: '' }], x: 1230, y: 480, pos: 'top', transfer: false },
      { id: 'yuchijing', name: '鱼池泾站', grade: 'C', shops: [{ no: 1, area: 12.79, tenant: '' }, { no: 2, area: 17.85, tenant: '' }], x: 1310, y: 480, pos: 'bottom', transfer: false },
      { id: 'baihetan', name: '白河潭站', grade: 'C', shops: [{ no: 1, area: 21.09, tenant: '' }, { no: 2, area: 24.8, tenant: '' }], x: 1390, y: 480, pos: 'top', transfer: false },
      { id: 'bingxi', name: '兵希站', grade: 'C', shops: [{ no: 1, area: 21.16, tenant: '' }, { no: 2, area: 16.65, tenant: '' }, { no: 3, area: 22.55, tenant: '' }], x: 1470, y: 480, pos: 'bottom', transfer: false },
      { id: 'xiajiahe', name: '夏驾河公园站', grade: 'B', shops: [{ no: 1, area: 29.86, tenant: '' }, { no: 2, area: 29.95, tenant: '' }], x: 1560, y: 480, pos: 'top', transfer: false },
      { id: 'shengzhuang', name: '盛庄站', grade: 'C', shops: [{ no: 1, area: 13.53, tenant: '' }, { no: 2, area: 12.18, tenant: '' }], x: 1560, y: 580, pos: 'right', transfer: false },
      { id: 'zhangjilu', name: '章基路南站', grade: 'C', shops: [{ no: 1, area: 29.66, tenant: '' }, { no: 2, area: 10.12, tenant: '' }], x: 1560, y: 720, pos: 'left', transfer: false },
      { id: 'xiaqiao', name: '夏桥站', grade: 'C', shops: [{ no: 1, area: 12.75, tenant: '' }], x: 1560, y: 780, pos: 'bottom', transfer: false },
      { id: 'shentongjing', name: '神童泾站', grade: 'B', shops: [{ no: 1, area: 19.46, tenant: '' }], x: 1740, y: 813, pos: 'bottom', transfer: false },
      { id: 'lujia', name: '菉葭站', grade: 'C', shops: [{ no: 1, area: 18.21, tenant: '' }, { no: 2, area: 18.36, tenant: '' }, { no: 3, area: 23.74, tenant: '' }], x: 1780, y: 820, pos: 'top', transfer: false },
      { id: 'huaqiaobolan', name: '花桥博览中心站', grade: 'A', shops: [{ no: 1, area: 16.59, tenant: '' }, { no: 2, area: 11.2, tenant: '' }, { no: 3, area: 12.57, tenant: '' }, { no: 4, area: 14.98, tenant: '' }], x: 1900, y: 840, pos: 'bottom', transfer: false },
      { id: 'jishan', name: '集善站', grade: 'C', shops: [{ no: 1, area: 15.67, tenant: '' }, { no: 2, area: 17.01, tenant: '' }], x: 2060, y: 840, pos: 'top', transfer: false },
      { id: 'huaxigongyuan', name: '花溪公园站', grade: 'B', shops: [{ no: 1, area: 14.88, tenant: '' }, { no: 2, area: 24.64, tenant: '' }, { no: 3, area: 24.64, tenant: '' }], x: 2220, y: 840, pos: 'bottom', transfer: false },
      { id: 'huaqiao', name: '花桥站', grade: 'S', shops: [{ no: 1, area: 28.34, tenant: '' }, { no: 2, area: 10.54, tenant: '' }, { no: 3, area: 14.09, tenant: '' }], x: 2380, y: 840, pos: 'top', transfer: true, transferLine: '上海11号线' }
    ];
  },

  getDefaultGlobalStats() {
    return {
      statsDate: '2024年5月20日',
      totalShops: '',
      rentedShops: '',
      vacantShops: ''
    };
  },

  // 计算出租率（支持空值）
  calcRate() {
    const total = this.globalStats.totalShops;
    const rented = this.globalStats.rentedShops;
    if (total === '' || total === null || total === undefined || total === 0) return '';
    if (rented === '' || rented === null || rented === undefined) return '';
    const totalNum = parseInt(total) || 0;
    const rentedNum = parseInt(rented) || 0;
    if (totalNum === 0) return '';
    return ((rentedNum / totalNum) * 100).toFixed(1);
  },

  // 计算全局统计
  calcGlobalStats() {
    // 全局统计改为手动输入模式，不再自动计算
  },

  // 初始化
  init() {
    this.loadData();
    this.calcGlobalStats();
    this.render();
    this.setupEventListeners();
    this.initViewport();
  },

  // 加载数据（localStorage > 默认）
  loadData() {
    try {
      const saved = localStorage.getItem(this.config.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        this.stations = data.stations || this.getDefaultStations();
        this.globalStats = data.globalStats || this.getDefaultGlobalStats();
        if (data.gradeInfo) this.gradeInfo = data.gradeInfo;
        return;
      }
    } catch (e) {
      console.warn('加载保存数据失败，使用默认数据', e);
    }
    this.stations = this.getDefaultStations();
    this.globalStats = this.getDefaultGlobalStats();
  },

  // 保存到 localStorage
  saveData() {
    try {
      const data = {
        stations: this.stations,
        globalStats: this.globalStats,
        gradeInfo: this.gradeInfo,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
      this.showToast('💾 数据已保存到本地');
    } catch (e) {
      this.showToast('❌ 保存失败：' + e.message, 'error');
    }
  },

  // 导出 JSON
  exportData() {
    const data = {
      stations: this.stations,
      globalStats: this.globalStats,
      gradeInfo: this.gradeInfo,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `苏州地铁11号线商业作战图数据_${new Date().toLocaleDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('📥 数据已导出');
  },

  // 导入 JSON
  importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.stations && Array.isArray(data.stations)) {
          this.stations = data.stations;
          this.globalStats = data.globalStats || this.getDefaultGlobalStats();
          if (data.gradeInfo) this.gradeInfo = data.gradeInfo;
          this.calcGlobalStats();
          this.render();
          this.saveData();
          this.showToast('📤 数据导入成功');
        } else {
          throw new Error('数据格式不正确');
        }
      } catch (err) {
        this.showToast('❌ 导入失败：' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  },

  // 恢复默认
  resetData() {
    if (!confirm('确定要恢复默认数据吗？所有自定义修改将丢失！')) return;
    this.stations = this.getDefaultStations();
    this.globalStats = this.getDefaultGlobalStats();
    this.gradeInfo = {
      S: { name: 'S级（核心商圈/换乘）', desc: '', color: '#d4380d' },
      A: { name: 'A级（重点发展站）', desc: '', color: '#fa8c16' },
      B: { name: 'B级（潜力提升站）', desc: '', color: '#facc14' },
      C: { name: 'C级（培育优化站）', desc: '', color: '#52c41a' }
    };
    this.calcGlobalStats();
    this.render();
    localStorage.removeItem(this.config.storageKey);
    this.showToast('🔄 已恢复默认数据');
  },

  // 主渲染函数
  render() {
    this.renderStatsPanel();
    this.renderSVG();
    this.renderStations();
    this.renderGradePanel();
    this.renderFooter();
  },

  // 渲染统计面板
  renderStatsPanel() {
    const empty6 = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
    const total = (this.globalStats.totalShops === '' || this.globalStats.totalShops === undefined || this.globalStats.totalShops === null) ? empty6 : this.globalStats.totalShops;
    const rented = (this.globalStats.rentedShops === '' || this.globalStats.rentedShops === undefined || this.globalStats.rentedShops === null) ? empty6 : this.globalStats.rentedShops;
    const vacant = (this.globalStats.vacantShops === '' || this.globalStats.vacantShops === undefined || this.globalStats.vacantShops === null) ? empty6 : this.globalStats.vacantShops;
    const rate = this.calcRate() || empty6;

    const statsGrid = document.querySelector('.stats-grid');
    statsGrid.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon">🏪</div>
        <div class="stat-info">
          <div class="stat-label">全线商铺总数</div>
          <div class="stat-value"><span class="editable-num num-red" data-field="totalShops">${total}</span> <span class="unit">间</span></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <div class="stat-label">已出租</div>
          <div class="stat-value"><span class="editable-num num-green" data-field="rentedShops">${rented}</span> <span class="unit">间</span></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-info">
          <div class="stat-label">出租率</div>
          <div class="stat-value"><span class="num-orange">${rate}</span><span class="unit">%</span></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏠</div>
        <div class="stat-info">
          <div class="stat-label">空置</div>
          <div class="stat-value"><span class="editable-num num-blue" data-field="vacantShops">${vacant}</span> <span class="unit">间</span></div>
        </div>
      </div>
    `;

    this.attachGlobalEditListeners();
  },

  // 渲染 SVG 线路
  renderSVG() {
    const svg = document.getElementById('metroLines');
    const w = this.config.width;
    const h = this.config.height;

    // 定义流动渐变
    const defs = `
      <defs>
        <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:rgba(255,255,255,0)" />
          <stop offset="50%" style="stop-color:rgba(255,220,150,0.9)" />
          <stop offset="100%" style="stop-color:rgba(255,255,255,0)" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    `;

    // 线路走向：水平 → 垂直向下 → 斜线 → 水平
    const lineHorizontal1 = `M 80,480 L 1560,480`;
    const lineVertical = `L 1560,780`;
    const lineSlant1 = `L 1780,820`;
    const lineSlant2 = `L 1900,840`;
    const lineHorizontal2 = `L 2380,840`;
    const fullLinePath = `${lineHorizontal1} ${lineVertical} ${lineSlant1} ${lineSlant2} ${lineHorizontal2}`;

    // 上海11号线箭头（花桥 x=2380,y=860 右侧延伸）
    const shanghaiLine = `M 2380,840 L 2460,840`;

    // 构建SVG内容
    let svgContent = defs;

    // 线路底层阴影
    svgContent += `<path d="${fullLinePath}" class="metro-line" stroke="#8b1538" stroke-width="12" opacity="0.25" />`;
    // 主线路
    svgContent += `<path d="${fullLinePath}" class="metro-line main-line" />`;
    // 上海11号线连接
    svgContent += `<path d="${shanghaiLine}" class="metro-line" stroke="#1890ff" stroke-width="5" />`;

    // 流动光效
    svgContent += `<path d="${fullLinePath}" class="metro-line flow-anim" />`;

    // 站点节点
    this.stations.forEach(s => {
      const isTransfer = s.transfer;
      
      if (isTransfer) {
        // 换乘站：外圈红色大圆 + 内圈白色小圆
        svgContent += `<circle cx="${s.x}" cy="${s.y}" r="10" fill="#c41e3a" stroke="white" stroke-width="2" />`;
        svgContent += `<circle cx="${s.x}" cy="${s.y}" r="5" fill="white" />`;
      } else {
        // 普通站：白色圆点 + 红色边框
        svgContent += `<circle cx="${s.x}" cy="${s.y}" r="6" fill="white" stroke="#c41e3a" stroke-width="2.5" />`;
      }
      
      // 站点名称（SVG中显示在线路下方/上方）
      const labelY = s.pos === 'top' ? s.y - 22 : s.y + 18;
      svgContent += `<text x="${s.x}" y="${labelY}" class="station-label-svg">${s.name.replace('站', '')}</text>`;
      
      // 换乘标记
      if (s.transfer && s.transferLine) {
        const tagY = s.pos === 'top' ? s.y + 26 : s.y - 18;
        const tagX = s.x;
        const lineColor = '#1890ff';
        svgContent += `<rect x="${tagX - 28}" y="${tagY - 8}" width="56" height="16" rx="3" fill="white" stroke="${lineColor}" stroke-width="1.5" />`;
        svgContent += `<text x="${tagX}" y="${tagY + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="${lineColor}">${s.transferLine}</text>`;
      }
    });

    // 上海11号线终点箭头
    svgContent += `<polygon points="2460,835 2475,840 2460,845" fill="#1890ff" />`;
    svgContent += `<text x="2482" y="844" font-size="11" font-weight="700" fill="#1890ff">上海11号线</text>`;

    svg.innerHTML = svgContent;
  },

  // 渲染站点卡片
  renderStations() {
    const layer = document.getElementById('stationsLayer');
    layer.innerHTML = '';

    this.stations.forEach((s, idx) => {
      const card = document.createElement('div');
      card.className = `station-card card-${s.pos}`;
      card.dataset.id = s.id;
      
      // 卡片尺寸统一按5个商铺配置，确保同一水平线对齐
      const cardW = 150;
      const lineH = 20;
      const headerH = 30;
      const padding = 18;
      const maxShops = 4;
      const cardH = headerH + maxShops * lineH + padding;
      
      let left, top;
      if (s.pos === 'top') {
        left = s.x - cardW / 2;
        top = s.y - cardH - 45;
      } else if (s.pos === 'bottom') {
        left = s.x - cardW / 2;
        top = s.y + 45;
      } else if (s.pos === 'right') {
        left = s.x + 35;
        top = s.y - cardH / 2;
      } else if (s.pos === 'left') {
        left = s.x - cardW - 35;
        top = s.y - cardH / 2;
      } else if (s.pos === 'bottom-right') {
        left = s.x - cardW / 2;
        top = s.y + 45;
      }

      card.style.left = left + 'px';
      card.style.top = top + 'px';
      card.style.width = cardW + 'px';
      card.style.height = cardH + 'px';

      // 商铺列表
      const shopsHtml = (s.shops || []).map((shop, si) => `
        <div class="card-shop-row" data-idx="${idx}" data-si="${si}">
          <span class="shop-name">${shop.no}号商铺</span>
          <span class="shop-tenant">${shop.tenant || ''}</span>
        </div>
      `).join('');

      card.innerHTML = `
        <div class="card-grade-bar" style="background:#52c41a;"></div>
        <div class="card-body">
          <div class="card-title">${s.name}</div>
          ${shopsHtml}
        </div>
      `;

      layer.appendChild(card);
    });

    // 双击卡片打开商铺编辑器
    document.querySelectorAll('.station-card').forEach(card => {
      card.addEventListener('dblclick', (e) => {
        const idx = this.stations.findIndex(s => s.id === card.dataset.id);
        if (idx >= 0) this.openStationEditor(idx);
      });
    });
  },

  // 渲染商业价值分级面板
  renderGradePanel() {
    const list = document.getElementById('gradeList');
    const showText = (text) => (text && text.trim() !== '') ? text : '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0';
    list.innerHTML = Object.entries(this.gradeInfo).map(([key, info]) => `
      <div class="grade-item grade-${key.toLowerCase()}">
        <div class="grade-badge">${key}</div>
        <div class="grade-text">
          <div class="grade-name editable-grade" data-grade="${key}" data-field="name" data-raw="${info.name}">${showText(info.name)}</div>
          <div class="grade-stations editable-grade" data-grade="${key}" data-field="desc" data-raw="${info.desc}">${showText(info.desc)}</div>
        </div>
      </div>
    `).join('');
    this.attachGradeEditListeners();
  },

  // 附加商业价值分级编辑监听器
  attachGradeEditListeners() {
    document.querySelectorAll('.editable-grade').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const gradeKey = el.dataset.grade;
        const field = el.dataset.field;
        this.makeEditable(el, (val) => {
          this.gradeInfo[gradeKey][field] = val;
          el.dataset.raw = val;
          // 更新显示：空值用空格占位
          const displayVal = val.trim() !== '' ? val : '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0';
          el.textContent = displayVal;
          this.saveData();
          this.showToast('✅ 分级信息已更新');
        }, false, true);
      });
    });
  },

  // 渲染底部
  renderFooter() {
    const dateEl = document.querySelector('.footer .editable');
    if (dateEl) dateEl.textContent = this.globalStats.statsDate;
  },

  // 附加站点编辑监听器
  attachStationEditListeners() {
    document.querySelectorAll('#stationsLayer .editable-num').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.makeEditable(el, (val) => {
          const idx = parseInt(el.dataset.idx);
          const field = el.dataset.field;
          const numVal = parseInt(val) || 0;
          this.stations[idx][field] = numVal;
          
          // 自动重新计算出租率和统计
          this.calcGlobalStats();
          this.render();
          this.saveData();
        });
      });
    });
  },

  // 附加全局统计编辑监听器
  attachGlobalEditListeners() {
    document.querySelectorAll('.stats-panel .editable-num').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.makeEditable(el, (val) => {
          const field = el.dataset.field;
          // 支持空值：输入为空时保存空字符串，否则保存数字
          this.globalStats[field] = val === '' ? '' : (parseInt(val) || 0);
          this.render();
          this.saveData();
        });
      });
    });

    document.querySelectorAll('.stats-panel .editable').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.makeEditable(el, (val) => {
          const field = el.dataset.field;
          this.globalStats[field] = val;
          this.render();
          this.saveData();
        }, false);
      });
    });
  },

  // 使元素可编辑
  makeEditable(el, onSave, isNumber = true, allowEmpty = false) {
    if (el.querySelector('input')) return;
    
    const originalValue = (el.dataset.raw !== undefined ? el.dataset.raw : el.textContent).trim();
    const input = document.createElement('input');
    input.type = isNumber ? 'number' : 'text';
    input.value = originalValue;
    input.className = 'editable-input';
    if (isNumber) {
      input.min = '0';
      input.style.width = '50px';
    }

    el.innerHTML = '';
    el.appendChild(input);
    input.focus();
    input.select();

    const save = () => {
      const val = input.value.trim();
      if (val !== '' || allowEmpty) {
        onSave(val);
      } else {
        el.textContent = originalValue;
      }
    };

    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        input.blur();
      } else if (e.key === 'Escape') {
        el.textContent = originalValue;
      }
    });
  },

  // 当前编辑的站点索引
  editingStationIdx: null,

  // 打开站点编辑器
  openStationEditor(idx) {
    this.editingStationIdx = idx;
    const s = this.stations[idx];
    
    document.getElementById('editName').value = s.name;
    document.getElementById('editGrade').value = s.grade;
    document.getElementById('editX').value = s.x;
    document.getElementById('editY').value = s.y;
    document.getElementById('editPos').value = s.pos;
    document.getElementById('editTransfer').value = s.transfer ? 'true' : 'false';
    
    // 渲染商铺列表编辑器
    const shopsContainer = document.getElementById('editShops');
    shopsContainer.innerHTML = (s.shops || []).map((shop, si) => `
      <div class="shop-edit-row">
        <span class="shop-edit-no">${shop.no}号商铺</span>
        <input type="text" class="shop-edit-tenant" data-si="${si}" value="${shop.tenant}" placeholder="承租方" />
      </div>
    `).join('');
    
    document.getElementById('stationModal').classList.add('active');
    document.getElementById('overlay').classList.add('active');
  },

  // 关闭模态框
  closeModal() {
    this.editingStationIdx = null;
    document.getElementById('stationModal').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
  },

  // 保存站点编辑
  saveStationEdit() {
    if (this.editingStationIdx === null) return;
    
    const idx = this.editingStationIdx;
    const s = this.stations[idx];
    
    s.name = document.getElementById('editName').value.trim() || s.name;
    s.grade = document.getElementById('editGrade').value;
    s.x = parseInt(document.getElementById('editX').value) || s.x;
    s.y = parseInt(document.getElementById('editY').value) || s.y;
    s.pos = document.getElementById('editPos').value;
    s.transfer = document.getElementById('editTransfer').value === 'true';
    
    // 保存商铺承租方
    document.querySelectorAll('#editShops .shop-edit-tenant').forEach(input => {
      const si = parseInt(input.dataset.si);
      if (s.shops[si]) {
        s.shops[si].tenant = input.value.trim();
      }
    });
    
    this.render();
    this.saveData();
    this.closeModal();
    this.showToast('✅ 站点数据已更新');
  },

  // 设置事件监听
  setupEventListeners() {
    // 点击空白关闭编辑
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.editable') && !e.target.closest('.editable-input') && !e.target.closest('.modal')) {
        const activeInput = document.querySelector('.editable-input');
        if (activeInput) activeInput.blur();
      }
    });

    // ESC关闭模态框
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });

    // 导入文件监听
    const importFile = document.getElementById('importFile');
    if (importFile) {
      importFile.addEventListener('change', (e) => {
        if (e.target.files[0]) {
          this.importData(e.target.files[0]);
          e.target.value = '';
        }
      });
    }
  },

  // ========== 视口控制（缩放+拖动） ==========
  viewport: {
    scale: 1,
    x: 0,
    y: 0,
    minScale: 0.3,
    maxScale: 3
  },

  isDragging: false,
  dragStart: { x: 0, y: 0 },
  lastMouse: { x: 0, y: 0 },

  // 初始化视口（自动适配屏幕）
  initViewport() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const padding = 60;
    const scaleX = (vw - padding) / this.config.width;
    const scaleY = (vh - padding) / this.config.height;
    this.viewport.scale = Math.min(scaleX, scaleY, 1);
    this.viewport.x = 0;
    this.viewport.y = 0;
    this.applyTransform();
    this.initViewportEvents();
    this.addViewportControls();
  },

  // 应用变换
  applyTransform() {
    const map = document.querySelector('.battle-map');
    if (map) {
      map.style.transform = `translate(${this.viewport.x}px, ${this.viewport.y}px) scale(${this.viewport.scale})`;
    }
  },

  // 缩放
  zoom(delta, centerX, centerY) {
    const factor = delta < 0 ? 1.1 : 0.9;
    const newScale = Math.max(this.viewport.minScale, Math.min(this.viewport.maxScale, this.viewport.scale * factor));

    // 以指定点为中心缩放
    const dx = centerX - this.viewport.x;
    const dy = centerY - this.viewport.y;
    this.viewport.x += dx * (1 - newScale / this.viewport.scale);
    this.viewport.y += dy * (1 - newScale / this.viewport.scale);
    this.viewport.scale = newScale;

    this.applyTransform();
  },

  // 自适应屏幕（不重置用户拖动状态，仅调整 scale 确保内容可见）
  fitToScreen() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const padding = 40;
    const scaleX = (vw - padding) / this.config.width;
    const scaleY = (vh - padding) / this.config.height;
    const newScale = Math.min(scaleX, scaleY, 1);

    // 如果当前 scale 比最佳值大很多，或者画布已拖出可视区域，则重置
    const mapW = this.config.width * this.viewport.scale;
    const mapH = this.config.height * this.viewport.scale;
    const isOffScreen = Math.abs(this.viewport.x) > mapW / 2 + vw || Math.abs(this.viewport.y) > mapH / 2 + vh;

    if (this.viewport.scale > newScale * 1.5 || isOffScreen || this.viewport.scale < newScale * 0.5) {
      this.viewport.scale = newScale;
      this.viewport.x = 0;
      this.viewport.y = 0;
      this.applyTransform();
    }
  },

  // 重置视图
  resetViewport() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const padding = 40;
    const scaleX = (vw - padding) / this.config.width;
    const scaleY = (vh - padding) / this.config.height;
    this.viewport.scale = Math.min(scaleX, scaleY, 1);
    this.viewport.x = 0;
    this.viewport.y = 0;
    this.applyTransform();
    this.showToast('🔍 视图已重置');
  },

  // 绑定视口事件
  initViewportEvents() {
    const app = document.getElementById('app');
    if (!app) return;

    // 滚轮缩放
    app.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) return; // 让Ctrl+滚轮交给浏览器
      e.preventDefault();
      const rect = app.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      this.zoom(e.deltaY, cx, cy);
    }, { passive: false });

    // 右键拖动
    app.addEventListener('mousedown', (e) => {
      if (e.button === 2) { // 右键
        this.isDragging = true;
        this.dragStart.x = e.clientX;
        this.dragStart.y = e.clientY;
        this.lastMouse.x = e.clientX;
        this.lastMouse.y = e.clientY;
        app.classList.add('dragging');
        e.preventDefault();
      }
    });

    app.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastMouse.x;
      const dy = e.clientY - this.lastMouse.y;
      this.viewport.x += dx;
      this.viewport.y += dy;
      this.lastMouse.x = e.clientX;
      this.lastMouse.y = e.clientY;
      this.applyTransform();
    });

    app.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        app.classList.remove('dragging');
      }
    });

    app.addEventListener('mouseleave', () => {
      if (this.isDragging) {
        this.isDragging = false;
        app.classList.remove('dragging');
      }
    });

    // 禁用右键菜单
    app.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // 窗口大小变化时重新适配（防抖）
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.fitToScreen();
      }, 150);
    });
  },

  // 添加缩放控制按钮
  addViewportControls() {
    if (document.querySelector('.viewport-controls')) return;

    const controls = document.createElement('div');
    controls.className = 'viewport-controls';
    controls.innerHTML = `
      <button class="viewport-btn" onclick="app.zoomIn()" title="放大">+</button>
      <button class="viewport-btn" onclick="app.zoomOut()" title="缩小">−</button>
      <button class="viewport-btn" onclick="app.resetViewport()" title="重置视图">⟲</button>
    `;
    document.body.appendChild(controls);
  },

  zoomIn() {
    const vw = window.innerWidth / 2;
    const vh = window.innerHeight / 2;
    this.zoom(-1, vw, vh);
  },

  zoomOut() {
    const vw = window.innerWidth / 2;
    const vh = window.innerHeight / 2;
    this.zoom(1, vw, vh);
  },

  // 显示提示
  showToast(msg, type = 'success') {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.background = type === 'error' ? '#ff4d4f' : 'rgba(0,0,0,0.8)';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  },

  // 打印
  printMap() {
    window.print();
  }
};

// 全局API（供HTML调用）
const app = {
  saveNow: () => BattleMap.saveData(),
  exportData: () => BattleMap.exportData(),
  importData: (input) => {
    if (input.files && input.files[0]) {
      BattleMap.importData(input.files[0]);
    }
  },
  resetData: () => BattleMap.resetData(),
  printMap: () => BattleMap.printMap(),
  closeModal: () => BattleMap.closeModal(),
  saveStationEdit: () => BattleMap.saveStationEdit(),
  zoomIn: () => BattleMap.zoomIn(),
  zoomOut: () => BattleMap.zoomOut(),
  resetViewport: () => BattleMap.resetViewport(),
  showHDExportHelp: () => {
    document.getElementById('hdExportModal').classList.add('active');
    document.getElementById('overlay').classList.add('active');
  },
  closeHDExportModal: () => {
    document.getElementById('hdExportModal').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
  }
};

// 启动
document.addEventListener('DOMContentLoaded', () => {
  BattleMap.init();
});
