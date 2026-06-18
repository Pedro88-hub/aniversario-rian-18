/* =====================================================================
 *  MURAL — armazenamento (mock localStorage OU Supabase), render,
 *  reações, comentários, música anexada e modal expandido.
 * ===================================================================== */
(function mural() {
  const cfg = window.RIAN_CONFIG;
  const grid = document.getElementById('mural-grid');
  const empty = document.getElementById('mural-empty');
  const dbStatus = document.getElementById('db-status');
  if (!grid) return;

  const REACTIONS = ['❤️', '😂', '🚀'];
  const LS_KEY = 'rian_mural_v1';

  /* ---------------- Camada de dados (driver) ---------------- */
  let supa = null;
  if (cfg.hasSupabase && window.supabase) {
    supa = window.supabase.createClient(cfg.supabase.url, cfg.supabase.anonKey);
  }

  const Store = {
    async list() {
      if (supa) {
        const { data, error } = await supa
          .from(cfg.supabase.table)
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      }
      return JSON.parse(localStorage.getItem(LS_KEY) || '[]')
        .sort((a, b) => b.created_at - a.created_at);
    },

    async add(entry) {
      const track_uri = entry.music && window.RianMusic ? RianMusic.toUri(entry.music) : '';
      let track_name = '';
      let track_artist = '';
      let track_image = '';
      let track_duration_ms = 0;
      if (track_uri && window.RianMusic) {
        try {
          const meta = await RianMusic.resolveTrack(track_uri);
          if (meta) {
            track_name = meta.name || '';
            track_artist = meta.artist || '';
            track_image = meta.image || '';
            track_duration_ms = meta.duration_ms || 0;
          }
        } catch (e) {}
      }
      if (supa) {
        let photo_url = null;
        if (entry.file) {
          const path = `${Date.now()}_${entry.file.name}`;
          const up = await supa.storage.from(cfg.supabase.bucket).upload(path, entry.file);
          if (up.error) throw up.error;
          photo_url = supa.storage.from(cfg.supabase.bucket).getPublicUrl(path).data.publicUrl;
        }
        const { data, error } = await supa
          .from(cfg.supabase.table)
          .insert({
            name: entry.name,
            message: entry.message,
            photo_url,
            track_uri,
            track_name,
            track_artist,
            track_image,
            track_duration_ms,
            reactions: { '❤️': 0, '😂': 0, '🚀': 0 },
            comments: [],
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      // MOCK
      const all = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      const item = {
        id: 'm_' + Date.now(),
        name: entry.name,
        message: entry.message,
        photo_url: entry.dataUrl || null,
        track_uri,
        track_name,
        track_artist,
        track_image,
        track_duration_ms,
        reactions: { '❤️': 0, '😂': 0, '🚀': 0 },
        comments: [],
        created_at: Date.now(),
      };
      all.push(item);
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(all));
      } catch (err) {
        if (err.name === 'QuotaExceededError') {
          throw new Error('STORAGE_FULL');
        }
        throw err;
      }
      return item;
    },

    async react(id, emoji) {
      if (supa) {
        const { data: row } = await supa.from(cfg.supabase.table).select('reactions').eq('id', id).single();
        const reactions = row?.reactions || { '❤️': 0, '😂': 0, '🚀': 0 };
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        await supa.from(cfg.supabase.table).update({ reactions }).eq('id', id);
        return reactions;
      }
      const all = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      const item = all.find((x) => x.id === id);
      if (item) {
        item.reactions[emoji] = (item.reactions[emoji] || 0) + 1;
        localStorage.setItem(LS_KEY, JSON.stringify(all));
        return item.reactions;
      }
    },

    async addComment(id, comment) {
      const c = { name: comment.name, text: comment.text, created_at: Date.now() };
      if (supa) {
        const { data: row } = await supa.from(cfg.supabase.table).select('comments').eq('id', id).single();
        const comments = (row && row.comments) || [];
        comments.push(c);
        await supa.from(cfg.supabase.table).update({ comments }).eq('id', id);
        return comments;
      }
      const all = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      const item = all.find((x) => x.id === id);
      if (item) {
        item.comments = item.comments || [];
        item.comments.push(c);
        localStorage.setItem(LS_KEY, JSON.stringify(all));
        return item.comments;
      }
    },
  };

  /* ---------------- Render ---------------- */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function postMusicHtml(item, extraClass = '') {
    const loaded = Boolean(item.track_name);
    const name = loaded ? escapeHtml(item.track_name) : 'Carregando…';
    const artist = item.track_artist ? escapeHtml(item.track_artist) : 'Spotify';
    const duration = item.track_duration_ms && window.RianMusic
      ? RianMusic.formatDuration(item.track_duration_ms)
      : '';
    const image = item.track_image ? escapeHtml(item.track_image) : '';

    return `
      <div class="post-music ${loaded ? '' : 'post-music--loading'} ${extraClass}" data-music-id="${item.id}">
        ${image
          ? `<img class="post-music-cover" src="${image}" alt="" loading="lazy" />`
          : '<div class="post-music-cover post-music-cover--placeholder" aria-hidden="true">🎵</div>'}
        <div class="post-music-body">
          <span class="post-music-name">${name}</span>
          <span class="post-music-artist">${artist}</span>
        </div>
        ${duration ? `<span class="post-music-duration">${duration}</span>` : ''}
        <span class="post-music-eq" aria-hidden="true"><span></span><span></span><span></span></span>
      </div>`;
  }

  function cardHtml(item) {
    const hasPhoto = Boolean(item.photo_url);
    const hasMusic = Boolean(item.track_uri);
    const commentCount = (item.comments && item.comments.length) || 0;
    const reactBtns = REACTIONS.map((e) =>
      `<button class="react-btn" data-react="${e}" data-id="${item.id}">${e} <span data-count="${e}">${(item.reactions && item.reactions[e]) || 0}</span></button>`
    ).join('');

    return `
      <article class="polaroid ${hasPhoto ? '' : 'notecard'}" data-id="${item.id}">
        ${hasMusic ? postMusicHtml(item) : ''}
        ${hasPhoto ? `<img src="${item.photo_url}" alt="foto de ${escapeHtml(item.name)}" loading="lazy" />` : ''}
        <p class="note">${escapeHtml(item.message)}</p>
        <p class="author">— ${escapeHtml(item.name)}</p>
        <div class="flex items-center justify-between mt-2 text-sm text-zinc-700 font-bold">
          <div class="flex gap-3" data-reactions>${reactBtns}</div>
          <span class="text-zinc-500">💬 ${commentCount}</span>
        </div>
      </article>`;
  }

  async function refresh() {
    let items = [];
    let connected = false;
    try {
      items = await Store.list();
      connected = Boolean(supa);
    } catch (e) {
      console.error(e);
      if (supa) RianFX.toast('Deu ruim ao carregar o mural 😬');
    }
    setDbStatus(connected);
    if (window.RianMusic) RianMusic.pause();
    grid.innerHTML = items.map(cardHtml).join('');
    empty.classList.toggle('hidden', items.length > 0);
    wireCards(items);
    fillMusicMeta(items);
    setupFeedAutoplay(items);

    // Fotos do mural também flutuam no fundo
    if (window.RianStickers) {
      window.RianStickers.syncMuralPhotos(items.map((x) => x.photo_url).filter(Boolean));
    }
  }

  function needsMusicMeta(item) {
    return !item.track_artist || !item.track_image;
  }

  function applyMusicMeta(item, root = grid) {
    const el = root?.querySelector(`.post-music[data-music-id="${item.id}"]`);
    if (!el) return;

    el.classList.remove('post-music--loading');

    const nameEl = el.querySelector('.post-music-name');
    const artistEl = el.querySelector('.post-music-artist');
    if (nameEl && item.track_name) nameEl.textContent = item.track_name;
    if (artistEl && item.track_artist) artistEl.textContent = item.track_artist;

    if (item.track_image) {
      const placeholder = el.querySelector('.post-music-cover--placeholder');
      const cover = el.querySelector('img.post-music-cover');
      if (placeholder) {
        const img = document.createElement('img');
        img.className = 'post-music-cover';
        img.src = item.track_image;
        img.alt = '';
        img.loading = 'lazy';
        placeholder.replaceWith(img);
      } else if (cover) {
        cover.src = item.track_image;
      }
    }

    if (item.track_duration_ms && window.RianMusic) {
      const duration = RianMusic.formatDuration(item.track_duration_ms);
      let durEl = el.querySelector('.post-music-duration');
      if (!durEl && duration) {
        durEl = document.createElement('span');
        durEl.className = 'post-music-duration';
        el.querySelector('.post-music')?.appendChild(durEl);
      }
      if (durEl) durEl.textContent = duration;
    }
  }

  /* Preenche capa, artista e duração dos posts que ainda não têm metadados */
  function fillMusicMeta(items) {
    if (!window.RianMusic) return;
    items.forEach(async (it) => {
      if (!it.track_uri || !needsMusicMeta(it)) return;
      const meta = await RianMusic.resolveTrack(it.track_uri);
      if (!meta?.name) return;
      it.track_name = meta.name;
      it.track_artist = meta.artist || it.track_artist || '';
      it.track_image = meta.image || it.track_image || '';
      it.track_duration_ms = meta.duration_ms || it.track_duration_ms || 0;
      applyMusicMeta(it);
    });
  }

  /* MOBILE: feed estilo Instagram — toca a música do post conforme rola por ele */
  let feedObserver = null;
  let activeMusicEl = null;

  function setActivePostMusic(el) {
    if (activeMusicEl === el) return;
    activeMusicEl?.querySelector('.post-music')?.classList.remove('is-playing');
    activeMusicEl = el || null;
    activeMusicEl?.querySelector('.post-music')?.classList.add('is-playing');
  }

  function isMobileFeed() {
    return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  }

  function setupFeedAutoplay(items) {
    if (feedObserver) { feedObserver.disconnect(); feedObserver = null; }
    setActivePostMusic(null);
    if (!window.RianMusic || !isMobileFeed()) return;

    const musicPosts = items.filter((x) => x.track_uri);
    if (!musicPosts.length) return;

    const ratios = new Map();
    let activeId = null;

    function pickAndPlay() {
      let best = null;
      let bestRatio = 0;
      ratios.forEach((r, el) => {
        if (r > bestRatio) { bestRatio = r; best = el; }
      });

      if (best && bestRatio >= 0.3) {
        const item = musicPosts.find((x) => String(x.id) === best.dataset.id);
        if (item && String(item.id) !== activeId) {
          activeId = String(item.id);
          setActivePostMusic(best);
          RianMusic.play(item.track_uri, item.name, { showWidget: false });
        }
      } else if (activeId) {
        activeId = null;
        setActivePostMusic(null);
        RianMusic.pause();
      }
    }

    feedObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => ratios.set(e.target, e.intersectionRatio));
      pickAndPlay();
    }, {
      threshold: [0, 0.15, 0.3, 0.5, 0.7, 0.9, 1],
      rootMargin: '-10% 0px -10% 0px',
    });

    grid.querySelectorAll('.polaroid').forEach((el) => {
      const item = musicPosts.find((x) => String(x.id) === el.dataset.id);
      if (item) feedObserver.observe(el);
    });
  }

  function wireCards(items) {
    grid.querySelectorAll('.polaroid').forEach((el) => {
      const item = items.find((x) => String(x.id) === el.dataset.id);
      if (!item) return;

      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-react]')) return; // reação não abre modal
        openCardModal(item);
      });

      // DESKTOP: música toca no hover do post (no mobile é por scroll — ver setupFeedAutoplay)
      if (item.track_uri && window.RianMusic && window.matchMedia('(hover: hover)').matches) {
        el.addEventListener('mouseenter', () => {
          RianMusic.play(item.track_uri, item.name);
          el.querySelector('.post-music')?.classList.add('is-playing');
        });
        el.addEventListener('mouseleave', () => {
          RianMusic.pause();
          el.querySelector('.post-music')?.classList.remove('is-playing');
        });
      }
    });

    grid.querySelectorAll('[data-react]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const emoji = btn.dataset.react;
        const id = btn.dataset.id;
        const reactions = await Store.react(id, emoji);
        if (reactions) btn.querySelector(`[data-count="${emoji}"]`).textContent = reactions[emoji];
        RianFX.burst();
      });
    });
  }

  /* ---------------- Modal expandido ---------------- */
  function commentsHtml(comments) {
    if (!comments || !comments.length) {
      return '<p class="text-white/40 font-comic text-sm py-2">Ninguém comentou ainda. Solta a primeira. 👇</p>';
    }
    return comments.map((c) => {
      const initial = escapeHtml((c.name || '?').charAt(0).toUpperCase());
      return `
      <div class="ig-comment">
        <div class="ig-avatar">${initial}</div>
        <p class="ig-comment-text"><span class="ig-comment-name">${escapeHtml(c.name)}</span> ${escapeHtml(c.text)}</p>
      </div>`;
    }).join('');
  }

  function openCardModal(item) {
    const body = document.getElementById('card-modal-body');
    const initial = escapeHtml((item.name || '?').charAt(0).toUpperCase());
    const reactBtns = REACTIONS.map((e) =>
      `<button type="button" class="card-modal-react-btn react-btn" data-react="${e}" data-id="${item.id}">${e} <span data-count="${e}">${(item.reactions && item.reactions[e]) || 0}</span></button>`
    ).join('');

    body.innerHTML = `
      <div class="card-modal-header">
        <div class="card-modal-avatar">${initial}</div>
        <p class="card-modal-author">${escapeHtml(item.name)}</p>
      </div>
      ${item.photo_url ? `<div class="card-modal-media"><img src="${item.photo_url}" alt="foto de ${escapeHtml(item.name)}" /></div>` : ''}
      <div class="card-modal-scroll">
        ${item.track_uri ? postMusicHtml(item, 'post-music--modal mb-3') : ''}
        <p class="card-modal-message">${escapeHtml(item.message)}</p>
        <div class="card-modal-reactions" data-reactions>${reactBtns}</div>
        <h4 class="card-modal-comments-title">💬 Comentários</h4>
        <div id="comments-list" class="space-y-1">${commentsHtml(item.comments)}</div>
      </div>

      <form id="comment-form" class="card-modal-footer">
        <input id="c-name" required maxlength="40" placeholder="Teu nome"
               class="w-24 sm:w-28 shrink-0 bg-black/60 border border-white/20 focus:border-cyber rounded-full px-3 py-2 outline-none text-sm" />
        <input id="c-text" required maxlength="200" placeholder="Adicione um comentário..."
               class="flex-1 min-w-0 bg-black/60 border border-white/20 focus:border-cyber rounded-full px-3 py-2 outline-none text-sm" />
        <button type="submit" class="shrink-0 text-cyber font-bold px-2 hover:text-neon transition active:scale-95">Postar</button>
      </form>`;

    body.querySelectorAll('[data-react]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const emoji = btn.dataset.react;
        const reactions = await Store.react(item.id, emoji);
        if (reactions) {
          item.reactions = reactions;
          btn.querySelector(`[data-count="${emoji}"]`).textContent = reactions[emoji];
          RianFX.burst();
        }
      });
    });

    // Comentar
    const form = body.querySelector('#comment-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = body.querySelector('#c-name').value.trim();
      const text = body.querySelector('#c-text').value.trim();
      if (!name || !text) return;
      const comments = await Store.addComment(item.id, { name, text });
      if (comments) {
        item.comments = comments;
        body.querySelector('#comments-list').innerHTML = commentsHtml(comments);
        body.querySelector('#c-text').value = '';
        RianFX.burst();
        refresh(); // atualiza o contador no card
      }
    });

    window.openModal('card-modal');

    if (item.track_uri && needsMusicMeta(item) && window.RianMusic) {
      RianMusic.resolveTrack(item.track_uri).then((meta) => {
        if (!meta?.name) return;
        item.track_name = meta.name;
        item.track_artist = meta.artist || '';
        item.track_image = meta.image || '';
        item.track_duration_ms = meta.duration_ms || 0;
        applyMusicMeta(item, body);
      });
    }

    // Música também toca ao abrir o post
    if (item.track_uri && window.RianMusic) {
      RianMusic.play(item.track_uri, item.name, { showWidget: !isMobileFeed() });
    }
  }

  /* ---------------- Indicador de conexão (header) ---------------- */
  function setDbStatus(online) {
    if (!dbStatus) return;
    dbStatus.classList.toggle('is-online', online);
    dbStatus.classList.toggle('is-offline', !online);
    dbStatus.title = online ? 'Conectado ao banco' : 'Desconectado';
    dbStatus.setAttribute('aria-label', online ? 'Conectado ao banco' : 'Desconectado');
  }

  /* ---------------- Expor pro main.js ---------------- */
  window.RianMural = { add: Store.add, refresh };
  window.addEventListener('rian-music-pause', () => setActivePostMusic(null));
  refresh();
})();
