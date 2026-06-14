// PawPau — intro de celebración del Mes del Orgullo (julio): "todo gratis todo gay".
// Standalone (no depende de window.App). Solo se carga en index.html.
//
// Comportamiento:
//  - Auto-play UNA sola vez (primera visita, persistida en localStorage), solo en julio.
//  - Botón [data-pride-replay] para volver a verla cuando se quiera (cualquier mes).
//  - window.playPrideIntro() la dispara desde cualquier parte.
//  - Forzar para probar: añade ?pride a la URL.
//  - Honra fotosensibilidad: flash-off / prefers-reduced-motion / preferencia sin
//    elegir => modo calmo (sin confeti ni destellos). No tapa el aviso de
//    fotosensibilidad: espera a que el usuario elija antes del auto-play.
(function () {
  const FORCE_QS = /[?&]pride\b/.test(location.search);
  const SEEN_KEY = 'prideIntroSeen';
  const PALETTE = ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787', '#ffffff'];

  function isCalm() {
    let flashPref = null;
    try { flashPref = localStorage.getItem('flashPref_v2'); } catch (e) {}
    const prefChosen = flashPref === 'off' || flashPref === 'low' || flashPref === 'full';
    const reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return flashPref === 'off' || reduceMotion || !prefChosen;
  }

  // Construye y muestra la intro. Idempotente: ignora si ya hay una en pantalla.
  function play() {
    if (document.querySelector('.pride-intro')) return;
    const calm = isCalm();

    const overlay = document.createElement('div');
    overlay.className = 'pride-intro' + (calm ? ' pride-intro--calm' : '');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Celebración del Mes del Orgullo');
    overlay.innerHTML = `
      <div class="pride-stripes" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span><span></span>
      </div>
      <div class="pride-content">
        <div class="pride-flag">🏳️‍🌈</div>
        <h2 class="pride-title"><span>todo gratis</span><span>todo gay</span></h2>
        <p class="pride-sub">Feliz Mes del Orgullo 🌈 — con cariño, PawPau</p>
      </div>
      <button class="pride-skip" type="button">Saltar ✕</button>`;
    document.body.appendChild(overlay);

    if (!calm) {
      for (let i = 0; i < 70; i++) {
        const p = document.createElement('div');
        p.className = 'pride-confetti';
        p.style.background = PALETTE[i % PALETTE.length];
        p.style.left = Math.random() * 100 + 'vw';
        p.style.setProperty('--x', (Math.random() * 220 - 110) + 'px');
        p.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
        p.style.setProperty('--dur', (1.8 + Math.random() * 1.6) + 's');
        p.style.setProperty('--delay', (Math.random() * 0.8) + 's');
        p.style.width = (6 + Math.random() * 8) + 'px';
        p.style.height = (8 + Math.random() * 12) + 'px';
        overlay.appendChild(p);
      }
    }

    let closed = false;
    function dismiss() {
      if (closed) return;
      closed = true;
      clearTimeout(autoTimer);
      document.removeEventListener('keydown', onKey);
      overlay.classList.add('pride-intro--out');
      overlay.addEventListener('animationend', () => overlay.remove(), { once: true });
      setTimeout(() => overlay.remove(), 800); // respaldo si no dispara animationend
    }
    function onKey(e) { if (e.key === 'Escape') dismiss(); }

    overlay.querySelector('.pride-skip').addEventListener('click', dismiss);
    overlay.addEventListener('click', e => {
      if (e.target === overlay || e.target.classList.contains('pride-content')) dismiss();
    });
    document.addEventListener('keydown', onKey);
    const autoTimer = setTimeout(dismiss, calm ? 4200 : 3400);
  }

  // API pública + botón(es) de "volver a ver".
  window.playPrideIntro = play;
  document.querySelectorAll('[data-pride-replay]').forEach(btn => {
    btn.addEventListener('click', e => { e.preventDefault(); play(); });
  });

  // Auto-play: primera visita + julio. ?pride lo fuerza siempre (para probar).
  if (FORCE_QS) { play(); return; }
  if (new Date().getMonth() !== 6) return; // 6 = julio

  let seen = false;
  try { seen = localStorage.getItem(SEEN_KEY) === '1'; } catch (e) {}
  if (seen) return;

  function runFirstTime() {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch (e) {}
    play();
  }

  // Si el aviso de fotosensibilidad sigue visible, esperamos a que el usuario
  // elija (se oculta) antes de lanzar la intro, para no taparlo.
  const photoWarn = document.getElementById('photoWarn');
  if (photoWarn && !photoWarn.hidden) {
    const obs = new MutationObserver(() => {
      if (photoWarn.hidden) { obs.disconnect(); runFirstTime(); }
    });
    obs.observe(photoWarn, { attributes: true, attributeFilter: ['hidden'] });
  } else {
    runFirstTime();
  }
})();
