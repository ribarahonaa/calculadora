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

  const FETCH_TIMEOUT_MS = 5000;

  async function fetchOnce(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
      const r = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
      if (!r.ok) return null;
      return (await r.text()).trim();
    } finally {
      clearTimeout(timer);
    }
  }

  // Un reintento con backoff corto ante fallo de red/timeout antes de rendirse.
  async function fetchText(url) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await fetchOnce(url);
      } catch (e) {
        if (attempt === 0) await new Promise(r => setTimeout(r, 600));
      }
    }
    return null;
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


  // Init live check
  checkLive();
  setInterval(checkLive, REFRESH_MS);
})();
