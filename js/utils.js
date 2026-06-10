// Utilidades globales (cargado como script regular, sin modules)
// Funciona vía file:// y vía servidor HTTP
window.App = window.App || {};

App.$ = id => document.getElementById(id);

App.randomInt = function (max) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
};

App.shuffle = function (arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = App.randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

App.escapeHtml = function (s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
};

App.parseParticipantes = function (text, permitirRepetidos = false) {
  const raw = text.split('\n').map(s => s.trim()).filter(s => s.length > 0);
  return permitirRepetidos ? raw : [...new Set(raw)];
};

App.showErr = function (elId, msg, ms = 4500) {
  const e = App.$(elId);
  if (!e) return;
  e.textContent = msg;
  e.classList.remove('hidden');
  clearTimeout(e._timer);
  e._timer = setTimeout(() => e.classList.add('hidden'), ms);
};

App.spawnConfetti = function (originEl, count = 28, colors) {
  if (!originEl) return;
  const rect = originEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const palette = colors || ['#fbbf24','#f43f5e','#22d3ee','#7c5cff','#10b981','#f59e0b','#fb923c'];
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = 'confetti-piece';
    c.style.background = palette[i % palette.length];
    c.style.left = cx + 'px';
    c.style.top = cy + 'px';
    const angle = (Math.PI * 2) * (i / count) + (Math.random() - 0.5) * 0.4;
    const dist = 90 + Math.random() * 160;
    c.style.setProperty('--x', Math.cos(angle) * dist + 'px');
    c.style.setProperty('--y', (Math.sin(angle) * dist - 60) + 'px');
    c.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
    c.style.width = (6 + Math.random() * 8) + 'px';
    c.style.height = (8 + Math.random() * 10) + 'px';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 1500);
  }
};

App.colorFromString = function (str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

App.initials = function (name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Baraja el contenido de un textarea. Devuelve false si la lista está vacía.
App.mezclar = function (textareaId, permitir = false) {
  const el = App.$(textareaId);
  if (!el) return false;
  const lista = App.parseParticipantes(el.value, permitir);
  if (lista.length === 0) return false;
  el.value = App.shuffle(lista).join('\n');
  return true;
};

// Lanza varias oleadas de confetti escalonadas. waves = [[count, delayMs], ...]
App.confettiVolley = function (el, waves) {
  waves.forEach(([count, delay]) => {
    if (delay) setTimeout(() => App.spawnConfetti(el, count), delay);
    else App.spawnConfetti(el, count);
  });
};

// ===== Modales: abrir/cerrar con focus trap + restauración de foco =====
let _modalLastFocus = null;
let _modalTrap = null;

function _focusables(modal) {
  return Array.from(modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )).filter(el => !el.disabled && el.offsetParent !== null);
}

App.openModal = function (modal) {
  if (!modal) return;
  _modalLastFocus = document.activeElement;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  const f = _focusables(modal);
  if (f.length) f[0].focus();
  _modalTrap = function (e) {
    if (e.key !== 'Tab') return;
    const list = _focusables(modal);
    if (!list.length) return;
    const first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', _modalTrap, true);
};

App.closeModal = function (modal) {
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (_modalTrap) { document.removeEventListener('keydown', _modalTrap, true); _modalTrap = null; }
  if (_modalLastFocus && _modalLastFocus.focus) { try { _modalLastFocus.focus(); } catch (e) {} }
  _modalLastFocus = null;
};
