/**
 * 苏州轨道交通11号线商业开发作战图
 * 核心逻辑：数据管理、渲染、编辑、保存、打印
 */

const BattleMap = {
  config: {
    width: 2520,
    height: 1080,
    mainLineY: 440,
    storageKey: 'suzhou_m11_battle_map_data'
  },

  // 商业价值分级说明
  gradeInfo: {
    S: { name: 'S级（核心商圈/换乘）', desc: '花桥、昆山文化艺术中心、玉山广场、昆山城市广场', color: '#d4380d' },
    A: { name: 'A级（重点发展站）', desc: '阳澄湖东、莲湖公园、金浦大桥东、花桥博览中心', color: '#fa8c16' },
    B: { name: 'B级（潜力提升站）', desc: '正仪、共青、白马泾、绣衣、神童泾、花溪公园、兆丰路', color: '#facc14' },
    C: { name: 'C级（培育优化站）', desc: '唯亭、草鞋山、祖冲之公园、鱼池泾、白河潭、兵希、夏驾河公园、盛庄、顺帆北路、菉葭、夏桥、章基路、光明路', color: '#52c41a' }
  },

  // 默认站点数据（坐标、等级、统计数据）
  getDefaultStations() {
    return [
      // ========== 主线（上方） ==========
      { id: 'weiting', name: '唯亭站', grade: 'C', total: 18, rented: 15, vacant: 2, renovating: 1, x: 140, y: 440, pos: 'top', transfer: false },
      { id: 'caoxieshan', name: '草鞋山站', grade: 'C', total: 12, rented: 8, vacant: 3, renovating: 1, x: 270, y: 440, pos: 'top', transfer: false },
      { id: 'yangchenghudong', name: '阳澄湖东站', grade: 'A', total: 20, rented: 16, vacant: 2, renovating: 2, x: 410, y: 440, pos: 'top', transfer: false },
      { id: 'zhengyi', name: '正仪站', grade: 'B', total: 14, rented: 9, vacant: 3, renovating: 2, x: 540, y: 440, pos: 'top', transfer: false },
      { id: 'lianhuagongyuan', name: '莲湖公园站', grade: 'A', total: 22, rented: 18, vacant: 2, renovating: 2, x: 670, y: 440, pos: 'top', transfer: false },
      { id: 'zuchongzhi', name: '祖冲之公园站', grade: 'C', total: 16, rented: 13, vacant: 2, renovating: 1, x: 800, y: 440, pos: 'top', transfer: false },
      { id: 'kunshanwenhua', name: '昆山文化艺术中心站', grade: 'S', total: 28, rented: 19, vacant: 6, renovating: 3, x: 960, y: 440, pos: 'top', transfer: true, transferLine: '3号线' },
      { id: 'gongqing', name: '共青站', grade: 'B', total: 12, rented: 7, vacant: 3, renovating: 2, x: 1130, y: 440, pos: 'top', transfer: false },
      { id: 'baimajing', name: '白马泾站', grade: 'B', total: 16, rented: 12, vacant: 2, renovating: 2, x: 1270, y: 440, pos: 'top', transfer: false },
      { id: 'yushanguangchang', name: '玉山广场站', grade: 'S', total: 25, rented: 20, vacant: 3, renovating: 2, x: 1420, y: 440, pos: 'top', transfer: true },
      { id: 'xiuyi', name: '绣衣站', grade: 'B', total: 11, rented: 6, vacant: 3, renovating: 2, x: 1570, y: 440, pos: 'top', transfer: false },
      { id: 'jinpudaqiao', name: '金浦大桥东站', grade: 'A', total: 18, rented: 14, vacant: 2, renovating: 2, x: 1710, y: 440, pos: 'top', transfer: false },
      { id: 'yuchijing', name: '鱼池泾站', grade: 'C', total: 12, rented: 7, vacant: 3, renovating: 2, x: 1850, y: 440, pos: 'top', transfer: false },
      { id: 'baihetan', name: '白河潭站', grade: 'C', total: 10, rented: 6, vacant: 2, renovating: 2, x: 1990, y: 440, pos: 'top', transfer: false },
      { id: 'bingxi', name: '兵希站', grade: 'C', total: 9, rented: 4, vacant: 4, renovating: 1, x: 2130, y: 440, pos: 'top', transfer: false },

      // ========== 右侧延伸 ==========
      { id: 'xiajiahe', name: '夏驾河公园站', grade: 'B', total: 15, rented: 9, vacant: 4, renovating: 2, x: 2240, y: 440, pos: 'top', transfer: false },
      { id: 'shengzhuang', name: '盛庄站', grade: 'C', total: 13, rented: 8, vacant: 3, renovating: 2, x: 2240, y: 560, pos: 'left', transfer: false },

      // ========== 下方支线1 ==========
      { id: 'kunshanchengshi', name: '昆山城市广场站', grade: 'S', total: 24, rented: 19, vacant: 3, renovating: 2, x: 880, y: 620, pos: 'bottom', transfer: false },
      { id: 'shunfanbei', name: '顺帆北路站', grade: 'C', total: 13, rented: 8, vacant: 3, renovating: 2, x: 1060, y: 620, pos: 'bottom', transfer: false },
      { id: 'shentongjing', name: '神童泾站', grade: 'B', total: 16, rented: 12, vacant: 2, renovating: 2, x: 1220, y: 620, pos: 'bottom', transfer: false },
      { id: 'lujia', name: '菉葭站', grade: 'C', total: 11, rented: 6, vacant: 3, renovating: 2, x: 1380, y: 620, pos: 'bottom', transfer: false },

      // ========== 右下角支线 ==========
      { id: 'xiaqiao', name: '夏桥站', grade: 'C', total: 16, rented: 12, vacant: 2, renovating: 2, x: 1660, y: 780, pos: 'bottom', transfer: false },
      { id: 'zhangjilu', name: '章基路站', grade: 'C', total: 14, rented: 9, vacant: 3, renovating: 2, x: 1840, y: 780, pos: 'bottom', transfer: false },
      { id: 'huaqiaobolan', name: '花桥博览中心站', grade: 'A', total: 22, rented: 17, vacant: 3, renovating: 2, x: 2020, y: 780, pos: 'bottom', transfer: false },

      // ========== 底行支线 ==========
      { id: 'huaxigongyuan', name: '花溪公园站', grade: 'B', total: 16, rented: 12, vacant: 2, renovating: 2, x: 1840, y: 860, pos: 'bottom', transfer: false },
      { id: 'zhaofenglu', name: '兆丰路站', grade: 'B', total: 14, rented: 9, vacant: 3, renovating: 2, x: 2020, y: 860, pos: 'bottom', transfer: false },
      { id: 'guangminglu', name: '光明路站', grade: 'C', total: 14, rented: 10, vacant: 2, renovating: 2, x: 2180, y: 860, pos: 'bottom', transfer: false },
      { id: 'huaqiao', name: '花桥站', grade: 'S', total: 30, rented: 24, vacant: 4, renovating: 2, x: 2360, y: 860, pos: 'bottom-right', transfer: true, transferLine: '上海11号线' }
    ];
  },

  getDefaultGlobalStats() {
    return {
      statsDate: '2024年5月20日',
      totalShops: 536,
      rentedShops: 396,
      vacantShops: 106,
      renovatingShops: 34
    };
  },

  // 计算出租率
  calcRate(station) {
    if (!station.total || station.total === 0) return '0.0';
    return ((station.rented / station.total) * 100).toFixed(1);
  },

  // 计算全局统计
  calcGlobalStats() {
    const stats = {
      totalShops: 0,
      rentedShops: 0,
      vacantShops: 0,
      renovatingShops: 0
    };
    this.stations.forEach(s => {
      stats.totalShops += parseInt(s.total) || 0;
      stats.rentedShops += parseInt(s.rented) || 0;
      stats.vacantShops += parseInt(s.vacant) || 0;
      stats.renovatingShops += parseInt(s.renovating) || 0;
    });
    this.globalStats = { ...this.globalStats, ...stats };
  },

  // 初始化
  init() {
    this.loadData();
    this.calcGlobalStats();
    this.render();
    this.setupEventListeners();
    this.fitToScreen();
    window.addEventListener('resize', () => this.fitToScreen());
  },

  // 加载数据（localStorage > 默认）
  loadData() {
    try {
      const saved = localStorage.getItem(this.config.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        this.stations = data.stations || this.getDefaultStations();
        this.globalStats = data.globalStats || this.getDefaultGlobalStats();
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
    const totalRate = this.globalStats.totalShops > 0
      ? ((this.globalStats.rentedShops / this.globalStats.totalShops) * 100).toFixed(1)
      : '0.0';

    document.querySelector('.stats-date .editable').textContent = this.globalStats.statsDate;
    
    const statsGrid = document.querySelector('.stats-grid');
    statsGrid.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon">🏪</div>
        <div class="stat-info">
          <div class="stat-label">全线商铺总数</div>
          <div class="stat-value"><span class="editable-num num-red" data-field="totalShops">${this.globalStats.totalShops}</span> <span class="unit">间</span></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <div class="stat-label">已出租</div>
          <div class="stat-value"><span class="editable-num num-green" data-field="rentedShops">${this.globalStats.rentedShops}</span> <span class="unit">间</span></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-info">
          <div class="stat-label">出租率</div>
          <div class="stat-value"><span class="num-orange">${totalRate}</span><span class="unit">%</span></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏠</div>
        <div class="stat-info">
          <div class="stat-label">空置</div>
          <div class="stat-value"><span class="editable-num num-blue" data-field="vacantShops">${this.globalStats.vacantShops}</span> <span class="unit">间</span></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔧</div>
        <div class="stat-info">
          <div class="stat-label">装修中</div>
          <div class="stat-value"><span class="editable-num" data-field="renovatingShops">${this.globalStats.renovatingShops}</span> <span class="unit">间</span></div>
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

    // 主线路径
    const mainLinePath = `M 140,440 L 2240,440`;
    const subBranch1 = `M 800,440 C 800,530 860,560 880,620 L 1380,620`;
    const xiaqiaoBranch = `M 2290,560 L 2290,680 L 1660,780 L 2020,780`;
    const huaxiBranch = `M 1840,780 L 1840,860`;
    const zhaofengBranch = `M 2020,780 L 2020,860`;
    const bottomLine = `M 1840,860 L 2360,860`;

    // 3号线标记
    const line3 = `M 960,440 L 960,520`;

    // 上海11号线箭头（底行右侧延伸）
    const shanghaiLine = `M 2360,860 L 2480,860`;

    // 构建SVG内容
    let svgContent = defs;

    // 线路底层（粗阴影）
    svgContent += `<path d="${mainLinePath}" class="metro-line" stroke="#8b1538" stroke-width="14" opacity="0.3" />`;
    svgContent += `<path d="${mainLinePath}" class="metro-line main-line" />`;
    svgContent += `<path d="${subBranch1}" class="metro-line branch-line" />`;
    svgContent += `<path d="${xiaqiaoBranch}" class="metro-line branch-line" />`;
    svgContent += `<path d="${huaxiBranch}" class="metro-line branch-line" />`;
    svgContent += `<path d="${zhaofengBranch}" class="metro-line branch-line" />`;
    svgContent += `<path d="${bottomLine}" class="metro-line branch-line" />`;
    svgContent += `<path d="${line3}" class="metro-line transfer-line-other" />`;
    svgContent += `<path d="${shanghaiLine}" class="metro-line" stroke="#1890ff" stroke-width="5" />`;

    // 流动光效
    svgContent += `<path d="${mainLinePath}" class="metro-line flow-anim" />`;

    // 站点节点
    this.stations.forEach(s => {
      const isTransfer = s.transfer;
      const r = isTransfer ? 10 : 7;
      const strokeW = isTransfer ? 4 : 3;
      
      svgContent += `<circle cx="${s.x}" cy="${s.y}" r="${r}" class="station-node ${isTransfer ? 'transfer' : 'normal'}" />`;
      
      // 站点名称（SVG中显示在线路旁边）
      const labelY = s.pos === 'top' ? s.y - 18 : s.y + 28;
      svgContent += `<text x="${s.x}" y="${labelY}" class="station-label-svg">${s.name.replace('站', '')}</text>`;
      
      // 换乘标记
      if (s.transfer && s.transferLine) {
        const tagY = s.pos === 'top' ? s.y + 30 : s.y - 20;
        const tagX = s.x;
        svgContent += `<rect x="${tagX - 25}" y="${tagY - 8}" width="50" height="16" rx="3" fill="white" stroke="#c41e3a" stroke-width="1.5" />`;
        svgContent += `<text x="${tagX}" y="${tagY + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="#c41e3a">${s.transferLine}</text>`;
      }
    });

    // 上海11号线终点箭头
    svgContent += `<polygon points="2480,855 2495,860 2480,865" fill="#1890ff" />`;
    svgContent += `<text x="2510" y="864" font-size="11" font-weight="700" fill="#1890ff">上海11号线</text>`;

    svg.innerHTML = svgContent;
  },

  // 渲染站点卡片
  renderStations() {
    const layer = document.getElementById('stationsLayer');
    layer.innerHTML = '';

    this.stations.forEach((s, idx) => {
      const rate = this.calcRate(s);
      const rateClass = rate >= 75 ? 'rate-high' : rate >= 60 ? 'rate-mid' : 'rate-low';
      const fillClass = rate >= 75 ? 'fill-high' : rate >= 60 ? 'fill-mid' : 'fill-low';

      const card = document.createElement('div');
      card.className = `station-card card-${s.pos}`;
      card.dataset.id = s.id;
      
      // 计算卡片位置（以站点为中心）
      const cardW = 118;
      const cardH = 165;
      let left, top;
      
      if (s.pos === 'top') {
        left = s.x - cardW / 2;
        top = s.y - cardH - 35;
      } else if (s.pos === 'bottom') {
        left = s.x - cardW / 2;
        top = s.y + 35;
      } else if (s.pos === 'right') {
        left = s.x + 20;
        top = s.y - cardH / 2;
      } else if (s.pos === 'left') {
        left = s.x - cardW - 20;
        top = s.y - cardH / 2;
      } else if (s.pos === 'bottom-right') {
        left = s.x - cardW / 2;
        top = s.y + 35;
      }

      card.style.left = left + 'px';
      card.style.top = top + 'px';

      card.innerHTML = `
        <div class="card-grade-bar card-grade-${s.grade.toLowerCase()}"></div>
        <div class="card-body">
          <div class="card-title">${s.name}</div>
          <div class="card-row">
            <span class="label">商铺</span>
            <span class="value editable-num" data-idx="${idx}" data-field="total">${s.total}</span>
            <span class="label" style="margin-left:2px">间</span>
          </div>
          <div class="card-row">
            <span class="label">已出租</span>
            <span class="value editable-num" data-idx="${idx}" data-field="rented">${s.rented}</span>
            <span class="label" style="margin-left:2px">间</span>
          </div>
          <div class="card-row">
            <span class="label">空置</span>
            <span class="value editable-num" data-idx="${idx}" data-field="vacant">${s.vacant}</span>
            <span class="label" style="margin-left:2px">间</span>
          </div>
          <div class="card-row">
            <span class="label">装修中</span>
            <span class="value editable-num" data-idx="${idx}" data-field="renovating">${s.renovating}</span>
            <span class="label" style="margin-left:2px">间</span>
          </div>
          <div class="card-row" style="margin-top:4px; padding-top:4px; border-top:1px solid #f0f0f0;">
            <span class="label" style="font-weight:700; color:#333;">出租率</span>
            <span class="value rate ${rateClass}">${rate}%</span>
          </div>
          <div class="card-rate-bar">
            <div class="card-rate-fill ${fillClass}" style="width: ${rate}%"></div>
          </div>
        </div>
      `;

      layer.appendChild(card);
    });

    this.attachStationEditListeners();
    
    // 双击卡片打开完整编辑器
    document.querySelectorAll('.station-card').forEach(card => {
      card.addEventListener('dblclick', (e) => {
        if (e.target.closest('.editable-num')) return; // 如果点击的是可编辑数字，不触发
        const idx = parseInt(card.querySelector('.editable-num').dataset.idx);
        this.openStationEditor(idx);
      });
    });
  },

  // 渲染商业价值分级面板
  renderGradePanel() {
    const list = document.getElementById('gradeList');
    list.innerHTML = Object.entries(this.gradeInfo).map(([key, info]) => `
      <div class="grade-item grade-${key.toLowerCase()}">
        <div class="grade-badge">${key}</div>
        <div class="grade-text">
          <div class="grade-name">${info.name}</div>
          <div class="grade-stations">${info.desc}</div>
        </div>
      </div>
    `).join('');
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
          this.globalStats[field] = parseInt(val) || 0;
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
  makeEditable(el, onSave, isNumber = true) {
    if (el.querySelector('input')) return;
    
    const originalValue = el.textContent.trim();
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
      if (val !== '') {
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
    document.getElementById('editTotal').value = s.total;
    document.getElementById('editRented').value = s.rented;
    document.getElementById('editVacant').value = s.vacant;
    document.getElementById('editRenovating').value = s.renovating;
    document.getElementById('editX').value = s.x;
    document.getElementById('editY').value = s.y;
    document.getElementById('editPos').value = s.pos;
    document.getElementById('editTransfer').value = s.transfer ? 'true' : 'false';
    
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
    s.total = parseInt(document.getElementById('editTotal').value) || 0;
    s.rented = parseInt(document.getElementById('editRented').value) || 0;
    s.vacant = parseInt(document.getElementById('editVacant').value) || 0;
    s.renovating = parseInt(document.getElementById('editRenovating').value) || 0;
    s.x = parseInt(document.getElementById('editX').value) || s.x;
    s.y = parseInt(document.getElementById('editY').value) || s.y;
    s.pos = document.getElementById('editPos').value;
    s.transfer = document.getElementById('editTransfer').value === 'true';
    
    this.calcGlobalStats();
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

  // 屏幕适配缩放
  fitToScreen() {
    const app = document.getElementById('app');
    const map = document.querySelector('.battle-map');
    if (!map) return;

    const padding = 40;
    const availW = window.innerWidth - padding * 2;
    const availH = window.innerHeight - padding * 2;
    const scaleX = availW / this.config.width;
    const scaleY = availH / this.config.height;
    const scale = Math.min(scaleX, scaleY, 1);

    map.style.transform = `scale(${scale})`;
    map.style.transformOrigin = 'center center';
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
  saveStationEdit: () => BattleMap.saveStationEdit()
};

// 启动
document.addEventListener('DOMContentLoaded', () => {
  BattleMap.init();
});
