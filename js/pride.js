// PawPau — intro Mes del Orgullo (junio): "todo gratis todo gay". Solo index.html.
// Lógica de gating/calm/replay vive en seasonal-core.js (carga antes que este).
(function () {
  const PALETTE = ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787', '#ffffff'];

  function run() {
    if (Seasonal.isActive()) return;
    const calm = Seasonal.isCalm();

    const overlay = document.createElement('div');
    overlay.className = 'seasonal-overlay pride-intro' + (calm ? ' pride-intro--calm' : '');
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
      <button class="pride-skip seasonal-skip" type="button">Saltar ✕</button>`;
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

    Seasonal.lifecycle(overlay, 'pride-intro--out', calm ? 4200 : 3400);
  }

  Seasonal.register({
    run: run,
    month: 5,                 // junio
    forceParam: 'pride',
    ctaLabel: '🏳️‍🌈 <span>Ver intro</span>',
    ctaClass: 'seasonal-cta--pride',
  });
})();
