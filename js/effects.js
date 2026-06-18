/* =====================================================================
 *  EFEITOS — confete, cursor customizado, stickers de fundo e toast.
 * ===================================================================== */

/* ---------- Confete ---------- */
const RianFX = {
  burst() {
    if (typeof confetti !== 'function') return;
    const colors = ['#39FF14', '#FF1493', '#9D00FF', '#00F0FF', '#FFE600'];
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors });
  },

  rain(duration = 2500) {
    if (typeof confetti !== 'function') return;
    const colors = ['#39FF14', '#FF1493', '#9D00FF', '#00F0FF', '#FFE600'];
    const end = Date.now() + duration;
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  },

  toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.querySelector('div').textContent = msg;
    t.classList.remove('show');
    void t.offsetWidth; // reinicia animação
    t.classList.add('show');
  },
};
window.RianFX = RianFX;

/* ---------- Cursor customizado (óculos de Juliet 🕶️) ---------- */
(function customCursor() {
  const cursor = document.getElementById('cursor');
  if (!cursor || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  window.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });
  window.addEventListener('mousedown', () => cursor.classList.add('click'));
  window.addEventListener('mouseup', () => cursor.classList.remove('click'));
  // Vira a cara do Rian quando passa por algo clicável
  document.addEventListener('mouseover', (e) => {
    cursor.textContent = e.target.closest('a, button') ? '👑' : '🕶️';
  });
})();

/* ---------- Stickers de meme espalhados no fundo ---------- */
(function stickers() {
  const wrap = document.getElementById('stickers');
  if (!wrap) return;

  const memes = ['🐕', '😂', '💀', '🔥', '🎉', '👑', '🕶️', '🤡', '🫡', '🥶', '🐐', '💅', '📸', '🎵', '🍫'];
  const photos = [
    'assets/img/rian-coroa.png',
    'assets/img/rian-selfie.jpg',
    'assets/img/rian-bone.png',
    'assets/img/rian-kitty.png',
    'assets/img/rian-jabuti.png',
    'assets/img/rian-espelho.png',
  ];

  function place(el) {
    el.style.left = Math.random() * 92 + '%';
    el.style.top = Math.random() * 92 + '%';
    el.style.setProperty('--rot', Math.random() * 40 - 20 + 'deg');
    el.style.setProperty('--dur', 10 + Math.random() * 12 + 's');
    el.style.animationDelay = -Math.random() * 10 + 's';
    wrap.appendChild(el);
  }

  function makePhoto(src, extraClass) {
    const img = document.createElement('img');
    img.className = 'sticker sticker-photo' + (extraClass ? ' ' + extraClass : '');
    img.src = src;
    img.alt = '';
    img.loading = 'lazy';
    place(img);
    return img;
  }

  /* Sincroniza as fotos enviadas ao mural com o fundo.
     Recebe a lista de URLs/dataURLs e recria só os stickers do mural. */
  function syncMuralPhotos(srcList) {
    wrap.querySelectorAll('.mural-sticker').forEach((el) => el.remove());
    (srcList || []).forEach((src) => { if (src) makePhoto(src, 'mural-sticker'); });
  }
  window.RianStickers = { syncMuralPhotos };

  // Emojis de meme
  const emojiCount = window.innerWidth < 640 ? 7 : 13;
  for (let i = 0; i < emojiCount; i++) {
    const s = document.createElement('span');
    s.className = 'sticker';
    s.textContent = memes[Math.floor(Math.random() * memes.length)];
    place(s);
  }

  // Fotos do Rian flutuando no fundo (todas aparecem ao menos uma vez)
  const shuffled = photos.slice().sort(() => Math.random() - 0.5);
  const photoList = window.innerWidth < 640 ? shuffled.slice(0, 4) : shuffled.concat(shuffled.slice(0, 2));
  photoList.forEach((src) => makePhoto(src));
})();
