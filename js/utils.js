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

App.nextPow2 = function (n) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
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
