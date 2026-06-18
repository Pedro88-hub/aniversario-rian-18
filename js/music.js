/* =====================================================================
 *  MUSIC — toca a música anexada a um post do mural usando a
 *  Spotify IFrame API. Um único player (canto inferior) é reaproveitado.
 * ===================================================================== */
(function music() {
  let controller = null;
  let ready = false;
  let currentUri = '';
  let pendingUri = null;
  let hideTimer = null;

  const wrap = document.getElementById('now-playing');
  const authorEl = document.getElementById('np-author');
  const trackCache = {};

  /* Fallback iOS: botão discreto "ligar som". Só aparece no mobile quando há
     música esperando e o áudio ainda não tocou de verdade. */
  let lastUri = '';
  let confirmedPlaying = false;
  function showHint() {
    if (confirmedPlaying || !isCoarsePointer()) return;
    document.getElementById('audio-unlock')?.classList.add('show');
  }
  function hideHint() {
    document.getElementById('audio-unlock')?.classList.remove('show');
  }

  let unlocked = false;
  /* Navegadores mobile só liberam áudio se o play() acontecer DENTRO de um gesto
     do usuário. Como rolar a tela já gera um toque, aproveitamos o 1º toque pra
     "ligar" o player — assim a música do feed começa sozinha, sem clicar em nada. */
  function onFirstGesture() {
    if (unlocked) return;
    unlocked = true;
    if (ready && controller) {
      try { controller.play(); } catch (e) {}   // ativa o iframe dentro do gesto
      if (pendingUri) _play(pendingUri);          // toca o post que estava esperando
    }
  }
  ['pointerdown', 'touchstart', 'keydown', 'click'].forEach((ev) =>
    window.addEventListener(ev, onFirstGesture, { passive: true })
  );

  function formatDuration(ms) {
    if (!ms || ms <= 0) return '';
    const total = Math.round(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  async function fetchOEmbed(trackId) {
    const res = await fetch(
      'https://open.spotify.com/oembed?url=' +
      encodeURIComponent('https://open.spotify.com/track/' + trackId)
    );
    if (!res.ok) return null;
    return res.json();
  }

  async function fetchMicrolink(trackUrl) {
    const res = await fetch('https://api.microlink.io/?url=' + encodeURIComponent(trackUrl));
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  }

  async function fetchItunesDuration(name, artist) {
    const q = encodeURIComponent([name, artist].filter(Boolean).join(' '));
    const res = await fetch(
      `https://itunes.apple.com/search?term=${q}&entity=song&limit=1&country=BR`
    );
    if (!res.ok) return 0;
    const json = await res.json();
    return json.results?.[0]?.trackTimeMillis || 0;
  }

  async function resolveTrack(input) {
    const uri = toUri(input);
    if (!uri) return null;
    const id = uri.split(':').pop();
    if (trackCache[id]?.name) return trackCache[id];

    const trackUrl = 'https://open.spotify.com/track/' + id;
    const [oembed, micro] = await Promise.allSettled([
      fetchOEmbed(id),
      fetchMicrolink(trackUrl),
    ]);

    const o = oembed.status === 'fulfilled' ? oembed.value : null;
    const m = micro.status === 'fulfilled' ? micro.value : null;

    const name = o?.title || m?.title || '';
    const artist = m?.author || '';
    const image = m?.image?.url || o?.thumbnail_url || '';

    let duration_ms = 0;
    if (name) {
      try { duration_ms = await fetchItunesDuration(name, artist); } catch (e) {}
    }

    const track = { id, uri, name, artist, image, duration_ms };
    trackCache[id] = track;
    return track;
  }

  async function resolveName(input) {
    const track = await resolveTrack(input);
    return track?.name || '';
  }

  window.onSpotifyIframeApiReady = (IFrameAPI) => {
    const host = document.getElementById('hover-player');
    if (!host) return;
    IFrameAPI.createController(host, { uri: '', width: '100%', height: 80 }, (ctrl) => {
      controller = ctrl;
      ready = true;
      // Quando o som realmente toca, confirmamos e escondemos o botão de fallback.
      try {
        ctrl.addListener('playback_update', (e) => {
          const d = e && e.data;
          if (d && !d.isPaused && d.position > 0) { confirmedPlaying = true; hideHint(); }
        });
      } catch (err) {}
      // Só dispara sozinho se o áudio já tiver sido liberado por um gesto.
      if (pendingUri && unlocked) { _play(pendingUri); pendingUri = null; }
    });
  };

  function toUri(input) {
    if (!input) return '';
    input = String(input).trim();
    if (input.startsWith('spotify:track:')) return input;
    const m = input.match(/track[/:]([A-Za-z0-9]+)/);
    return m ? 'spotify:track:' + m[1] : '';
  }

  const isCoarsePointer = () => matchMedia('(hover: none) and (pointer: coarse)').matches;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* Bloco visual da música — markup IDÊNTICO ao card do mural (mesmas classes) */
  function vizHtml(track, loading) {
    const name = loading ? 'Carregando…' : (track.name || 'Música');
    const artist = track.artist || 'Spotify';
    const image = track.image || '';
    const dur = track.duration_ms ? formatDuration(track.duration_ms) : '';
    return `
      <div class="post-music is-playing ${loading ? 'post-music--loading' : ''}">
        ${image
          ? `<img class="post-music-cover" src="${escapeHtml(image)}" alt="" loading="lazy" />`
          : '<div class="post-music-cover post-music-cover--placeholder" aria-hidden="true">🎵</div>'}
        <div class="post-music-body">
          <span class="post-music-name">${escapeHtml(name)}</span>
          <span class="post-music-artist">${escapeHtml(artist)}</span>
        </div>
        ${dur ? `<span class="post-music-duration">${dur}</span>` : ''}
        <span class="post-music-eq" aria-hidden="true"><span></span><span></span><span></span></span>
      </div>`;
  }

  /* Preenche o mini-player do canto com o mesmo visual do card */
  async function renderNowPlaying(input) {
    const v = document.getElementById('np-visualizer');
    if (!v) return;
    const id = toUri(input).split(':').pop();
    const cached = trackCache[id];
    v.innerHTML = cached && cached.name ? vizHtml(cached, false) : vizHtml({}, true);
    const track = await resolveTrack(input);
    const cur = document.getElementById('np-visualizer');
    if (track && track.name && cur) cur.innerHTML = vizHtml(track, false);
  }

  function showWidget(author) {
    if (isCoarsePointer() || !wrap) return;
    clearTimeout(hideTimer);
    if (authorEl) authorEl.textContent = author || '…';
    wrap.classList.remove('opacity-0', 'translate-y-6', 'pointer-events-none');
    wrap.setAttribute('aria-hidden', 'false');
  }

  function hideWidget() {
    if (!wrap || isCoarsePointer()) return;
    hideTimer = setTimeout(() => {
      wrap.classList.add('opacity-0', 'translate-y-6', 'pointer-events-none');
      wrap.setAttribute('aria-hidden', 'true');
    }, 400);
  }

  function _play(uri) {
    if (uri !== currentUri) {
      controller.loadUri(uri);
      currentUri = uri;
      setTimeout(() => { try { controller.play(); } catch (e) {} }, 300);
    } else {
      try { controller.play(); } catch (e) {}
    }
  }

  const RianMusic = {
    toUri,
    resolveName,
    resolveTrack,
    formatDuration,
    isUnlocked: () => unlocked,
    play(uriOrLink, author, options = {}) {
      const uri = toUri(uriOrLink);
      if (!uri) return;
      lastUri = uri;
      const showUi = options.showWidget !== false && !isCoarsePointer();
      if (showUi) { showWidget(author); renderNowPlaying(uriOrLink); }
      if (!ready || !controller) { pendingUri = uri; return; }
      // No mobile espera o 1º gesto (rolar a tela) liberar o áudio; desktop toca já.
      if (!unlocked && isCoarsePointer()) { pendingUri = uri; showHint(); return; }
      pendingUri = null;
      _play(uri);
      // iOS pode bloquear mesmo com o "flag" liberado: se não confirmar, mostra o botão.
      if (isCoarsePointer()) setTimeout(() => { if (!confirmedPlaying) showHint(); }, 1200);
    },
    pause() {
      pendingUri = null;
      if (ready && controller) { try { controller.pause(); } catch (e) {} }
      hideWidget();
      window.dispatchEvent(new CustomEvent('rian-music-pause'));
    },
    /* Libera o áudio com um toque real (fallback iOS) e retoca o último post. */
    unlock() {
      unlocked = true;
      if (ready && controller) {
        try { controller.play(); } catch (e) {}
        const u = pendingUri || lastUri;
        if (u) _play(u);
      }
    },
  };

  window.RianMusic = RianMusic;

  /* Liga o botão de fallback (iOS) */
  document.getElementById('audio-unlock')?.addEventListener('click', () => RianMusic.unlock());
})();
