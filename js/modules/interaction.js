/**
 * 交互处理 — 编辑、模态框、事件监听、提示
 */

import { state } from './state.js';

// 显示提示
export function showToast(msg, type = 'success') {
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
}

// 打印
export function printMap() {
  window.print();
}

// 使元素可编辑
export function makeEditable(el, onSave, isNumber = true, allowEmpty = false) {
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
}

// 渲染商铺表格 HTML
function renderShopTable(shops) {
  const rows = (shops || []).map((shop, si) => `
    <tr data-row-idx="${si}">
      <td class="col-name"><input type="text" data-field="name" value="${shop.name || ''}" /></td>
      <td class="col-type"><input type="text" data-field="type" value="${shop.type || '商铺'}" /></td>
      <td class="col-area"><input type="number" data-field="area" value="${shop.area || 0}" step="0.01" /></td>
      <td class="col-tenant"><input type="text" data-field="tenant" value="${shop.tenant || ''}" /></td>
      <td class="col-contact"><input type="text" data-field="contact" value="${shop.contact || ''}" /></td>
      <td class="col-date"><input type="text" data-field="openDate" value="${shop.openDate || ''}" /></td>
      <td class="col-status">
        <select data-field="status">
          <option value="未出租" ${shop.status === '未出租' ? 'selected' : ''}>未出租</option>
          <option value="装修中" ${shop.status === '装修中' ? 'selected' : ''}>装修中</option>
          <option value="营业中" ${shop.status === '营业中' ? 'selected' : ''}>营业中</option>
        </select>
      </td>
      <td class="col-remark"><input type="text" data-field="remark" value="${shop.remark || ''}" /></td>
      <td class="col-delete">
        <button type="button" class="btn-delete-shop" onclick="app.deleteShopRow(this)" title="删除"
          ${(shops || []).length <= 1 ? 'disabled' : ''}>×</button>
      </td>
    </tr>
  `).join('');

  return `
    <div class="shop-table-toolbar">
      <button type="button" class="btn-add-shop" onclick="app.addShopRow()">+ 添加商铺</button>
      <span class="shop-count">共 ${shops ? shops.length : 0} 个商铺</span>
    </div>
    <table class="shop-edit-table">
      <thead>
        <tr>
          <th class="col-name">铺号</th>
          <th class="col-type">属性</th>
          <th class="col-area">面积</th>
          <th class="col-tenant">承租方</th>
          <th class="col-contact">联系方式</th>
          <th class="col-date">开业时间</th>
          <th class="col-status">状态</th>
          <th class="col-remark">备注</th>
          <th class="col-delete">操作</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// 打开站点编辑器
export function openStationEditor(idx) {
  state.editingStationIdx = idx;
  const s = state.stations[idx];

  document.getElementById('editName').value = s.name;
  document.getElementById('editGrade').value = s.grade;
  document.getElementById('editX').value = s.x;
  document.getElementById('editY').value = s.y;
  document.getElementById('editPos').value = s.pos;
  document.getElementById('editTransfer').value = s.transfer ? 'true' : 'false';

  const shopsContainer = document.getElementById('editShops');
  shopsContainer.innerHTML = renderShopTable(s.shops);

  document.getElementById('stationModal').classList.add('active');
  document.getElementById('overlay').classList.add('active');
}

// 添加商铺行
export function addShopRow() {
  const tbody = document.querySelector('#editShops tbody');
  if (!tbody) return;

  const newRow = document.createElement('tr');
  newRow.innerHTML = `
    <td class="col-name"><input type="text" data-field="name" value="" /></td>
    <td class="col-type"><input type="text" data-field="type" value="商铺" /></td>
    <td class="col-area"><input type="number" data-field="area" value="0" step="0.01" /></td>
    <td class="col-tenant"><input type="text" data-field="tenant" value="" /></td>
    <td class="col-contact"><input type="text" data-field="contact" value="" /></td>
    <td class="col-date"><input type="text" data-field="openDate" value="" /></td>
    <td class="col-status">
      <select data-field="status">
        <option value="未出租" selected>未出租</option>
        <option value="装修中">装修中</option>
        <option value="营业中">营业中</option>
      </select>
    </td>
    <td class="col-remark"><input type="text" data-field="remark" value="" /></td>
    <td class="col-delete">
      <button type="button" class="btn-delete-shop" onclick="app.deleteShopRow(this)" title="删除">×</button>
    </td>
  `;
  tbody.appendChild(newRow);

  // 更新计数和所有删除按钮状态
  updateDeleteButtons();

  // 聚焦到新行的铺号输入框
  const nameInput = newRow.querySelector('[data-field="name"]');
  if (nameInput) nameInput.focus();
}

// 删除商铺行
export function deleteShopRow(btn) {
  const tbody = document.querySelector('#editShops tbody');
  if (!tbody || tbody.children.length <= 1) {
    showToast('至少保留一个商铺', 'error');
    return;
  }

  if (!confirm('确定删除该商铺？')) return;

  const row = btn.closest('tr');
  if (row) row.remove();

  updateDeleteButtons();
}

// 更新删除按钮状态（只剩一行时禁用）
function updateDeleteButtons() {
  const tbody = document.querySelector('#editShops tbody');
  if (!tbody) return;
  const count = tbody.children.length;
  const countSpan = document.querySelector('.shop-count');
  if (countSpan) countSpan.textContent = `共 ${count} 个商铺`;

  tbody.querySelectorAll('.btn-delete-shop').forEach(btn => {
    btn.disabled = count <= 1;
  });
}

// 从 DOM 表格读取商铺数据
function readShopsFromTable() {
  const tbody = document.querySelector('#editShops tbody');
  if (!tbody) return [];

  const shops = [];
  tbody.querySelectorAll('tr').forEach(row => {
    const shop = {};
    row.querySelectorAll('[data-field]').forEach(el => {
      const field = el.dataset.field;
      if (field === 'area') {
        shop[field] = parseFloat(el.value) || 0;
      } else {
        shop[field] = el.value.trim();
      }
    });
    shops.push(shop);
  });

  return shops;
}

// 校验商铺数据
function validateShops(shops) {
  for (let i = 0; i < shops.length; i++) {
    if (!shops[i].name || shops[i].name.trim() === '') {
      return `第 ${i + 1} 行商铺的铺号不能为空`;
    }
  }
  return null;
}

// 关闭模态框
export function closeModal() {
  state.editingStationIdx = null;
  document.getElementById('stationModal').classList.remove('active');
  document.getElementById('overlay').classList.remove('active');
}

// 关闭高清导出弹窗
export function closeHDExportModal() {
  document.getElementById('hdExportModal').classList.remove('active');
  document.getElementById('overlay').classList.remove('active');
}

// 显示高清导出帮助
export function showHDExportHelp() {
  document.getElementById('hdExportModal').classList.add('active');
  document.getElementById('overlay').classList.add('active');
}

// 保存站点编辑
export function saveStationEdit(onAfterSave) {
  if (state.editingStationIdx === null) return;

  const idx = state.editingStationIdx;
  const s = state.stations[idx];

  s.name = document.getElementById('editName').value.trim() || s.name;
  s.grade = document.getElementById('editGrade').value;
  s.x = parseInt(document.getElementById('editX').value) || s.x;
  s.y = parseInt(document.getElementById('editY').value) || s.y;
  s.pos = document.getElementById('editPos').value;
  s.transfer = document.getElementById('editTransfer').value === 'true';

  // 从 DOM 表格读取商铺数据
  const shops = readShopsFromTable();

  // 校验
  const error = validateShops(shops);
  if (error) {
    showToast(error, 'error');
    return;
  }

  // 重排序号
  shops.forEach((shop, i) => {
    shop.no = i + 1;
  });

  s.shops = shops;

  if (onAfterSave) onAfterSave();
}

// 设置事件监听
export function setupEventListeners(onImportFileChange) {
  // 点击空白关闭编辑
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.editable') && !e.target.closest('.editable-input') && !e.target.closest('.modal')) {
      const activeInput = document.querySelector('.editable-input');
      if (activeInput) activeInput.blur();
    }
  });

  // ESC关闭模态框
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // 导入文件监听
  const importFile = document.getElementById('importFile');
  if (importFile && onImportFileChange) {
    importFile.addEventListener('change', (e) => {
      if (e.target.files[0]) {
        onImportFileChange(e.target);
        e.target.value = '';
      }
    });
  }
}
