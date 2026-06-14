// PawPau — intro Star Wars Day (mayo): "May the Force be with you". Solo index.html.
// Silueta Sith + ignición de sable + zumbido sintetizado (WebAudio, sin archivos).
// Lógica de gating/calm/replay vive en seasonal-core.js (carga antes que este).
(function () {
  // ===== Audio: síntesis WebAudio (sin archivos externos) =====
  let ctx = null, master = null;
  function getCtx() {
    if (ctx) return ctx;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        ctx = new Ctx();
        master = ctx.createGain();
        master.gain.value = 0.55;
        master.connect(ctx.destination);
      }
    } catch (e) { ctx = null; }
    return ctx;
  }
  // Ignición: zap ascendente corto antes del zumbido.
  function playIgnite(c, t0) {
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, t0);
    osc.frequency.exponentialRampToValueAtTime(180, t0 + 0.18);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(400, t0);
    lp.frequency.exponentialRampToValueAtTime(1400, t0 + 0.18);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.18, t0 + 0.04);
    g.gain.linearRampToValueAtTime(0.0, t0 + 0.22);
    osc.connect(lp); lp.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + 0.25);
  }
  // Zumbido: 3 sawtooth + LFO, lowpass.
  function playHum(c, t0, dur) {
    const osc1 = c.createOscillator(); osc1.type = 'sawtooth'; osc1.frequency.value = 86;
    const osc2 = c.createOscillator(); osc2.type = 'sawtooth'; osc2.frequency.value = 172;
    const osc3 = c.createOscillator(); osc3.type = 'triangle'; osc3.frequency.value = 258;
    const lfo = c.createOscillator(); lfo.frequency.value = 4.4;
    const lfoG = c.createGain(); lfoG.gain.value = 2.6;
    lfo.connect(lfoG); lfoG.connect(osc1.frequency); lfoG.connect(osc2.frequency);
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 1300; filter.Q.value = 1.4;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.085, t0 + 0.35);
    g.gain.setValueAtTime(0.085, t0 + dur - 0.7);
    g.gain.linearRampToValueAtTime(0, t0 + dur);
    osc1.connect(filter); osc2.connect(filter); osc3.connect(filter);
    filter.connect(g); g.connect(master);
    osc1.start(t0); osc2.start(t0); osc3.start(t0); lfo.start(t0);
    osc1.stop(t0 + dur); osc2.stop(t0 + dur); osc3.stop(t0 + dur); lfo.stop(t0 + dur);
  }
  function playSequence() {
    const c = getCtx();
    if (!c) return;
    if (c.state === 'suspended') { try { c.resume(); } catch (e) {} }
    const t0 = c.currentTime + 0.02;
    playIgnite(c, t0 + 1.35);
    playHum(c, t0 + 1.45, 4.6);
  }
  function stopAudio() {
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    try {
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + 0.2);
      setTimeout(() => { if (master) master.gain.value = 0.55; }, 250);
    } catch (e) {}
  }

  function run() {
    if (Seasonal.isActive()) return;
    const calm = Seasonal.isCalm();

    const overlay = document.createElement('div');
    overlay.className = 'seasonal-overlay sw-intro';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'May the Force be with you');
    overlay.innerHTML = `
      <button type="button" class="sw-skip seasonal-skip" aria-label="Saltar intro">Saltar ✕</button>
      <div class="sw-stage" aria-hidden="true">
        <div class="sw-sith">
          <span class="sw-sith-cape"></span>
          <span class="sw-sith-body"></span>
          <span class="sw-sith-hood"></span>
          <span class="sw-sith-eyes"></span>
          <span class="sw-sith-arm"></span>
          <div class="sw-sith-saber">
            <span class="sw-sith-hilt"></span>
            <span class="sw-sith-blade"></span>
          </div>
        </div>
        <div class="sw-ignite-glow"></div>
      </div>
      <h2 class="sw-text">May the Force be with you</h2>
      <p class="sw-sub">★ Mayo · Día de Star Wars ★</p>`;
    document.body.appendChild(overlay);

    if (!calm) playSequence();

    Seasonal.lifecycle(overlay, 'sw-intro--out', 5400, stopAudio);
  }

  Seasonal.register({
    run: run,
    month: 4,                 // mayo
    forceParam: 'starwars',
    ctaLabel: '⚔️ <span>Ver intro</span>',
    ctaClass: 'seasonal-cta--sw',
  });
})();
