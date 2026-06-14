// PawPau — núcleo de intros estacionales (solo index.html).
// Lógica compartida y propensa a desincronizarse entre campañas: detección de
// modo calmo (fotosensibilidad), espera al aviso de fotosensibilidad, auto-play
// de "primera visita" y enganche del botón "volver a ver".
//
// Cada campaña (pride.js, starwars.js) define su propio render/audio y se
// registra con Seasonal.register(...). Añadir/quitar una campaña = un archivo.
window.Seasonal = (function () {
  // Modo calmo: respeta fotosensibilidad (flash-off), prefers-reduced-motion,
  // o preferencia de flash aún sin elegir (por las dudas).
  function isCalm() {
    let flashPref = null;
    try { flashPref = localStorage.getItem('flashPref_v2'); } catch (e) {}
    const prefChosen = flashPref === 'off' || flashPref === 'low' || flashPref === 'full';
    const reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return flashPref === 'off' || reduceMotion || !prefChosen;
  }

  // ¿Ya hay una intro en pantalla? (evita solapar dos campañas).
  function isActive() {
    return !!document.querySelector('.seasonal-overlay');
  }

  // Ejecuta cb cuando el aviso de fotosensibilidad esté resuelto (oculto).
  // Si no hay aviso o ya está oculto, ejecuta de inmediato.
  function whenPhotoWarnResolved(cb) {
    const pw = document.getElementById('photoWarn');
    if (pw && !pw.hidden) {
      const obs = new MutationObserver(() => {
        if (pw.hidden) { obs.disconnect(); cb(); }
      });
      obs.observe(pw, { attributes: true, attributeFilter: ['hidden'] });
    } else {
      cb();
    }
  }

  // Inyecta el botón "volver a ver" de la campaña activa en el hero.
  // Solo lo llama la campaña cuyo mes está activo => aparece un único botón.
  function injectCta(opts) {
    const host = document.querySelector('.hero-pp') || document.body;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'seasonal-cta ' + opts.ctaClass;
    btn.innerHTML = opts.ctaLabel;
    btn.addEventListener('click', e => { e.preventDefault(); opts.run(); });
    host.appendChild(btn);
  }

  // Registra una campaña.
  //  opts.run        () => void   construye y muestra la intro
  //  opts.month      0-11         mes en que auto-reproduce (todo el mes)
  //  opts.forceParam string       ?<param> en la URL fuerza la intro (para probar)
  //  opts.ctaLabel   string       HTML del botón "volver a ver" (icono + texto)
  //  opts.ctaClass   string       clase de tema del botón (seasonal-cta--*)
  //
  // Auto-reproduce CADA vez que se entra al index durante el mes (no "una vez").
  // El botón solo existe durante el mes activo de la campaña.
  function register(opts) {
    const force = new RegExp('[?&]' + opts.forceParam + '\\b').test(location.search);
    const inMonth = new Date().getMonth() === opts.month;

    if (force) { opts.run(); return; }
    if (!inMonth) return;

    injectCta(opts);
    // Espera a que el aviso de fotosensibilidad se resuelva, luego reproduce.
    whenPhotoWarnResolved(opts.run);
  }

  // Ciclo de vida estándar del overlay: fade-in (CSS), botón Saltar, click-fuera,
  // Esc y auto-cierre. La campaña pasa el nodo overlay ya construido y montado.
  //  overlay   el nodo (debe tener clase .seasonal-overlay y un .seasonal-skip)
  //  outClass  clase que dispara la animación de salida
  //  durationMs cuánto dura antes de auto-cerrarse
  //  onClose   callback opcional al cerrar (p.ej. cortar audio)
  function lifecycle(overlay, outClass, durationMs, onClose) {
    let closed = false;
    function dismiss() {
      if (closed) return;
      closed = true;
      clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      if (onClose) onClose();
      overlay.classList.add(outClass);
      overlay.addEventListener('animationend', () => overlay.remove(), { once: true });
      setTimeout(() => overlay.remove(), 1000); // respaldo
    }
    function onKey(e) { if (e.key === 'Escape') dismiss(); }
    const skip = overlay.querySelector('.seasonal-skip');
    if (skip) skip.addEventListener('click', dismiss);
    overlay.addEventListener('click', e => { if (e.target === overlay) dismiss(); });
    document.addEventListener('keydown', onKey);
    const timer = setTimeout(dismiss, durationMs);
    return dismiss;
  }

  return { isCalm, isActive, register, lifecycle };
})();
