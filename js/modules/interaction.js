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
  const rows = (s.shops || []).map((shop, si) => `
    <tr>
      <td class="col-name"><input type="text" data-field="name" data-si="${si}" value="${shop.name || ''}" /></td>
      <td class="col-type"><input type="text" data-field="type" data-si="${si}" value="${shop.type || ''}" /></td>
      <td class="col-area"><input type="number" data-field="area" data-si="${si}" value="${shop.area || 0}" step="0.01" /></td>
      <td class="col-tenant"><input type="text" data-field="tenant" data-si="${si}" value="${shop.tenant || ''}" /></td>
      <td class="col-contact"><input type="text" data-field="contact" data-si="${si}" value="${shop.contact || ''}" /></td>
      <td class="col-date"><input type="text" data-field="openDate" data-si="${si}" value="${shop.openDate || ''}" /></td>
      <td class="col-status">
        <select data-field="status" data-si="${si}">
          <option value="未出租" ${shop.status === '未出租' ? 'selected' : ''}>未出租</option>
          <option value="装修中" ${shop.status === '装修中' ? 'selected' : ''}>装修中</option>
          <option value="营业中" ${shop.status === '营业中' ? 'selected' : ''}>营业中</option>
        </select>
      </td>
      <td class="col-remark"><input type="text" data-field="remark" data-si="${si}" value="${shop.remark || ''}" /></td>
    </tr>
  `).join('');

  shopsContainer.innerHTML = `
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
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  document.getElementById('stationModal').classList.add('active');
  document.getElementById('overlay').classList.add('active');
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

  document.querySelectorAll('#editShops [data-field]').forEach(el => {
    const si = parseInt(el.dataset.si);
    const field = el.dataset.field;
    if (s.shops[si]) {
      if (field === 'area') {
        s.shops[si][field] = parseFloat(el.value) || 0;
      } else {
        s.shops[si][field] = el.value.trim();
      }
    }
  });

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
