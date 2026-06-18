/* =====================================================================
 *  MUSIC — toca a música anexada a um post do mural usando a
 *  Spotify IFrame API. Um único player (canto inferior) é reaproveitado.
 *
 *  Observação: navegadores só deixam o áudio tocar depois que o usuário
 *  interage com a página ao menos uma vez (clicar/passar o mouse já vale).
 * ===================================================================== */
(function music() {
  let controller = null;
  let ready = false;
  let currentUri = '';
  let pendingUri = null;     // pediram pra tocar antes do player ficar pronto
  let hideTimer = null;

  const wrap = document.getElementById('now-playing');
  const authorEl = document.getElementById('np-author');

  const nameCache = {};   // id -> nome da faixa (via oEmbed)

  /* Navegadores só liberam áudio após a 1ª interação do usuário.
     Marcamos quando isso acontece pra avisar no autoplay do feed. */
  let unlocked = false;
  ['pointerdown', 'touchstart', 'keydown', 'click'].forEach((ev) =>
    window.addEventListener(ev, () => { unlocked = true; }, { once: true, passive: true })
  );

  /* Descobre o NOME da música a partir do link (Spotify oEmbed, sem login) */
  async function resolveName(input) {
    const uri = toUri(input);
    if (!uri) return '';
    const id = uri.split(':').pop();
    if (nameCache[id] !== undefined) return nameCache[id];
    nameCache[id] = ''; // evita refetch enquanto carrega
    try {
      const res = await fetch('https://open.spotify.com/oembed?url=' +
        encodeURIComponent('https://open.spotify.com/track/' + id));
      if (res.ok) {
        const data = await res.json();
        nameCache[id] = data.title || '';
      }
    } catch (e) { /* CORS/offline: segue sem nome */ }
    return nameCache[id];
  }

  /* A API chama isto quando o script termina de carregar */
  window.onSpotifyIframeApiReady = (IFrameAPI) => {
    const host = document.getElementById('hover-player');
    if (!host) return;
    IFrameAPI.createController(host, { uri: '', width: '100%', height: 80 }, (ctrl) => {
      controller = ctrl;
      ready = true;
      if (pendingUri) { _play(pendingUri); pendingUri = null; }
    });
  };

  /* Converte link/URI do Spotify em URI (spotify:track:ID) */
  function toUri(input) {
    if (!input) return '';
    input = String(input).trim();
    if (input.startsWith('spotify:track:')) return input;
    const m = input.match(/track[/:]([A-Za-z0-9]+)/);
    return m ? 'spotify:track:' + m[1] : '';
  }

  function showWidget(author) {
    if (!wrap) return;
    clearTimeout(hideTimer);
    if (authorEl) authorEl.textContent = author || '…';
    wrap.classList.remove('opacity-0', 'translate-y-6', 'pointer-events-none');
  }
  function hideWidget() {
    if (!wrap) return;
    hideTimer = setTimeout(() => {
      wrap.classList.add('opacity-0', 'translate-y-6', 'pointer-events-none');
    }, 400);
  }

  function _play(uri) {
    if (uri !== currentUri) {
      controller.loadUri(uri);
      currentUri = uri;
      // após trocar a faixa, o play precisa de um instante
      setTimeout(() => { try { controller.play(); } catch (e) {} }, 300);
    } else {
      try { controller.play(); } catch (e) {}
    }
  }

  /* API pública usada pelo mural */
  const RianMusic = {
    toUri,
    resolveName,
    isUnlocked: () => unlocked,
    play(uriOrLink, author) {
      const uri = toUri(uriOrLink);
      if (!uri) return;
      showWidget(author);
      if (!ready || !controller) { pendingUri = uri; return; }
      _play(uri);
    },
    pause() {
      pendingUri = null;
      if (ready && controller) { try { controller.pause(); } catch (e) {} }
      hideWidget();
    },
  };

  window.RianMusic = RianMusic;
})();
