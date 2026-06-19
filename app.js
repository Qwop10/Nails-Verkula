// ── Navigation ──────────────────────────────────────────────
function goTo(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  const switcher = document.getElementById('role-switcher');
  if (switcher) switcher.style.display = (id === 's9') ? 'none' : 'flex';
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

// ── Service selection ────────────────────────────────────────
let mainService = { label: 'Комбинированный маникюр', price: 1500 };
let addonService = { label: 'Дизайн', price: 300 };

const CHECK_SVG = '<svg width="11" height="11" viewBox="0 0 9 9" fill="none"><polyline points="1.5,4.5 3.5,6.5 7.5,2.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>';

function updateTotal() {
  const total = mainService.price + addonService.price;
  const short = mainService.label
    .replace('Комбинированный', 'Комб.')
    .replace('Гелевое покрытие с укреплением', 'Гел. покрытие')
    .replace('Наращивание', 'Нараз.');
  const label = addonService.label ? short + ' + ' + addonService.label : short;
  document.getElementById('selection-label').textContent = label;
  document.getElementById('selection-price').textContent = total.toLocaleString('ru-RU') + ' ₽';
  document.getElementById('total-display').textContent = total.toLocaleString('ru-RU') + ' ₽';
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
  const allPc = document.querySelectorAll('#s2 .pc');
  allPc.forEach(c => {
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
  document.getElementById('cal-title').textContent = MONTHS_RU[calMonth] + ' ' + calYear;
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
  today.setHours(0,0,0,0);

  for (let d = 1; d <= daysInMonth; d++) {
    const dow = (startOffset + d - 1) % 7;
    const isWknd = dow >= 5;
    const date = new Date(calYear, calMonth, d);
    const isPast = date < today;
    const isSel = selDay === d && calMonth === new Date().getMonth() || false;

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
        document.getElementById('sel-date-label').textContent = label;
        document.getElementById('confirm-datetime').textContent = label + ' · ' + selTime + ' ✓';
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
    if (!s.classList.contains('slot-taken')) {
      s.className = 'slot slot-off';
    }
  });
  el.className = 'slot slot-on';
  selTime = time;
  const dateLabel = document.getElementById('sel-date-label').textContent;
  document.getElementById('confirm-datetime').textContent = dateLabel + ' · ' + time + ' ✓';
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderCal();
});
