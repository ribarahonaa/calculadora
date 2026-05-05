// PawPau — live status (decapi.me) + navbar dropdown + mobile menu
(function () {
  const CHANNEL = 'pawpau';
  const REFRESH_MS = 60_000;

  const $ = id => document.getElementById(id);

  function setText(el, t) { if (el) el.textContent = t; }
  function setDisplay(el, v) { if (el) el.style.display = v; }
  function toggleClass(el, cls, on) { if (el) el.classList.toggle(cls, on); }

  function eachBadge(fn) {
    document.querySelectorAll('.live-badge').forEach(fn);
  }

  function setOffline() {
    eachBadge(b => {
      b.classList.remove('is-live');
      const lbl = b.querySelector('.live-label');
      if (lbl) lbl.textContent = 'Offline';
    });
    setDisplay($('liveInfo'), 'none');
    document.querySelectorAll('.cta-label').forEach(el => el.textContent = 'Ver canal');
    toggleClass($('navLiveDot'), 'is-live', false);
  }

  function setLive(uptimeText, title, game, viewers) {
    eachBadge(b => {
      b.classList.add('is-live');
      const lbl = b.querySelector('.live-label');
      if (lbl) lbl.textContent = `EN VIVO · ${uptimeText}`;
    });
    setDisplay($('liveInfo'), 'block');
    setText($('liveTitle'), title || 'Transmisión en curso');
    setText($('liveGame'), game || '—');
    setText($('liveViewers'), viewers ? `👁 ${viewers} viendo` : '👁 viewers');
    document.querySelectorAll('.cta-label').forEach(el => el.textContent = 'Ver stream');
    toggleClass($('navLiveDot'), 'is-live', true);
  }

  async function fetchText(url) {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) return null;
      return (await r.text()).trim();
    } catch (e) { return null; }
  }

  async function checkLive() {
    const uptime = await fetchText(`https://decapi.me/twitch/uptime?channel=${CHANNEL}`);
    if (!uptime || /offline/i.test(uptime) || /not live/i.test(uptime) || /404/.test(uptime)) {
      setOffline();
      return;
    }
    const [title, game, viewers] = await Promise.all([
      fetchText(`https://decapi.me/twitch/title/${CHANNEL}`),
      fetchText(`https://decapi.me/twitch/game/${CHANNEL}`),
      fetchText(`https://decapi.me/twitch/viewercount/${CHANNEL}`),
    ]);
    setLive(uptime, title, game, viewers);
  }

  // Navbar scroll state
  function onScroll() {
    const nav = $('navbar');
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 30);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu toggle
  const navToggle = $('navToggle');
  const navLinks = $('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

  // Dropdown toggle (click) — para móvil y accesibilidad teclado
  const dropdown = $('navDropdown');
  const trigger = $('dropdownTrigger');
  if (dropdown && trigger) {
    trigger.addEventListener('click', e => {
      e.stopPropagation();
      const open = dropdown.classList.toggle('open');
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', e => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        dropdown.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // FAB Spotify panel
  const fabSpotifyWrap = $('fabSpotify');
  const spotifyToggle = $('spotifyToggle');
  const spotifyClose = $('spotifyClose');
  if (fabSpotifyWrap && spotifyToggle) {
    spotifyToggle.addEventListener('click', e => {
      e.stopPropagation();
      fabSpotifyWrap.classList.toggle('open');
    });
    if (spotifyClose) {
      spotifyClose.addEventListener('click', e => {
        e.stopPropagation();
        fabSpotifyWrap.classList.remove('open');
      });
    }
    document.addEventListener('click', e => {
      if (!fabSpotifyWrap.contains(e.target)) fabSpotifyWrap.classList.remove('open');
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') fabSpotifyWrap.classList.remove('open');
    });
    // Navbar "Música" link: en lugar de scroll a sección, abrir el panel
    document.querySelectorAll('a[href$="#playlist"]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        fabSpotifyWrap.classList.add('open');
      });
    });
  }

  // Aviso fotosensibilidad
  function applyFlashPref(pref) {
    const root = document.documentElement;
    root.classList.remove('flash-off', 'flash-low', 'flash-full', 'flash-pending');
    root.classList.add('flash-' + pref);
    try { localStorage.setItem('flashPref', pref); } catch (e) {}
  }
  const photoWarn = $('photoWarn');
  if (photoWarn) {
    let stored = null;
    try { stored = localStorage.getItem('flashPref'); } catch (e) {}
    if (stored !== 'off' && stored !== 'low' && stored !== 'full') {
      photoWarn.hidden = false;
    }
    photoWarn.querySelectorAll('[data-flash]').forEach(btn => {
      btn.addEventListener('click', () => {
        applyFlashPref(btn.dataset.flash);
        photoWarn.hidden = true;
      });
    });
  }
  // Trigger global para reabrir desde footer u otros lugares
  window.openPhotoWarn = () => { if (photoWarn) photoWarn.hidden = false; };
  document.querySelectorAll('[data-open-photo-warn]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); window.openPhotoWarn(); });
  });

  // Hero carrousel (manual)
  const heroTrack = $('heroTrack');
  const heroDots = $('heroDots');
  if (heroTrack && heroDots) {
    const slides = Array.from(heroTrack.querySelectorAll('.hero-slide'));
    let idx = 0;

    slides.forEach((slide, i) => {
      const nameEl = slide.querySelector('.hero-name');
      const name = nameEl ? nameEl.textContent.trim() : `Slide ${i + 1}`;
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'hero-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', name);
      dot.setAttribute('data-name', name);
      dot.addEventListener('click', () => go(i));
      heroDots.appendChild(dot);
    });
    const dots = Array.from(heroDots.children);

    function go(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('is-active', k === idx));
      dots.forEach((d, k) => d.classList.toggle('is-active', k === idx));
    }

    const prevBtn = $('heroPrev');
    const nextBtn = $('heroNext');
    if (prevBtn) prevBtn.addEventListener('click', () => go(idx - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => go(idx + 1));

    go(0);
  }

  // ===== Star Wars Day intro (4 de mayo) =====
  // Audio: WebAudio synthesis (no external files)
  let swAudioCtx = null;
  let swMasterGain = null;
  function getSwCtx() {
    if (swAudioCtx) return swAudioCtx;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        swAudioCtx = new Ctx();
        swMasterGain = swAudioCtx.createGain();
        swMasterGain.gain.value = 0.55;
        swMasterGain.connect(swAudioCtx.destination);
      }
    } catch (e) { swAudioCtx = null; }
    return swAudioCtx;
  }
  function swMakeNoise(ctx, dur) {
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  // Ignition: short upward zap before hum
  function swPlayIgnite(ctx, t0) {
    const out = swMasterGain;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, t0);
    osc.frequency.exponentialRampToValueAtTime(180, t0 + 0.18);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(400, t0);
    lp.frequency.exponentialRampToValueAtTime(1400, t0 + 0.18);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.18, t0 + 0.04);
    g.gain.linearRampToValueAtTime(0.0, t0 + 0.22);
    osc.connect(lp); lp.connect(g); g.connect(out);
    osc.start(t0); osc.stop(t0 + 0.25);
  }

  // Hum: 3 sawtooths + LFO wobble, lowpass
  function swPlayHum(ctx, t0, dur) {
    const out = swMasterGain;
    const osc1 = ctx.createOscillator(); osc1.type = 'sawtooth'; osc1.frequency.value = 86;
    const osc2 = ctx.createOscillator(); osc2.type = 'sawtooth'; osc2.frequency.value = 172;
    const osc3 = ctx.createOscillator(); osc3.type = 'triangle'; osc3.frequency.value = 258;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 4.4;
    const lfoG = ctx.createGain(); lfoG.gain.value = 2.6;
    lfo.connect(lfoG); lfoG.connect(osc1.frequency); lfoG.connect(osc2.frequency);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 1300; filter.Q.value = 1.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.085, t0 + 0.35);
    g.gain.setValueAtTime(0.085, t0 + dur - 0.7);
    g.gain.linearRampToValueAtTime(0, t0 + dur);
    osc1.connect(filter); osc2.connect(filter); osc3.connect(filter);
    filter.connect(g); g.connect(out);
    osc1.start(t0); osc2.start(t0); osc3.start(t0); lfo.start(t0);
    osc1.stop(t0 + dur); osc2.stop(t0 + dur); osc3.stop(t0 + dur); lfo.stop(t0 + dur);
  }

  function swPlaySequence() {
    const ctx = getSwCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    const t0 = ctx.currentTime + 0.02;
    swPlayIgnite(ctx, t0 + 1.35);
    swPlayHum(ctx, t0 + 1.45, 4.6);
  }
  function swStopAll() {
    if (!swAudioCtx || !swMasterGain) return;
    const now = swAudioCtx.currentTime;
    try {
      swMasterGain.gain.cancelScheduledValues(now);
      swMasterGain.gain.setValueAtTime(swMasterGain.gain.value, now);
      swMasterGain.gain.linearRampToValueAtTime(0, now + 0.2);
      setTimeout(() => { swMasterGain.gain.value = 0.55; }, 250);
    } catch (e) {}
  }

  function showSwIntro() {
    if (document.documentElement.classList.contains('flash-off')) return;
    const current = $('swIntro');
    if (!current) return;
    // Clone & replace to restart CSS animations cleanly
    const fresh = current.cloneNode(true);
    current.parentNode.replaceChild(fresh, current);
    fresh.hidden = false;
    swPlaySequence();
    const skip = fresh.querySelector('#swSkip');
    const close = () => { fresh.hidden = true; swStopAll(); };
    if (skip) skip.addEventListener('click', close, { once: true });
    setTimeout(close, 6200);
  }
  window.openSwIntro = showSwIntro;
  document.querySelectorAll('[data-open-sw-intro]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); showSwIntro(); });
  });

  function maybeShowSwIntro() {
    const today = new Date();
    if (today.getMonth() !== 4 || today.getDate() !== 4) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (document.documentElement.classList.contains('flash-off')) return;
    try { if (sessionStorage.getItem('swDayShown') === '1') return; } catch (e) {}

    function autoShow() {
      if (document.documentElement.classList.contains('flash-off')) return;
      try { sessionStorage.setItem('swDayShown', '1'); } catch (e) {}
      showSwIntro();
    }

    autoShow();
  }
  maybeShowSwIntro();

  // Init live check
  checkLive();
  setInterval(checkLive, REFRESH_MS);
})();
