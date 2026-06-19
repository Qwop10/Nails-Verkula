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

// ── Admin schedule ────────────────────────────────────────────
function toggleSlot(el) {
  if (el.classList.contains('slot-on')) {
    el.classList.replace('slot-on', 'slot-off');
  } else {
    el.classList.replace('slot-off', 'slot-on');
  }
}

const SLOT_TIMES = ['08:00','09:00','09:30','10:00','10:30','11:00','11:30','12:00','13:00','14:00','14:30','15:00','15:30','16:00','17:00','18:00','19:00','20:00'];
let addSlotIdx = 0;

function addSlot() {
  const container = document.getElementById('admin-slots');
  const addBtn = container.querySelector('[onclick="addSlot()"]');
  // Find next time not already shown
  const shown = Array.from(container.querySelectorAll('.slot')).map(s => s.textContent.trim());
  const next = SLOT_TIMES.find(t => !shown.includes(t));
  if (!next) return;
  const el = document.createElement('div');
  el.className = 'slot slot-on';
  el.textContent = next;
  el.onclick = () => toggleSlot(el);
  container.insertBefore(el, addBtn);
}

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
