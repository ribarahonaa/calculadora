(function () {
  const { $, randomInt, shuffle, escapeHtml, parseParticipantes, showErr, spawnConfetti, colorFromString, initials } = App;

  const draw = {
    pool: [],
    permitir: false,
    titulo: '',
    winners: [],
    rerolled: [],
  };

  // ============ Helpers UI ============
  function actualizarConteo() {
    const lista = parseParticipantes($('participantes').value, $('permitirRepetidos').checked);
    $('conteo').textContent = `${lista.length} participante${lista.length !== 1 ? 's' : ''}`;
  }

  function renderEmpty() {
    const r = $('results');
    r.classList.add('empty');
    r.innerHTML = `
      <div class="empty-state">
        <div class="icon">🎯</div>
        <div>Aún no hay ganadores</div>
        <div class="muted" style="margin-top:6px">Configura tu sorteo y presiona "Sortear"</div>
      </div>
    `;
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ============ Tombola — vertical reel (dentro del modal) ============
  async function tombolaReel(container, opciones, finalWinner, duracionMs = 1500) {
    const isModal = container.classList.contains('in-modal');
    const itemHeight = isModal ? 70 : 90;
    const containerHeight = isModal ? 220 : 280;
    const cycles = 7;
    const items = [];
    for (let c = 0; c < cycles; c++) items.push(...shuffle(opciones));
    items.push(finalWinner);
    const finalIdx = items.length - 1;

    const startY = containerHeight / 2 - itemHeight / 2;
    const endY = startY - finalIdx * itemHeight;

    container.classList.remove('hidden');
    container.innerHTML = `
      <div class="scan-line"></div>
      <div class="reel-corner tl"></div>
      <div class="reel-corner tr"></div>
      <div class="reel-corner bl"></div>
      <div class="reel-corner br"></div>
      <div class="reel-bar-top"></div>
      <div class="reel-bar-bottom"></div>
      <div class="reel-window">
        <div class="reel-track" style="transform: translateY(${startY}px); transition: none;"></div>
      </div>
    `;
    const track = container.querySelector('.reel-track');
    track.innerHTML = items.map((n, i) =>
      `<div class="reel-item${i === finalIdx ? ' is-winner' : ''}">${escapeHtml(n)}</div>`
    ).join('');

    await sleep(60);
    track.style.transition = `transform ${duracionMs}ms cubic-bezier(0.16, 0.85, 0.3, 1)`;
    track.style.transform = `translateY(${endY}px)`;

    await sleep(duracionMs);
  }

  // ============ Render ganadores inline ============
  function renderWinners(asPlaceholders = false) {
    const r = $('results');
    r.classList.remove('empty');
    const titulo = draw.titulo;
    const totalLabel = draw.winners.length === 1 ? 'Ganador' : 'Ganadores';
    r.innerHTML = `
      <h2>🏆 ${titulo ? escapeHtml(titulo) + ' — ' : ''}${totalLabel}</h2>
      <div id="ganadoresList"></div>
      <div class="muted" style="margin-top:14px;font-size:0.82rem">¿Algún ganador no califica? Pulsa 🔄 para sortear ese lugar entre los demás.</div>
      <div id="descartadosBox"></div>
    `;
    const cont = $('ganadoresList');
    draw.winners.forEach((g, i) => {
      const div = document.createElement('div');
      div.className = 'winner' + (asPlaceholders || g === null ? ' placeholder' : '');
      div.dataset.idx = i;
      const display = (asPlaceholders || g === null) ? '...' : escapeHtml(g);
      div.innerHTML = `
        <span class="winner-num">${i + 1}</span>
        <span class="winner-name">${display}</span>
        <div class="winner-actions">
          <button class="btn-replace" data-idx="${i}" title="Reemplazar este ganador">🔄</button>
        </div>
      `;
      cont.appendChild(div);
    });
    cont.querySelectorAll('.btn-replace').forEach(b => {
      b.addEventListener('click', () => replaceWinner(parseInt(b.dataset.idx, 10)));
    });
    renderDescartados();
  }

  function renderDescartados() {
    const box = $('descartadosBox');
    if (!box) return;
    if (draw.rerolled.length === 0) { box.innerHTML = ''; return; }
    box.innerHTML = `
      <div class="descartados">
        <div class="descartados-title">🚫 Descartados <span class="descartados-count">${draw.rerolled.length}</span></div>
        <div class="descartados-list">
          ${draw.rerolled.map(d => `<span class="descartado-chip">${escapeHtml(d)}</span>`).join('')}
        </div>
      </div>
    `;
  }

  function disponibles() {
    const excluir = [...draw.winners.filter(w => w !== null), ...draw.rerolled];
    if (draw.permitir) {
      const remaining = [...draw.pool];
      excluir.forEach(w => {
        const idx = remaining.indexOf(w);
        if (idx >= 0) remaining.splice(idx, 1);
      });
      return remaining;
    } else {
      const set = new Set(excluir);
      return draw.pool.filter(p => !set.has(p));
    }
  }

  // ============ Sortear ============
  async function sortear() {
    const permitir = $('permitirRepetidos').checked;
    const lista = parseParticipantes($('participantes').value, permitir);
    const n = parseInt($('nGanadores').value, 10);
    if (lista.length === 0) return showErr('error', 'Agrega al menos un participante.');
    if (!n || n < 1) return showErr('error', 'Número de ganadores inválido.');
    if (n > lista.length) return showErr('error', `Solo hay ${lista.length} participantes; no se pueden elegir ${n} ganadores únicos.`);

    cerrarModal();
    await sleep(50);

    $('sortear').disabled = true;
    $('limpiar').disabled = true;
    $('mezclar').disabled = true;

    draw.pool = lista;
    draw.permitir = permitir;
    draw.titulo = $('titulo').value.trim();
    draw.winners = new Array(n).fill(null);
    draw.rerolled = [];

    renderEmpty();

    // Decidir ganadores finales
    const finales = [];
    if (permitir) {
      const remaining = [...lista];
      for (let i = 0; i < n; i++) {
        const idx = randomInt(remaining.length);
        finales.push(remaining[idx]);
        remaining.splice(idx, 1);
      }
    } else {
      finales.push(...shuffle(lista).slice(0, n));
    }

    // Abrir modal en estado "sorteando"
    abrirModalSorteando();
    await sleep(700); // esperar animación entrada modal

    // Tombola por cada ganador en el modal + cards revelan progresivas
    for (let i = 0; i < n; i++) {
      const yaRevelados = draw.winners.filter(w => w !== null);
      let opciones;
      if (permitir) {
        const rem = [...lista];
        yaRevelados.forEach(w => {
          const idx = rem.indexOf(w);
          if (idx >= 0) rem.splice(idx, 1);
        });
        opciones = rem.length ? rem : lista;
      } else {
        const set = new Set(yaRevelados);
        opciones = lista.filter(p => !set.has(p));
        if (!opciones.length) opciones = lista;
      }

      const dur = n === 1 ? 1800 : (i === 0 ? 1500 : 1100);
      await tombolaReel($('modalTombola'), opciones, finales[i], dur);

      // Revelar carta del ganador
      draw.winners[i] = finales[i];
      addWinnerCardToModal(finales[i], i);
      await sleep(500);
    }

    // Tombola fade out
    const tombola = $('modalTombola');
    tombola.style.transition = 'opacity 0.4s, transform 0.4s, max-height 0.5s';
    tombola.style.opacity = '0';
    tombola.style.transform = 'scale(0.92)';
    await sleep(420);
    tombola.classList.add('hidden');
    tombola.style.opacity = '';
    tombola.style.transform = '';

    // Actualizar título a "Ganadores!"
    $('winnersTitle').textContent = (draw.titulo ? draw.titulo + ' — ' : '') + (n === 1 ? 'Ganador' : 'Ganadores');
    $('modalTrofeo').textContent = '🏆';
    $('modalTrofeo').classList.add('shake-trofeo');
    setTimeout(() => $('modalTrofeo').classList.remove('shake-trofeo'), 500);

    // Explosión de confetti final
    const inner = $('winnersModal').querySelector('.champion-modal-inner');
    spawnConfetti(inner, 80);
    setTimeout(() => spawnConfetti(inner, 60), 350);
    setTimeout(() => spawnConfetti(inner, 50), 800);
    setTimeout(() => spawnConfetti(inner, 40), 1400);

    // Mostrar acciones
    $('modalActions').style.display = 'flex';

    // Render inline (panel de la página) ya con todos
    renderWinners(false);

    $('sortear').disabled = false;
    $('limpiar').disabled = false;
    $('mezclar').disabled = false;
  }

  // ============ Modal ============
  function abrirModalSorteando() {
    const modal = $('winnersModal');
    $('winnersTitle').textContent = 'Sorteando...';
    $('modalTrofeo').textContent = '🎲';
    $('winnersModalList').innerHTML = '';
    $('modalActions').style.display = 'none';
    $('modalError').classList.add('hidden');

    // Resetear tombola
    const tombola = $('modalTombola');
    tombola.classList.remove('hidden');
    tombola.style.opacity = '';
    tombola.style.transform = '';
    tombola.innerHTML = '';

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function abrirModalListo() {
    // Re-abrir modal con resultados ya decididos (sin animación tombola)
    const modal = $('winnersModal');
    $('winnersTitle').textContent = (draw.titulo ? draw.titulo + ' — ' : '') + (draw.winners.length === 1 ? 'Ganador' : 'Ganadores');
    $('modalTrofeo').textContent = '🏆';
    $('modalTombola').classList.add('hidden');
    $('modalActions').style.display = 'flex';
    renderWinnersModal();
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function cerrarModal() {
    const modal = $('winnersModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function addWinnerCardToModal(name, idx) {
    const cont = $('winnersModalList');
    const card = document.createElement('div');
    card.className = 'winner-modal-card';
    card.dataset.idx = idx;
    const color = colorFromString(name);
    card.innerHTML = `
      <div class="num">${idx + 1}</div>
      <div class="avatar" style="background:${color}">${escapeHtml(initials(name))}</div>
      <div class="name">${escapeHtml(name)}</div>
      <button class="replace" data-idx="${idx}" title="Reemplazar este ganador">🔄</button>
    `;
    card.querySelector('.replace').addEventListener('click', () => replaceWinner(idx));
    cont.appendChild(card);
    // Confetti pequeño en la card al aparecer
    setTimeout(() => spawnConfetti(card, 18), 100);
  }

  function renderWinnersModal() {
    const cont = $('winnersModalList');
    cont.innerHTML = '';
    draw.winners.forEach((g, i) => {
      if (g === null) return;
      addWinnerCardToModal(g, i);
    });
  }

  // ============ Reemplazar ============
  async function replaceWinner(i) {
    const previo = draw.winners[i];
    if (previo === null) return;

    const modalOpen = !$('winnersModal').classList.contains('hidden');

    // Calcular disponibles SIN modificar estado: excluye otros ganadores + descartados + previo
    const exclude = [
      ...draw.winners.filter((w, j) => j !== i && w !== null),
      ...draw.rerolled,
      previo,
    ];
    let disp;
    if (draw.permitir) {
      disp = [...draw.pool];
      exclude.forEach(w => {
        const idx = disp.indexOf(w);
        if (idx >= 0) disp.splice(idx, 1);
      });
    } else {
      const set = new Set(exclude);
      disp = draw.pool.filter(p => !set.has(p));
    }

    if (disp.length === 0) {
      const msg = `No quedan participantes disponibles. Pool: ${draw.pool.length} · ganadores: ${draw.winners.filter(w => w !== null).length} · descartados: ${draw.rerolled.length}.`;
      if (modalOpen) showModalError(msg);
      else showErr('error', msg);
      return;
    }

    // Commit: mover previo a descartados
    draw.rerolled.push(previo);
    draw.winners[i] = null;

    const inlineCard = document.querySelector(`#ganadoresList .winner[data-idx="${i}"]`);
    const modalCard  = document.querySelector(`#winnersModalList .winner-modal-card[data-idx="${i}"]`);

    // Disable todos los botones de reemplazo durante animación
    document.querySelectorAll('.btn-replace, .winner-modal-card .replace').forEach(b => b.disabled = true);

    // Shake ambas cartas
    if (inlineCard) {
      inlineCard.classList.remove('locked');
      inlineCard.classList.add('shake');
    }
    if (modalCard) modalCard.classList.add('shake');
    await sleep(420);
    if (inlineCard) inlineCard.classList.remove('shake');
    if (modalCard) {
      modalCard.classList.remove('shake');
      modalCard.classList.add('dim');
    }

    const nuevo = disp[randomInt(disp.length)];

    if (modalOpen) {
      // Mostrar tombola con fade-in
      const tombola = $('modalTombola');
      tombola.classList.remove('hidden');
      tombola.style.transition = 'none';
      tombola.style.opacity = '0';
      tombola.style.transform = 'scale(0.94)';
      tombola.innerHTML = '';
      // forzar reflow
      void tombola.offsetWidth;
      tombola.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
      tombola.style.opacity = '1';
      tombola.style.transform = 'scale(1)';
      await sleep(320);

      // Reel
      await tombolaReel(tombola, disp, nuevo, 1300);

      // Fade-out
      tombola.style.transition = 'opacity 0.4s, transform 0.4s';
      tombola.style.opacity = '0';
      tombola.style.transform = 'scale(0.94)';
      await sleep(420);
      tombola.classList.add('hidden');
      tombola.style.opacity = '';
      tombola.style.transform = '';
      tombola.style.transition = '';
    }

    // Confirmar nuevo ganador
    draw.winners[i] = nuevo;

    // Actualizar modal card con nueva info + confetti
    if (modalCard) {
      modalCard.classList.remove('dim');
      const nameEl = modalCard.querySelector('.name');
      const avatarEl = modalCard.querySelector('.avatar');
      nameEl.textContent = nuevo;
      avatarEl.style.background = colorFromString(nuevo);
      avatarEl.textContent = initials(nuevo);
      modalCard.classList.add('shake');
      setTimeout(() => modalCard.classList.remove('shake'), 100);
      // Spring entrance
      modalCard.style.animation = 'none';
      void modalCard.offsetWidth;
      modalCard.style.animation = 'cardEnter 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)';
      spawnConfetti(modalCard, 28);
    }

    // Actualizar inline card
    if (inlineCard) {
      const nameEl = inlineCard.querySelector('.winner-name');
      nameEl.textContent = nuevo;
      inlineCard.classList.remove('placeholder');
      inlineCard.classList.add('locked');
      if (!modalOpen) spawnConfetti(inlineCard, 22);
    }

    renderDescartados();

    // Re-enable
    document.querySelectorAll('.btn-replace, .winner-modal-card .replace').forEach(b => b.disabled = false);
  }

  function showModalError(msg, ms = 6000) {
    const e = $('modalError');
    if (!e) return;
    e.textContent = msg;
    e.classList.remove('hidden');
    // Reiniciar animación
    e.style.animation = 'none';
    void e.offsetWidth;
    e.style.animation = '';
    clearTimeout(e._timer);
    e._timer = setTimeout(() => e.classList.add('hidden'), ms);
  }

  // ============ Botones auxiliares ============
  function limpiar() {
    cerrarModal();
    $('participantes').value = '';
    $('nGanadores').value = 1;
    $('titulo').value = '';
    $('permitirRepetidos').checked = false;
    draw.pool = []; draw.winners = []; draw.titulo = ''; draw.rerolled = [];
    renderEmpty();
    actualizarConteo();
    $('participantes').focus();
  }

  function mezclar() {
    const permitir = $('permitirRepetidos').checked;
    const lista = parseParticipantes($('participantes').value, permitir);
    if (lista.length === 0) return showErr('error', 'Lista vacía.');
    $('participantes').value = shuffle(lista).join('\n');
    actualizarConteo();
  }

  function cargarEjemplo(e) {
    e.preventDefault();
    $('participantes').value = [
      'Ana Rojas','Benjamín Soto','Camila Díaz','Diego Pérez','Elena Muñoz',
      'Felipe Castro','Gabriela León','Héctor Vargas','Isidora Ramírez','Joaquín Silva'
    ].join('\n');
    actualizarConteo();
  }

  // Wire up
  $('sortear').addEventListener('click', sortear);
  $('limpiar').addEventListener('click', limpiar);
  $('mezclar').addEventListener('click', mezclar);
  $('cargarEjemplo').addEventListener('click', cargarEjemplo);
  $('participantes').addEventListener('input', actualizarConteo);
  $('permitirRepetidos').addEventListener('change', actualizarConteo);

  // Modal
  $('winnersClose').addEventListener('click', cerrarModal);
  $('winnersDismiss').addEventListener('click', cerrarModal);
  $('winnersAgain').addEventListener('click', () => { cerrarModal(); sortear(); });
  $('winnersModal').querySelector('.modal-backdrop').addEventListener('click', cerrarModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('winnersModal').classList.contains('hidden')) cerrarModal();
  });

  actualizarConteo();
  renderEmpty();
})();
