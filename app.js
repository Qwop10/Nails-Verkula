// ── Phone mask ────────────────────────────────────────────────
function initPhoneMask() {
  const inp = document.getElementById('inp-phone');
  if (!inp) return;

  function applyMask() {
    let digits = inp.value.replace(/\D/g, '');
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (digits.length > 0 && !digits.startsWith('7')) digits = '7' + digits;
    digits = digits.slice(0, 11);
    if (!digits) { inp.value = ''; return; }
    let out = '+7';
    if (digits.length > 1) out += ' (' + digits.slice(1, 4);
    if (digits.length > 4) out += ') ' + digits.slice(4, 7);
    if (digits.length > 7) out += '-' + digits.slice(7, 9);
    if (digits.length > 9) out += '-' + digits.slice(9, 11);
    inp.value = out;
  }

  inp.addEventListener('input', applyMask);
  inp.addEventListener('focus', () => { if (!inp.value) inp.value = '+7'; });
  inp.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && (inp.value === '+7' || inp.value === '')) e.preventDefault();
  });
}

// ── Admin schedule (по дням) ──────────────────────────────────
const DAY_NAMES_FULL = { 'Пн':'Понедельник','Вт':'Вторник','Ср':'Среда','Чт':'Четверг','Пт':'Пятница','Сб':'Суббота','Вс':'Воскресенье' };

const schedData = {
  'Пн': { active: true,  slots: ['10:00','12:00'] },
  'Вт': { active: true,  slots: ['10:00','12:00'] },
  'Ср': { active: true,  slots: ['10:00','12:00'] },
  'Чт': { active: true,  slots: ['10:00','12:00'] },
  'Пт': { active: true,  slots: ['10:00','12:00'] },
  'Сб': { active: false, slots: [] },
  'Вс': { active: false, slots: [] },
};
let schedCurrentDay = 'Пн';

function schedSelectDay(day, el) {
  schedCurrentDay = day;
  document.querySelectorAll('#sched-day-tabs .sched-day-tab').forEach(t => t.classList.remove('on'));
  el.classList.add('on');
  schedRender();
}

function schedRender() {
  const day = schedData[schedCurrentDay];
  const toggle = document.getElementById('sched-day-toggle');
  const label  = document.getElementById('sched-day-label');
  const cont   = document.getElementById('sched-slots');
  if (!toggle || !label || !cont) return;

  const fullName = DAY_NAMES_FULL[schedCurrentDay];
  label.textContent = fullName + (day.active ? ' — рабочий день' : ' — выходной');
  toggle.classList.toggle('on', day.active);

  cont.innerHTML = '';
  day.slots.forEach((t, i) => {
    const el = document.createElement('div');
    el.className = 'slot slot-on';
    el.innerHTML = t + '<span style="margin-left:4px;opacity:.55;font-size:10px;cursor:pointer" onclick="schedRemoveSlot(' + i + ')">✕</span>';
    cont.appendChild(el);
  });

  schedCancelAdd();
}

function schedToggleDay() {
  const day = schedData[schedCurrentDay];
  day.active = !day.active;
  // Обновляем вкладку дня
  document.querySelectorAll('#sched-day-tabs .sched-day-tab').forEach(el => {
    if (el.textContent.trim().startsWith(schedCurrentDay)) {
      el.classList.toggle('off', !day.active);
    }
  });
  schedRender();
}

function schedShowAdd() {
  document.getElementById('sched-add-form').style.display = 'flex';
  document.getElementById('sched-add-btn').style.display  = 'none';
  document.getElementById('sched-time-inp').focus();
}

function schedCancelAdd() {
  const form = document.getElementById('sched-add-form');
  const btn  = document.getElementById('sched-add-btn');
  if (form) form.style.display = 'none';
  if (btn)  btn.style.display  = '';
}

function schedConfirmAdd() {
  const inp = document.getElementById('sched-time-inp');
  const val = inp ? inp.value : '';
  if (!val) return;
  const day = schedData[schedCurrentDay];
  if (!day.slots.includes(val)) {
    day.slots.push(val);
    day.slots.sort(); // HH:MM сортируется лексически = хронологически
  }
  if (inp) inp.value = '';
  schedRender();
}

function schedRemoveSlot(idx) {
  schedData[schedCurrentDay].slots.splice(idx, 1);
  schedRender();
}

// ── Viewport lock (предотвращает прыжки при открытии клавиатуры) ──
(function () {
  const wrap = document.querySelector('.phone-wrap');
  if (!wrap) return;

  function lockHeight(h) {
    wrap.style.height = h + 'px';
  }

  const tg = window.Telegram?.WebApp;
  if (tg) {
    // viewportStableHeight — высота БЕЗ клавиатуры, не меняется при её открытии
    tg.ready();
    lockHeight(tg.viewportStableHeight || window.innerHeight);
    tg.onEvent('viewportChanged', function () {
      // Обновляем только если клавиатура закрыта (стабильное состояние)
      if (tg.viewportStableHeight) lockHeight(tg.viewportStableHeight);
    });
  } else {
    // Вне Telegram: фиксируем начальную высоту, не трогаем при ресайзе
    lockHeight(window.innerHeight);
  }

  // Скролл к инпуту внутри контейнера — без сдвига всей страницы
  document.addEventListener('focusin', function (e) {
    if (!e.target.matches('input, textarea')) return;
    setTimeout(function () {
      e.target.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }, 100);
  }, true);
})();

// ── Telegram WebApp init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    const user = tg.initDataUnsafe?.user;
    if (user) {
      if (user.username) {
        document.getElementById('inp-tg').value = '@' + user.username;
      }
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
      if (fullName) {
        document.getElementById('inp-name').value = fullName;
      }
      updateProfileUI(fullName, user.username);
    }
  }
  renderCal();
  initPhoneMask();
  schedRender();
  initServicesAdmin();
  initAdminModal();
});

function updateProfileUI(name, username) {
  const initial = name ? name[0].toUpperCase() : '?';
  setText('profile-avatar', initial);
  setText('profile-name', name || '—');
  setText('profile-contacts', username ? '@' + username : '—');
  setText('s4-tg', username ? '@' + username : '—');
}

// ── Navigation ──────────────────────────────────────────────
function goTo(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  const switcher = document.getElementById('role-switcher');
  if (switcher) switcher.style.display = (id === 's9') ? 'none' : 'flex';

  if (id === 's4') syncS4();
  if (id === 's5') syncS5();
  if (id === 's6') syncS6();
  if (id === 's7') syncS7();
}

// ── Modal ────────────────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}
function closeModalOutside(e, id) {
  if (e.target === e.currentTarget) closeModal(id);
}

// ── Service selection (client) ───────────────────────────────
let mainService = { label: 'Комбинированный маникюр', price: 1500 };
let addonService = { label: 'Дизайн', price: 300 };

const CHECK_SVG = '<svg width="11" height="11" viewBox="0 0 9 9" fill="none"><polyline points="1.5,4.5 3.5,6.5 7.5,2.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>';

function updateTotal() {
  const total = mainService.price + addonService.price;
  const label = addonService.label
    ? shortLabel(mainService.label) + ' + ' + addonService.label
    : shortLabel(mainService.label);
  setText('selection-label', label);
  setText('selection-price', fmt(total));
  setText('total-display', fmt(total));
}

function shortLabel(l) {
  return l
    .replace('Комбинированный', 'Комб.')
    .replace('Гелевое покрытие с укреплением', 'Гел. покрытие с укреп.')
    .replace('Наращивание', 'Наращ.');
}

function selectMain(el, label, price) {
  document.querySelectorAll('#s2 .pc').forEach(c => {
    const cb = c.querySelector('.cb');
    if (cb && cb.classList.contains('on') && !cb.classList.contains('auto') && c !== el) {
      c.classList.remove('sel');
      cb.className = 'cb off';
      cb.innerHTML = '';
    }
  });
  el.classList.add('sel');
  const cb = el.querySelector('.cb');
  cb.className = 'cb on';
  cb.innerHTML = CHECK_SVG;
  mainService = { label, price };
  updateTotal();
}

function selectAddon(el, label, price) {
  document.querySelectorAll('#s2 .pc').forEach(c => {
    if (c !== el && !c.querySelector('.pf') && !c.style.opacity) {
      const cb = c.querySelector('.cb.on');
      if (cb && !cb.classList.contains('auto')) {
        c.classList.remove('sel');
        cb.className = 'cb off';
        cb.innerHTML = '';
      }
    }
  });
  const isNowSelected = !el.classList.contains('sel');
  el.classList.toggle('sel', isNowSelected);
  const cb = el.querySelector('.cb');
  if (isNowSelected) {
    cb.className = 'cb on';
    cb.innerHTML = CHECK_SVG;
    addonService = { label, price };
  } else {
    cb.className = 'cb off';
    cb.innerHTML = '';
    addonService = { label: '', price: 0 };
  }
  updateTotal();
}

// ── Calendar ─────────────────────────────────────────────────
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let selDay = null;
let selTime = '10:00';

const MONTHS_RU  = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MONTHS_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

function renderCal() {
  setText('cal-title', MONTHS_RU[calMonth] + ' ' + calYear);
  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';

  ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].forEach((d, i) => {
    const span = document.createElement('span');
    span.className = 'cal-dow' + (i >= 5 ? ' wknd' : '');
    span.textContent = d;
    grid.appendChild(span);
  });

  const firstDow = new Date(calYear, calMonth, 1).getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;
  for (let i = 0; i < startOffset; i++) {
    const span = document.createElement('span');
    span.className = 'cal-day empty';
    grid.appendChild(span);
  }

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let d = 1; d <= daysInMonth; d++) {
    const dow = (startOffset + d - 1) % 7;
    const isWknd = dow >= 5;
    const date = new Date(calYear, calMonth, d);
    const isPast = date < today;

    const span = document.createElement('span');
    let cls = 'cal-day';
    if (isWknd) cls += ' wknd-day';
    if (isPast) cls += ' past';
    if (d === selDay) cls += ' sel';
    if (date.getTime() === today.getTime()) cls += ' today';
    span.className = cls;
    span.textContent = d;

    if (!isPast && !isWknd) {
      span.onclick = () => {
        selDay = d;
        const label = d + ' ' + MONTHS_GEN[calMonth];
        setText('sel-date-label', label);
        setText('confirm-datetime', label + ' · ' + selTime + ' ✓');
        renderCal();
      };
    }
    grid.appendChild(span);
  }
}

function prevMonth() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCal();
}
function nextMonth() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCal();
}

// ── Time slots ───────────────────────────────────────────────
function selectTime(el, time) {
  document.querySelectorAll('#time-slots .slot').forEach(s => {
    if (!s.classList.contains('slot-taken')) s.className = 'slot slot-off';
  });
  el.className = 'slot slot-on';
  selTime = time;
  const dateLabel = document.getElementById('sel-date-label').textContent;
  setText('confirm-datetime', dateLabel + ' · ' + time + ' ✓');
}

// ── Helpers ───────────────────────────────────────────────────
function fmt(n) { return n.toLocaleString('ru-RU') + ' ₽'; }

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function getDateLabel() {
  return selDay ? selDay + ' ' + MONTHS_GEN[calMonth] : '—';
}

function getServiceLabel() {
  return addonService.label
    ? shortLabel(mainService.label) + ' + ' + addonService.label
    : shortLabel(mainService.label);
}

// ── Screen sync ───────────────────────────────────────────────
function syncS4() {
  const dateLabel = getDateLabel();
  const wishes = document.getElementById('wishes-input')?.value || '—';
  const tg = document.getElementById('inp-tg')?.value || '—';
  setText('s4-summary', dateLabel + '\n' + getServiceLabel());
  setText('s4-wishes', wishes);
  setText('s4-tg', tg);
}

function syncS5() {
  const total = mainService.price + addonService.price;
  setText('s5-service', mainService.label);
  setText('s5-addon', addonService.label || 'Без доп. услуги');
  setText('s5-date', getDateLabel() + ' · ' + selTime);
  setText('s5-balance', 'Остаток на месте: ' + fmt(total - 500) + ' · Итого: ' + fmt(total));
}

function syncS6() {
  const total = mainService.price + addonService.price;
  setText('s6-summary', getDateLabel() + '\n' + getServiceLabel());
  setText('s6-remainder', fmt(total - 500));
  setText('s6-total', fmt(total));
}

function syncS7() {
  const total = mainService.price + addonService.price;
  const wishes = document.getElementById('wishes-input')?.value || '—';
  setText('s7-datetime', getDateLabel() + ' · ' + selTime);
  setText('s7-service', getServiceLabel());
  setText('s7-wishes', wishes);
  setText('s7-price', fmt(total));
  setText('cancel-info', getDateLabel() + ' · ' + selTime + ' — ' + getServiceLabel());
}

// ── Admin modal: выбор времени ────────────────────────────────
function selectAdminSlot(el) {
  document.querySelectorAll('#admin-time-slots .slot').forEach(s => {
    if (!s.classList.contains('slot-taken')) s.className = 'slot slot-off';
  });
  el.className = 'slot slot-on';
}

// ── Admin modal: управление списком услуг ─────────────────────
function initAdminModal() {
  _initPickerManage('admin-main-picker', 'modal-main');
  _initPickerManage('admin-addon-picker', 'modal-addon');
}

function _initPickerManage(pickerId, formId) {
  const picker = document.getElementById(pickerId);
  if (!picker) return;

  // Кнопки удаления на каждом варианте (кроме «Без доп. услуги»)
  picker.querySelectorAll('.svc-opt:not(.svc-none)').forEach(opt => _addOptDel(opt));

  // Кнопка «+ Добавить» в конце пикера
  const addBtn = document.createElement('button');
  addBtn.className = 'modal-svc-add-btn';
  addBtn.textContent = '+ Добавить услугу в список';
  addBtn.onclick = function (e) {
    e.stopPropagation();
    const form = document.getElementById(formId);
    form.style.display = form.style.display === 'flex' ? 'none' : 'flex';
  };
  picker.appendChild(addBtn);

  // Форма добавления (вставляем ПОСЛЕ пикера в DOM)
  const form = document.createElement('div');
  form.id = formId;
  form.className = 'modal-svc-form';
  form.innerHTML =
    '<input class="inp" id="' + formId + '-name" placeholder="Название" style="font-size:12px;margin-bottom:6px">' +
    '<div style="display:flex;gap:6px;align-items:center;margin-bottom:8px">' +
      '<input class="inp" id="' + formId + '-price" type="number" placeholder="Цена" style="width:90px;font-size:12px">' +
      '<span style="font-size:11px;color:#b09050">₽</span>' +
    '</div>' +
    '<div style="display:flex;gap:6px">' +
      '<button onclick="_modalSvcAdd(\'' + pickerId + '\',\'' + formId + '\')" style="flex:1;background:#c9a84c;color:#fff;border:none;border-radius:8px;padding:7px;font-size:12px;cursor:pointer;font-family:\'Inter\',sans-serif">Добавить</button>' +
      '<button onclick="document.getElementById(\'' + formId + '\').style.display=\'none\'" style="background:none;border:.5px solid #d4b878;border-radius:8px;padding:7px 12px;font-size:12px;color:#b09050;cursor:pointer;font-family:\'Inter\',sans-serif">Отмена</button>' +
    '</div>';
  picker.insertAdjacentElement('afterend', form);
}

function _addOptDel(opt) {
  if (opt.querySelector('.opt-del')) return;
  const btn = document.createElement('button');
  btn.className = 'opt-del';
  btn.innerHTML = '×';
  btn.title = 'Удалить из списка';
  btn.onclick = function (e) {
    e.stopPropagation();
    opt.style.transition = 'opacity .2s, max-height .25s';
    opt.style.overflow = 'hidden';
    opt.style.maxHeight = opt.offsetHeight + 'px';
    requestAnimationFrame(() => { opt.style.opacity = '0'; opt.style.maxHeight = '0'; });
    setTimeout(() => opt.remove(), 260);
  };
  opt.appendChild(btn);
}

function _modalSvcAdd(pickerId, formId) {
  const name  = (document.getElementById(formId + '-name')?.value  || '').trim();
  const price = parseInt(document.getElementById(formId + '-price')?.value || '0') || 0;
  if (!name) { document.getElementById(formId + '-name')?.focus(); return; }

  const picker = document.getElementById(pickerId);
  const isAddon = pickerId === 'admin-addon-picker';
  const fn = isAddon ? 'pickAdminAddon' : 'pickAdminMain';

  const opt = document.createElement('div');
  opt.className = 'svc-opt';
  opt.innerHTML = '<span>' + name + '</span><span class="svc-price">' + fmt(price) + '</span>';
  opt.onclick = function () {
    isAddon ? pickAdminAddon(opt, name, price) : pickAdminMain(opt, name, price);
  };
  _addOptDel(opt);

  // Вставляем перед кнопкой «+ Добавить»
  const addBtn = picker.querySelector('.modal-svc-add-btn');
  picker.insertBefore(opt, addBtn);

  document.getElementById(formId + '-name').value  = '';
  document.getElementById(formId + '-price').value = '';
  document.getElementById(formId).style.display = 'none';
}

// ── Admin edit modal ──────────────────────────────────────────
let adminMain = { label: 'Комбинированный маникюр', price: 1500 };
let adminAddon = { label: 'Дизайн', price: 300 };

function togglePicker(id) {
  // Close any other open pickers first
  document.querySelectorAll('.svc-picker.open').forEach(p => {
    if (p.id !== id) p.classList.remove('open');
  });
  document.getElementById(id)?.classList.toggle('open');
}

function pickAdminMain(el, label, price) {
  adminMain = { label, price };
  setText('admin-main-label', label);
  setText('admin-main-price', fmt(price));
  el.closest('.svc-picker').querySelectorAll('.svc-opt').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('admin-main-picker').classList.remove('open');
  updateAdminTotal();
}

function pickAdminAddon(el, label, price) {
  adminAddon = { label, price };
  const card = document.getElementById('admin-addon-selected');
  if (label) {
    setText('admin-addon-label', label);
    setText('admin-addon-price', fmt(price));
    card.style.border = '1.5px solid #c9a84c';
  } else {
    setText('admin-addon-label', 'Без доп. услуги');
    setText('admin-addon-price', '—');
    card.style.border = '.5px solid #f0d888';
  }
  el.closest('.svc-picker').querySelectorAll('.svc-opt').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('admin-addon-picker').classList.remove('open');
  updateAdminTotal();
}

function updateAdminTotal() {
  setText('admin-total', fmt(adminMain.price + adminAddon.price));
}

// ── Services admin (add / delete) ────────────────────────────
const TRASH_SVG = '<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 3h10M4.5 3V2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1M4.5 5.5v4M8.5 5.5v4M2.5 3l.6 7a.5.5 0 0 0 .5.5h5.8a.5.5 0 0 0 .5-.5l.6-7"/></svg>';

let _delBtn = null;

function initServicesAdmin() {
  // Добавляем кнопки удаления ко всем существующим строкам
  document.querySelectorAll('#tab-services .svc-row').forEach(row => _appendDelBtn(row));

  // Вставляем форму добавления после секций Основные и Дополнительные
  const pcs = Array.from(document.querySelectorAll('#tab-services .pc'))
    .filter(pc => pc.querySelector('.svc-toggle'));

  ['main', 'addon'].forEach((type, i) => {
    if (!pcs[i]) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'svc-add-wrapper';
    wrapper.innerHTML =
      '<div id="add-svc-form-' + type + '" class="svc-add-form">' +
        '<input class="inp" id="add-svc-name-' + type + '" placeholder="Название услуги" style="font-size:13px">' +
        '<div style="display:flex;gap:8px;align-items:center">' +
          '<input class="inp" id="add-svc-price-' + type + '" type="number" placeholder="Цена" style="width:100px;font-size:13px">' +
          '<span style="font-size:12px;color:#b09050">₽</span>' +
        '</div>' +
        '<div style="display:flex;gap:8px">' +
          '<button onclick="addSvcConfirm(\'' + type + '\')" style="flex:1;background:#c9a84c;color:#fff;border:none;border-radius:8px;padding:8px;font-size:12px;cursor:pointer;font-family:\'Inter\',sans-serif">Добавить</button>' +
          '<button onclick="addSvcCancel(\'' + type + '\')" style="background:none;border:.5px solid #d4b878;border-radius:8px;padding:8px 14px;font-size:12px;color:#b09050;cursor:pointer;font-family:\'Inter\',sans-serif">Отмена</button>' +
        '</div>' +
      '</div>' +
      '<button class="svc-add-btn" onclick="addSvcShow(\'' + type + '\')">+ Добавить услугу</button>';
    pcs[i].insertAdjacentElement('afterend', wrapper);
  });
}

function _appendDelBtn(row) {
  if (row.querySelector('.svc-del-btn')) return;
  const btn = document.createElement('button');
  btn.className = 'svc-del-btn';
  btn.innerHTML = TRASH_SVG;
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    _svcDeleteStep(btn, row);
  });
  row.appendChild(btn);
}

function _svcDeleteStep(btn, row) {
  // Сброс предыдущей кнопки если нажали другую
  if (_delBtn && _delBtn !== btn) _svcReset(_delBtn);

  const step = parseInt(btn.dataset.step || '0');
  if (step === 0) {
    btn.dataset.step = '1';
    btn.classList.add('warn');
    btn.textContent = 'Удалить?';
    _delBtn = btn;
  } else if (step === 1) {
    btn.dataset.step = '2';
    btn.classList.remove('warn');
    btn.classList.add('danger');
    btn.textContent = 'Да, удалить';
  } else {
    // Анимация исчезновения, потом удаление из DOM
    row.style.transition = 'opacity .22s, max-height .28s, padding .28s';
    row.style.overflow = 'hidden';
    row.style.maxHeight = row.offsetHeight + 'px';
    requestAnimationFrame(() => {
      row.style.opacity = '0';
      row.style.maxHeight = '0';
      row.style.paddingTop = '0';
      row.style.paddingBottom = '0';
    });
    setTimeout(() => row.remove(), 300);
    _delBtn = null;
  }
}

function _svcReset(btn) {
  if (!btn) return;
  btn.dataset.step = '0';
  btn.classList.remove('warn', 'danger');
  btn.innerHTML = TRASH_SVG;
  _delBtn = null;
}

// Клик в стороне — сброс состояния удаления
document.addEventListener('click', () => { if (_delBtn) _svcReset(_delBtn); });

function addSvcShow(type) {
  document.getElementById('add-svc-form-' + type).style.display = 'flex';
}
function addSvcCancel(type) {
  document.getElementById('add-svc-form-' + type).style.display = 'none';
}
function addSvcConfirm(type) {
  const nameInp  = document.getElementById('add-svc-name-' + type);
  const priceInp = document.getElementById('add-svc-price-' + type);
  const name  = nameInp ? nameInp.value.trim() : '';
  const price = priceInp ? parseInt(priceInp.value) || 0 : 0;
  if (!name) { if (nameInp) nameInp.focus(); return; }

  const pcs = Array.from(document.querySelectorAll('#tab-services .pc'))
    .filter(pc => pc.querySelector('.svc-toggle'));
  const pc = type === 'main' ? pcs[0] : pcs[1];
  if (!pc) return;

  const row = document.createElement('div');
  row.className = 'svc-row';
  row.innerHTML =
    '<div style="flex:1">' +
      '<div class="pn">' + name + '</div>' +
      (price ? '<div style="display:flex;align-items:center;gap:8px;margin-top:4px"><input class="inp" value="' + price + '" type="number" style="width:90px;padding:6px 10px;font-size:13px"> <span style="font-size:12px;color:#b09050">₽</span></div>' : '') +
    '</div>' +
    '<div class="svc-toggle on" onclick="this.classList.toggle(\'on\')"></div>';
  _appendDelBtn(row);
  pc.appendChild(row);

  nameInp.value = '';
  if (priceInp) priceInp.value = '';
  addSvcCancel(type);
}

// ── Admin tabs ────────────────────────────────────────────────
const ADMIN_TABS = ['tab-requests', 'tab-services', 'tab-report', 'tab-profile'];

function switchAdminTab(idx) {
  ADMIN_TABS.forEach((id, i) => {
    const tab = document.getElementById(id);
    const nav = document.getElementById('admin-nav-' + i);
    if (tab) tab.classList.toggle('active', i === idx);
    if (nav) nav.classList.toggle('on', i === idx);
  });
}

// ── Report period ─────────────────────────────────────────────
const REPORT_DATA = {
  day:   { revenue: '0 ₽',     visits: '0',  avg: '—' },
  week:  { revenue: '0 ₽',     visits: '0',  avg: '—' },
  month: { revenue: '0 ₽',     visits: '0',  avg: '—' },
  year:  { revenue: '0 ₽',     visits: '0',  avg: '—' },
};

function setPeriod(btn, period) {
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  const d = REPORT_DATA[period];
  setText('rep-revenue', d.revenue);
  setText('rep-visits',  d.visits);
  setText('rep-avg',     d.avg);
}
