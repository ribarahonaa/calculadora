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

  // Init live check
  checkLive();
  setInterval(checkLive, REFRESH_MS);
})();
