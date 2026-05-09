// PawPau — live status (decapi.me) + navbar dropdown + mobile menu
(function () {
  const CHANNEL = 'pawpau';
  const REFRESH_MS = 60_000;

  // Star Wars Day feature flag. Set false to hide intro, FAB, and disable all triggers.
  const SW_DAY_ENABLED = false;

  const $ = id => document.getElementById(id);

  function setText(el, t) { if (el) el.textContent = t; }
  function setDisplay(el, v) { if (el) el.style.display = v; }
  function toggleClass(el, cls, on) { if (el) el.classList.toggle(cls, on); }

  function eachBadge(fn) {
    document.querySelectorAll('.live-badge').forEach(fn);
  }

  function eachLiveInfo(fn) {
    document.querySelectorAll('.live-info').forEach(fn);
  }

  function setOffline() {
    eachBadge(b => {
      b.classList.remove('is-live');
      const lbl = b.querySelector('.live-label');
      if (lbl) lbl.textContent = 'Offline';
    });
    eachLiveInfo(box => { box.style.display = 'none'; });
    document.querySelectorAll('.cta-label').forEach(el => el.textContent = 'Ver canal');
    toggleClass($('navLiveDot'), 'is-live', false);
  }

  function setLive(uptimeText, title, game, viewers) {
    eachBadge(b => {
      b.classList.add('is-live');
      const lbl = b.querySelector('.live-label');
      if (lbl) lbl.textContent = `EN VIVO · ${uptimeText}`;
    });
    const titleText = title || 'Transmisión en curso';
    const gameText = game || '—';
    const viewersText = viewers ? `👁 ${viewers} viendo` : '👁 viewers';
    eachLiveInfo(box => {
      box.style.display = 'block';
      setText(box.querySelector('.live-info-title'), titleText);
      setText(box.querySelector('.live-game'), gameText);
      setText(box.querySelector('.live-viewers'), viewersText);
    });
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

  // Aviso fotosensibilidad. Bump key version to force-reshow modal for existing users.
  const FLASH_PREF_KEY = 'flashPref_v2';
  try { localStorage.removeItem('flashPref'); } catch (e) {}
  function applyFlashPref(pref) {
    const root = document.documentElement;
    root.classList.remove('flash-off', 'flash-low', 'flash-full', 'flash-pending');
    root.classList.add('flash-' + pref);
    try { localStorage.setItem(FLASH_PREF_KEY, pref); } catch (e) {}
  }
  const photoWarn = $('photoWarn');
  if (photoWarn) {
    let stored = null;
    try { stored = localStorage.getItem(FLASH_PREF_KEY); } catch (e) {}
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

  // Hero carousel (Swiper)
  const heroTrack = $('heroTrack');
  if (heroTrack && window.Swiper) {
    const names = Array.from(heroTrack.querySelectorAll('.hero-slide')).map((slide, i) => {
      const nameEl = slide.querySelector('.hero-name');
      return nameEl ? nameEl.textContent.trim() : `Slide ${i + 1}`;
    });
    new Swiper(heroTrack, {
      effect: 'fade',
      fadeEffect: { crossFade: true },
      loop: true,
      speed: 550,
      autoplay: { delay: 5500, disableOnInteraction: false, pauseOnMouseEnter: true },
      keyboard: { enabled: true },
      a11y: true,
      navigation: { prevEl: '#heroPrev', nextEl: '#heroNext' },
      pagination: {
        el: '#heroDots',
        clickable: true,
        bulletClass: 'hero-dot',
        bulletActiveClass: 'is-active',
        renderBullet: (i, className) =>
          `<button type="button" class="${className}" role="tab" aria-label="${names[i]}" data-name="${names[i]}"></button>`,
      },
      on: {
        autoplayTimeLeft(s, time, progress) {
          const bullets = s.pagination && s.pagination.bullets;
          if (!bullets) return;
          const active = bullets[s.realIndex];
          if (active) active.style.setProperty('--progress', 1 - progress);
        },
        slideChange(s) {
          const bullets = s.pagination && s.pagination.bullets;
          if (!bullets) return;
          bullets.forEach(b => b.style.setProperty('--progress', 0));
        },
      },
    });
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
    const playNow = () => {
      const t0 = ctx.currentTime + 0.02;
      swPlayIgnite(ctx, t0 + 1.35);
      swPlayHum(ctx, t0 + 1.45, 4.6);
    };
    const tryResume = () => {
      try {
        const p = ctx.resume();
        if (p && p.then) p.then(() => { if (ctx.state === 'running') playNow(); }).catch(() => {});
        else if (ctx.state === 'running') playNow();
      } catch (e) {}
    };
    if (ctx.state === 'running') {
      playNow();
    } else {
      tryResume();
      // Browser autoplay policy fallback: replay on first user gesture if intro still visible.
      const events = ['pointerdown', 'keydown', 'touchstart'];
      const onGesture = () => {
        events.forEach(ev => document.removeEventListener(ev, onGesture, true));
        const intro = $('swIntro');
        if (!intro || intro.hidden) return;
        if (!swAudioCtx) return;
        try {
          swAudioCtx.resume().then(() => { if (swAudioCtx.state === 'running') playNow(); }).catch(() => {});
        } catch (e) {}
      };
      events.forEach(ev => document.addEventListener(ev, onGesture, { once: true, capture: true }));
    }
  }
  function swStopAll() {
    if (!swAudioCtx) return;
    try { swAudioCtx.close(); } catch (e) {}
    swAudioCtx = null;
    swMasterGain = null;
  }

  function showSwIntro() {
    if (!SW_DAY_ENABLED) return;
    const current = $('swIntro');
    if (!current) return;
    // Clone & replace to restart CSS animations cleanly
    const fresh = current.cloneNode(true);
    fresh.classList.remove('sw-intro--sith', 'sw-intro--jedi');
    fresh.classList.add(Math.random() < 0.5 ? 'sw-intro--jedi' : 'sw-intro--sith');
    current.parentNode.replaceChild(fresh, current);
    fresh.hidden = false;
    swPlaySequence();
    const skip = fresh.querySelector('#swSkip');
    const close = () => { fresh.hidden = true; swStopAll(); };
    if (skip) skip.addEventListener('click', close, { once: true });
    setTimeout(close, 6200);
  }
  if (SW_DAY_ENABLED) {
    window.openSwIntro = showSwIntro;
    document.querySelectorAll('[data-open-sw-intro]').forEach(el => {
      el.addEventListener('click', e => { e.preventDefault(); showSwIntro(); });
    });
  } else {
    document.querySelectorAll('#fabSw, #swIntro, [data-open-sw-intro]').forEach(el => el.remove());
  }

  function maybeShowSwIntro() {
    if (!SW_DAY_ENABLED) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Fires on first user gesture each page load. After that, FAB triggers manually.
    const events = ['pointerdown', 'keydown', 'touchstart'];
    const trigger = (ev) => {
      // Don't hijack interactions with photo-warn controls or the FAB itself.
      const t = ev && ev.target;
      if (t && t.closest && t.closest('[data-open-photo-warn], #photoWarn, .fab-sw, [data-open-sw-intro]')) {
        return;
      }
      events.forEach(e => document.removeEventListener(e, trigger, true));
      showSwIntro();
    };
    events.forEach(ev => document.addEventListener(ev, trigger, true));
  }
  maybeShowSwIntro();

  // Init live check
  checkLive();
  setInterval(checkLive, REFRESH_MS);
})();

/* ===== Chasquilla: mechones reactivos al cursor =====
   Toggle: cambiar CHASQUILLA_ENABLED a false para apagar (igual que SW_DAY_ENABLED). */
(function () {
  const CHASQUILLA_ENABLED = true;
  const cha = document.getElementById('chasquilla');
  if (!cha) return;
  if (!CHASQUILLA_ENABLED) { cha.remove(); return; }

  // Generar mechones densos por mitad
  const STRANDS = 140;
  ['.cha-half--left', '.cha-half--right'].forEach((sel) => {
    const half = cha.querySelector(sel);
    if (!half || half.querySelector('.cha-strand')) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < STRANDS; i++) {
      const s = document.createElement('span');
      s.className = 'cha-strand';
      const t = i / (STRANDS - 1);
      const jitter = (Math.random() - 0.5) * 1.2;
      const xPct = (t * 100 + jitter * 100 / STRANDS).toFixed(2);
      const w = (5 + Math.random() * 8).toFixed(1);
      const h = (84 + Math.random() * 16).toFixed(1);
      const tone = Math.floor(Math.random() * 24);
      s.style.cssText =
        `left:${xPct}%;width:${w}px;height:${h}%;` +
        `--tone:${tone};` +
        `z-index:${Math.floor(Math.random() * 5)};`;
      frag.appendChild(s);
    }
    half.appendChild(frag);
  });

  // Cache posiciones de mechones
  const strands = Array.from(cha.querySelectorAll('.cha-strand'));
  const cache = strands.map((el) => ({ el, x: 0, lastPush: 0 }));
  function recache() {
    cache.forEach((d) => {
      const r = d.el.getBoundingClientRect();
      d.x = r.left + r.width / 2;
    });
  }
  recache();
  window.addEventListener('resize', recache);

  let raf = 0;
  let mx = -1, my = -1;
  const RANGE = 220;          // px alcance del empujón
  const MAX_PUSH = 28;         // grados max
  const HAIR_H = () => window.innerHeight * 0.5;

  function tick() {
    raf = 0;
    const inside = mx >= 0 && my >= 0 && my < HAIR_H();
    for (let i = 0; i < cache.length; i++) {
      const d = cache[i];
      let push = 0;
      if (inside) {
        const dx = d.x - mx;
        const adx = Math.abs(dx);
        if (adx < RANGE) {
          const w = 1 - adx / RANGE;
          // Mas profundo (mas cerca del borde inferior del cabello) = mas empuje
          const yFactor = 0.5 + (my / HAIR_H()) * 0.7;
          push = (dx >= 0 ? 1 : -1) * w * w * MAX_PUSH * yFactor;
        }
      }
      if (Math.abs(d.lastPush - push) > 0.15) {
        d.lastPush = push;
        d.el.style.setProperty('--push', push.toFixed(2));
      }
    }
  }
  function schedule() {
    if (!raf) raf = requestAnimationFrame(tick);
  }
  window.addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY;
    schedule();
  }, { passive: true });
  window.addEventListener('pointerleave', () => { mx = -1; my = -1; schedule(); });
  document.addEventListener('mouseleave', () => { mx = -1; my = -1; schedule(); });

  // Touch: seguir + auto-relax
  let touchClear = 0;
  function handleTouch(e) {
    const t = e.touches && e.touches[0];
    if (!t) return;
    mx = t.clientX; my = t.clientY;
    schedule();
    clearTimeout(touchClear);
    touchClear = setTimeout(() => { mx = -1; my = -1; schedule(); }, 1200);
  }
  window.addEventListener('touchstart', handleTouch, { passive: true });
  window.addEventListener('touchmove',  handleTouch, { passive: true });
})();
