/* =====================================================================
 *  MAIN — liga a interface: modais, formulário, spotify e confete inicial.
 * ===================================================================== */
(function main() {
  const cfg = window.RIAN_CONFIG;

  /* ---------------- Bloqueio de zoom no mobile ---------------- */
  // iOS ignora user-scalable=no, então barramos a pinça e o double-tap-zoom na mão.
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((ev) =>
    document.addEventListener(ev, (e) => e.preventDefault(), { passive: false })
  );
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault(); // double-tap = zoom
    lastTouchEnd = now;
  }, { passive: false });

  /* ---------------- Modais ---------------- */
  window.openModal = (id) => document.getElementById(id)?.classList.add('modal-open');
  window.closeModal = (id) => document.getElementById(id)?.classList.remove('modal-open');

  function closeOverlay(overlay) {
    overlay.classList.remove('modal-open');
    // Para a música quando o post é fechado
    if (overlay.id === 'card-modal' && window.RianMusic) RianMusic.pause();
  }

  document.querySelectorAll('[data-close]').forEach((b) =>
    b.addEventListener('click', () => closeOverlay(b.closest('.fixed')))
  );
  // Fecha clicando fora / ESC
  document.querySelectorAll('#form-modal, #card-modal').forEach((overlay) => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(overlay); });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.querySelectorAll('.modal-open').forEach(closeOverlay);
  });

  // Abrir form
  ['open-form', 'nav-cta'].forEach((id) =>
    document.getElementById(id)?.addEventListener('click', () => window.openModal('form-modal'))
  );

  /* ---------------- Form do mural ---------------- */
  const form = document.getElementById('mural-form');
  const fileInput = document.getElementById('f-photo');
  const preview = document.getElementById('f-preview');
  let pendingFile = null;
  let pendingDataUrl = null;

  /** Reduz foto antes de salvar no localStorage (limite ~5 MB). */
  function compressImageForStorage(file, maxSide = 800, quality = 0.72) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Não deu pra processar a foto'));
      };
      img.src = url;
    });
  }

  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files[0];
    pendingFile = file || null;
    pendingDataUrl = null;
    if (!file) { preview.classList.add('hidden'); return; }

    try {
      // No modo demo, guarda versão comprimida; com Supabase, só o arquivo original.
      pendingDataUrl = cfg.hasSupabase ? null : await compressImageForStorage(file);
      preview.src = pendingDataUrl || URL.createObjectURL(file);
      preview.classList.remove('hidden');
    } catch (err) {
      console.error(err);
      pendingFile = null;
      fileInput.value = '';
      RianFX.toast('Foto inválida ou muito pesada 😬 tenta outra');
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const name = form.name.value.trim();
    const message = form.message.value.trim();
    const music = form.music.value.trim();
    if (!name || !message) return;

    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = '⏳ Mandando...';

    try {
      await window.RianMural.add({ name, message, music, file: pendingFile, dataUrl: pendingDataUrl });
      await window.RianMural.refresh();
      form.reset();
      preview.classList.add('hidden');
      pendingFile = null; pendingDataUrl = null;
      window.closeModal('form-modal');
      RianFX.rain(2000);
      RianFX.toast('Tamo junto! O Rian vai ver essa vergonha em breve. 😂');
      document.getElementById('mural').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      const msg = err.message === 'STORAGE_FULL'
        ? 'Espaço cheio neste navegador 😬 apaga posts antigos ou posta sem foto'
        : 'Deu ruim ao enviar 😬 tenta de novo';
      RianFX.toast(msg);
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });

  /* ---------------- Spotify ---------------- */
  const embed = document.getElementById('spotify-embed');
  if (embed && cfg.spotify.embedPlaylistId) {
    embed.innerHTML = `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/playlist/${cfg.spotify.embedPlaylistId}?utm_source=generator&theme=0" width="100%" height="352" frameborder="0" allowfullscreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
  }
  const addFunk = document.getElementById('add-funk');
  if (addFunk) addFunk.href = cfg.spotify.collabPlaylistUrl || '#';

  /* ---------------- Botões de confete ---------------- */
  document.getElementById('confetti-btn')?.addEventListener('click', () => RianFX.rain(2500));
  document.getElementById('footer-confetti')?.addEventListener('click', () => RianFX.burst());

  /* ---------------- Confete automático na entrada ---------------- */
  window.addEventListener('load', () => setTimeout(() => RianFX.rain(3000), 400));

  /* ---------------- Confete a cada 30 segundos ---------------- */
  setInterval(() => RianFX.rain(2000), 30000);
})();
