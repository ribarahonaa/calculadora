// PawPau — chrome compartido (navbar, fondo de patitas, FABs).
// Fuente única para las 3 páginas. Antes estaba copiado en cada HTML y se
// desincronizó (links/URLs distintos por página). Esto inyecta una sola versión.
//
// Carga ANTES de landing.js: landing.js engancha listeners por id (#navToggle,
// #spotifyToggle, etc.), así que los nodos deben existir cuando ese script corra.
// La página se identifica con <body data-page="index|sorteo|torneo">.
(function () {
  const page = document.body.dataset.page || 'index';

  // Marca de actividad del dropdown de tools según la página.
  const dropdownActive = (page === 'sorteo' || page === 'torneo') ? ' active' : '';
  const itemActive = tool => (page === tool ? ' active' : '');

  const navbar = `
<nav class="navbar-pp" id="navbar">
  <div class="navbar-inner">
    <a class="navbar-brand" href="index.html#inicio">
      <span class="brand-logo brand-logo--pp">🐾</span>
      <span>Paw<span class="brand-accent">Pau</span></span>
    </a>
    <button class="navbar-toggle" id="navToggle" aria-label="Abrir menú">☰</button>
    <div class="navbar-links" id="navLinks">
      <a href="index.html#sobre">Sobre</a>
      <a href="index.html#redes">Redes</a>
      <a href="index.html#apoyo">Apóyame</a>
      <a href="index.html#faq">FAQ</a>
      <a href="index.html#contacto">Contacto</a>
      <div class="nav-dropdown${dropdownActive}" id="navDropdown">
        <button class="nav-dropdown-trigger" id="dropdownTrigger" type="button" aria-haspopup="true" aria-expanded="false">
          Tools <span class="dropdown-arrow">▾</span>
        </button>
        <div class="nav-dropdown-menu" role="menu">
          <a href="sorteo.html" class="nav-dropdown-item${itemActive('sorteo')}" data-tool="sorteo" role="menuitem">
            <span class="dropdown-icon">🎲</span>
            <div class="dropdown-text">
              <strong>Sorteo</strong>
              <span class="dropdown-desc">Ganadores al azar</span>
            </div>
          </a>
          <a href="torneo.html" class="nav-dropdown-item${itemActive('torneo')}" data-tool="torneo" role="menuitem">
            <span class="dropdown-icon">🏆</span>
            <div class="dropdown-text">
              <strong>Torneo</strong>
              <span class="dropdown-desc">Bracket eliminación</span>
            </div>
          </a>
        </div>
      </div>
      <a href="https://www.pawkedex.com" target="_blank" rel="noopener">Pawkedex</a>
    </div>
    <a class="navbar-cta" href="https://www.twitch.tv/pawpau" target="_blank" rel="noopener">
      <span class="navbar-live-dot" id="navLiveDot"></span>
      <span>Twitch</span>
    </a>
  </div>
</nav>`;

  const pawBg = `
<div class="paw-bg" aria-hidden="true">
  <span class="paw paw-1">🐾</span>
  <span class="paw paw-2">🐾</span>
  <span class="paw paw-3">🐾</span>
  <span class="paw paw-4">🐾</span>
  <span class="paw paw-5">🐾</span>
  <span class="paw paw-6">🐾</span>
</div>`;

  const fabs = `
<div class="fab-spotify-wrap" id="fabSpotify">
  <div class="fab-spotify-panel" id="spotifyPanel" aria-hidden="true">
    <div class="fab-panel-head">
      <span class="fab-panel-title">🎵 Lo que suena en mis streams</span>
      <button class="fab-panel-close" id="spotifyClose" aria-label="Cerrar">✕</button>
    </div>
    <iframe
      id="spotifyIframe"
      src="https://open.spotify.com/embed/playlist/2DjwiuasPB1QBrFSM6sG6q?utm_source=generator&theme=0&autoplay=1"
      width="100%" height="380"
      frameborder="0"
      allowfullscreen=""
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      title="Playlist de PawPau en Spotify"></iframe>
    <div class="fab-panel-note">💡 Pulsa play — los navegadores bloquean autoplay con sonido hasta que interactúes.</div>
  </div>
  <button class="fab-spotify" id="spotifyToggle" aria-label="Abrir playlist de Spotify" type="button">
    <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32" aria-hidden="true">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.56.3z"/>
    </svg>
    <span class="fab-tooltip fab-tooltip--left">Mi <strong>playlist</strong></span>
    <span class="fab-pulse-ring fab-pulse-spotify"></span>
  </button>
</div>

<a class="fab-redragon" href="https://www.redragon.es/pawpau" target="_blank" rel="noopener" aria-label="Colaboración con Redragon">
  <img class="fab-icon" src="img/redragon.png" alt="Redragon">
  <span class="fab-tooltip">Soy parte del Team de los mejores periféricos !</span>
  <span class="fab-pulse-ring"></span>
</a>`;

  function fill(id, html) {
    const slot = document.getElementById(id);
    if (slot) slot.outerHTML = html;
  }

  fill('slot-navbar', navbar);
  fill('slot-paw-bg', pawBg);
  fill('slot-fabs', fabs);
})();
