(function () {
  const { $, shuffle, escapeHtml, parseParticipantes, showErr, spawnConfetti, colorFromString, initials } = App;

  const PRESETS = {
    '1v1':     { matchSize: 2,  advance: 1 },
    'race4-2': { matchSize: 4,  advance: 2 },
    'race4-1': { matchSize: 4,  advance: 1 },
    'race3-1': { matchSize: 3,  advance: 1 },
    'br':      { matchSize: -1, advance: 1 },
    'custom':  null,
  };

  const state = {
    titulo: '',
    phase: 'setup',           // 'setup' | 'round' | 'champion'
    ronda: 0,
    matches: [],              // [{contestants:[], winners:Set}]
    matchSize: 2,
    advance: 1,
    history: [],              // [{ronda, label, matches:[{contestants, winners}]}]
    champion: null,
  };

  // ============ Setup ============
  function actualizarConteo() {
    const lista = parseParticipantes($('participantes').value);
    $('conteo').textContent = `${lista.length} participante${lista.length !== 1 ? 's' : ''}`;
  }

  function aplicarPreset(presetKey, sizeId, advId) {
    const p = PRESETS[presetKey];
    if (!p) return;
    if (p.matchSize !== undefined) $(sizeId).value = String(p.matchSize);
    if (p.advance !== undefined) $(advId).value = String(p.advance);
  }

  $('formato').addEventListener('change', e => aplicarPreset(e.target.value, 'matchSize', 'advance'));

  function iniciar() {
    const lista = parseParticipantes($('participantes').value);
    let nObj = parseInt($('nParticipantes').value, 10);
    if (nObj === 0) nObj = lista.length;
    let matchSize = parseInt($('matchSize').value, 10);
    const advance = parseInt($('advance').value, 10);

    if (lista.length < 2) return showErr('error', 'Necesitas al menos 2 participantes.');
    if (nObj < 2) return showErr('error', 'Mínimo 2 competidores.');
    if (lista.length < nObj) return showErr('error', `Lista tiene ${lista.length}, pero pides ${nObj}.`);

    if (matchSize === -1) matchSize = nObj; // BR
    const errMsg = validarFormato(nObj, matchSize, advance);
    if (errMsg) return showErr('error', errMsg);

    state.titulo = $('titulo').value.trim();
    state.ronda = 1;
    state.history = [];
    state.champion = null;
    state.matchSize = matchSize;
    state.advance = advance;

    const seleccionados = shuffle(lista).slice(0, nObj);
    state.matches = generarMatches(seleccionados, matchSize);
    state.phase = 'round';
    mostrarFase();
  }

  function validarFormato(total, size, adv) {
    if (size < 2) return 'Tamaño de enfrentamiento mínimo: 2.';
    if (adv < 1) return 'Al menos 1 debe clasificar.';
    if (adv >= size) return `Clasifican (${adv}) debe ser menor al tamaño (${size}).`;
    if (total < size) return `Necesitas al menos ${size} para enfrentamientos de ${size}.`;
    // Verificar que tras la ronda quedan al menos 1
    const nMatches = Math.ceil(total / size);
    if (nMatches * adv < 1) return 'Configuración inválida: nadie clasifica.';
    return null;
  }

  function generarMatches(participantes, matchSize) {
    const mezclados = shuffle(participantes);
    const total = mezclados.length;
    const efectivo = Math.min(matchSize, total);
    const nMatches = Math.max(1, Math.ceil(total / efectivo));
    const matches = Array.from({ length: nMatches }, () => ({ contestants: [], winners: new Set() }));
    mezclados.forEach((p, i) => matches[i % nMatches].contestants.push(p));
    return matches;
  }

  function mostrarFase() {
    $('setup').style.display = 'none';
    $('roundView').style.display = (state.phase === 'round' || state.phase === 'champion') ? 'block' : 'none';
    if (state.phase === 'round' || state.phase === 'champion') renderRound();
  }

  // ============ Render ronda ============
  function renderRound() {
    const totalCompit = state.matches.reduce((a, m) => a + m.contestants.length, 0);
    const totalClasifican = state.matches.reduce((a, m) => a + Math.min(state.advance, m.contestants.length), 0);

    $('roundTitulo').textContent = `${state.titulo ? '⚔️ ' + state.titulo + ' — ' : '⚔️ '}Ronda ${state.ronda}`;
    $('roundSubtitulo').textContent = `${totalCompit} compiten · ${state.matches.length} ${state.matches.length === 1 ? 'enfrentamiento' : 'enfrentamientos'} · ${totalClasifican} clasifican`;

    const grid = $('matchesGrid');
    grid.innerHTML = '';
    state.matches.forEach((m, mi) => {
      const max = Math.min(state.advance, m.contestants.length);
      const isComplete = m.winners.size === max && max > 0;
      const card = document.createElement('div');
      card.className = 'grupo' + (isComplete ? ' complete' : '');
      card.innerHTML = `
        <div class="grupo-head">
          <h4>${nombreMatch(state.matchSize, mi, m.contestants.length, totalCompit)}</h4>
          <span class="grupo-counter">${m.winners.size}/${max}</span>
        </div>
      `;
      const is1v1 = m.contestants.length === 2;
      m.contestants.forEach((c, ci) => {
        const item = document.createElement('label');
        const sel = m.winners.has(c);
        item.className = 'grupo-item' + (sel ? ' seleccionado' : '');
        const color = colorFromString(c);
        item.innerHTML = `
          <input type="checkbox" ${sel ? 'checked' : ''}>
          <span class="avatar" style="--avatar-color:${color}">${escapeHtml(initials(c))}</span>
          <span class="nombre">${escapeHtml(c)}</span>
          <span class="check-indicator">✓</span>
        `;
        item.querySelector('input').addEventListener('change', e => {
          if (e.target.checked) {
            if (m.winners.size >= max) {
              e.target.checked = false;
              showErr('errorRound', `Solo ${max} clasifica${max !== 1 ? 'n' : ''} aquí.`);
              return;
            }
            m.winners.add(c);
          } else {
            m.winners.delete(c);
          }
          renderRound();
        });
        card.appendChild(item);

        // Insert VS divider entre los 2 fighters de un combate
        if (is1v1 && ci === 0) {
          const vs = document.createElement('div');
          vs.className = 'vs-divider';
          vs.textContent = 'VS';
          card.appendChild(vs);
        }
      });
      grid.appendChild(card);
    });

    // Sugerir próxima ronda
    sugerirProximaRonda(totalClasifican);

    // Mostrar historial e indicar si hay campeón
    renderHistoria();
    if (state.champion) mostrarCampeon(state.champion);
    else $('campeon').innerHTML = '';
  }

  function nombreMatch(size, idx, contestants, total) {
    if (size >= total) return `🌪 Battle Royale`;
    if (size === 2) return `🥊 Combate ${idx + 1}`;
    if (size <= 4) return `🏁 Carrera ${idx + 1}`;
    return `⚔️ Match ${idx + 1}`;
  }

  function sugerirProximaRonda(totalSiguiente) {
    let presetSugerido = '1v1';
    let sizeSugerido = 2;
    let advSugerido = 1;

    if (totalSiguiente <= 1) {
      $('nextHint').textContent = `Próxima ronda: ${totalSiguiente} clasificado. Avanza para ver el campeón.`;
    } else if (totalSiguiente === 2) {
      presetSugerido = '1v1'; sizeSugerido = 2; advSugerido = 1;
      $('nextHint').textContent = `Próxima ronda: ${totalSiguiente} clasificados → final 1v1.`;
    } else if (totalSiguiente <= 4) {
      sizeSugerido = totalSiguiente; advSugerido = 1;
      presetSugerido = totalSiguiente === 4 ? 'race4-1' : (totalSiguiente === 3 ? 'race3-1' : '1v1');
      $('nextHint').textContent = `Próxima ronda: ${totalSiguiente} clasificados.`;
    } else {
      sizeSugerido = 4; advSugerido = 2;
      presetSugerido = 'race4-2';
      $('nextHint').textContent = `Próxima ronda: ${totalSiguiente} clasificados.`;
    }

    $('nextPreset').value = presetSugerido;
    $('nextMatchSize').value = String(sizeSugerido);
    $('nextAdvance').value = String(advSugerido);
  }

  $('nextPreset').addEventListener('change', e => {
    if (e.target.value !== 'custom') aplicarPreset(e.target.value, 'nextMatchSize', 'nextAdvance');
  });

  // ============ Avanzar ronda ============
  function avanzar() {
    // Validar
    for (const m of state.matches) {
      const req = Math.min(state.advance, m.contestants.length);
      if (m.winners.size !== req) {
        return showErr('errorRound', `Selecciona exactamente ${req} clasificado${req !== 1 ? 's' : ''} en cada enfrentamiento.`);
      }
    }

    // Guardar historial
    state.history.push({
      ronda: state.ronda,
      label: nombreRonda(state.matchSize, state.matches.reduce((a, m) => a + m.contestants.length, 0), state.matches.length),
      matches: state.matches.map(m => ({
        contestants: [...m.contestants],
        winners: [...m.winners],
      })),
    });

    // Reunir clasificados
    const clasificados = [];
    state.matches.forEach(m => m.winners.forEach(w => clasificados.push(w)));

    if (clasificados.length === 1) {
      state.champion = clasificados[0];
      state.phase = 'champion';
      state.matches = [];
      renderRound();
      return;
    }
    if (clasificados.length === 0) {
      return showErr('errorRound', 'No hay clasificados.');
    }

    // Configurar siguiente ronda
    let nextSize = parseInt($('nextMatchSize').value, 10);
    const nextAdv = parseInt($('nextAdvance').value, 10);
    if (nextSize === -1) nextSize = clasificados.length;

    const errMsg = validarSiguienteRonda(clasificados.length, nextSize, nextAdv);
    if (errMsg) return showErr('errorRound', errMsg);

    state.ronda++;
    state.matchSize = nextSize;
    state.advance = nextAdv;
    state.matches = generarMatches(clasificados, nextSize);

    // Animación de transición: fade out grid → fade in
    const grid = $('matchesGrid');
    grid.classList.add('round-out');
    setTimeout(() => {
      renderRound();
      grid.classList.remove('round-out');
      // Pulse en el título de ronda
      const titulo = $('roundTitulo');
      titulo.classList.remove('round-pulse');
      void titulo.offsetWidth;
      titulo.classList.add('round-pulse');
    }, 280);
  }

  function validarSiguienteRonda(total, size, adv) {
    if (size < 2) return 'Tamaño de enfrentamiento mínimo: 2.';
    if (adv < 1) return 'Al menos 1 debe clasificar.';
    if (total === 2) {
      if (size !== 2 || adv !== 1) return 'Con 2 finalistas: tamaño 2, clasifica 1.';
      return null;
    }
    if (size > total) return `Solo hay ${total} clasificados; tamaño ${size} es imposible.`;
    if (adv >= size) return `Clasifican (${adv}) debe ser menor al tamaño (${size}).`;
    return null;
  }

  function nombreRonda(size, total, nMatches) {
    if (size >= total && nMatches === 1) return 'Battle Royale';
    if (nMatches === 1 && size === 2) return 'Final';
    if (size === 2) return `Eliminación (${nMatches} combates)`;
    return `${nMatches} enfrentamientos`;
  }

  // ============ Historial ============
  function renderHistoria() {
    const cont = $('historia');
    if (state.history.length === 0) { cont.innerHTML = ''; return; }
    cont.innerHTML = `
      <div class="historia">
        <h4>📜 Historial</h4>
        <div id="historiaList"></div>
      </div>
    `;
    const list = $('historiaList');
    state.history.forEach(h => {
      const div = document.createElement('div');
      div.className = 'historia-ronda';
      const resumen = h.matches.map((m, i) => {
        const ganadores = m.winners.map(escapeHtml).join(', ');
        return `<span class="hist-match"><strong>M${i + 1}</strong>: ${ganadores}</span>`;
      }).join('');
      div.innerHTML = `<div class="hist-titulo">Ronda ${h.ronda} <span class="muted">— ${escapeHtml(h.label)}</span></div><div class="hist-matches">${resumen}</div>`;
      list.appendChild(div);
    });
  }

  function mostrarCampeon(nombre) {
    const wasShown = $('campeon').querySelector('.campeon-board') !== null;
    $('campeon').innerHTML = `
      <div class="campeon-board">
        <div class="trofeo">🏆</div>
        <div class="label">Campeón ${state.titulo ? '— ' + escapeHtml(state.titulo) : ''}</div>
        <div class="nombre">${escapeHtml(nombre)}</div>
        <div class="muted" style="margin-top:8px">Tras ${state.ronda} ronda${state.ronda !== 1 ? 's' : ''}</div>
      </div>
    `;
    if (!wasShown) abrirModalCampeon(nombre);
  }

  function abrirModalCampeon(nombre) {
    $('modalLabel').textContent = state.titulo ? `Campeón — ${state.titulo}` : 'Campeón';
    $('modalName').textContent = nombre;
    $('modalMeta').textContent = `Tras ${state.ronda} ronda${state.ronda !== 1 ? 's' : ''}`;
    const modal = $('championModal');
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Confetti múltiples oleadas desde el modal
    const inner = modal.querySelector('.champion-modal-inner');
    setTimeout(() => spawnConfetti(inner, 60), 200);
    setTimeout(() => spawnConfetti(inner, 50), 800);
    setTimeout(() => spawnConfetti(inner, 40), 1500);
    setTimeout(() => spawnConfetti(inner, 30), 2300);
  }

  function cerrarModalCampeon() {
    const modal = $('championModal');
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // ============ Acciones auxiliares ============
  function limpiar() {
    $('participantes').value = '';
    $('titulo').value = '';
    $('nParticipantes').value = '0';
    $('formato').value = '1v1';
    aplicarPreset('1v1', 'matchSize', 'advance');
    actualizarConteo();
    $('participantes').focus();
  }

  function mezclar() {
    const lista = parseParticipantes($('participantes').value);
    if (lista.length === 0) return showErr('error', 'Lista vacía.');
    $('participantes').value = shuffle(lista).join('\n');
    actualizarConteo();
  }

  function reset() {
    state.phase = 'setup';
    state.matches = [];
    state.history = [];
    state.champion = null;
    state.ronda = 0;
    $('roundView').style.display = 'none';
    $('setup').style.display = 'block';
  }

  const ejemplos = {
    '1v1': ['Goku','Vegeta','Piccolo','Gohan','Krillin','Tien Shinhan','Yamcha','Chiaotzu','Mr. Satan','Trunks','Goten','Android 18','Majin Buu','Frieza','Cell','Beerus'],
    'race': ['Mario','Luigi','Peach','Toad','Yoshi','Bowser','DK','Wario','Daisy','Rosalina','Koopa','Shy Guy'],
    'br': ['Jugador 01','Jugador 02','Jugador 03','Jugador 04','Jugador 05','Jugador 06','Jugador 07','Jugador 08','Jugador 09','Jugador 10'],
  };

  document.querySelectorAll('[data-ej]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const tipo = a.dataset.ej;
      $('participantes').value = ejemplos[tipo].join('\n');
      // Configurar preset acorde
      if (tipo === 'race') { $('formato').value = 'race4-2'; aplicarPreset('race4-2', 'matchSize', 'advance'); }
      else if (tipo === 'br') { $('formato').value = 'br'; $('matchSize').value = '-1'; $('advance').value = '3'; }
      else { $('formato').value = '1v1'; aplicarPreset('1v1', 'matchSize', 'advance'); }
      actualizarConteo();
    });
  });

  // Wire up
  $('iniciar').addEventListener('click', iniciar);
  $('avanzar').addEventListener('click', avanzar);
  $('reset').addEventListener('click', reset);
  $('mezclar').addEventListener('click', mezclar);
  $('limpiar').addEventListener('click', limpiar);
  $('participantes').addEventListener('input', actualizarConteo);

  // Modal campeón
  $('modalClose').addEventListener('click', cerrarModalCampeon);
  $('modalDismiss').addEventListener('click', cerrarModalCampeon);
  $('modalAgain').addEventListener('click', () => { cerrarModalCampeon(); reset(); });
  $('championModal').querySelector('.modal-backdrop').addEventListener('click', cerrarModalCampeon);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('championModal').classList.contains('hidden')) cerrarModalCampeon();
  });

  actualizarConteo();
})();
