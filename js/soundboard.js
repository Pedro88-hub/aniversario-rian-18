/* =====================================================================
 *  SOUNDBOARD — mesa de efeitos de funk/meme com áudios reais.
 *
 *  Os .mp3 ficam em assets/audio/ (baixados de myinstants.com).
 *  Pra adicionar/trocar um efeito: jogue o mp3 na pasta e edite a lista.
 * ===================================================================== */
(function soundboard() {
  const board = document.getElementById('soundboard');
  if (!board) return;

  const nowEl = document.getElementById('sb-now');
  const volEl = document.getElementById('sb-volume');
  const randomBtn = document.getElementById('sb-random');
  const stopBtn = document.getElementById('sb-stop');

  const SOUNDS = [
    { label: 'EITA',        emoji: '🗣️', file: 'eita.mp3' },
    { label: 'RECEBA',      emoji: '💸', file: 'receba.mp3' },
    { label: 'CHEGUEI',     emoji: '🛬', file: 'cheguei.mp3' },
    { label: 'VISH',        emoji: '😬', file: 'vish.mp3' },
    { label: 'AI QUE DELÍCIA', emoji: '🥵', file: 'delicia.mp3' },
    { label: 'QUE ISSO',    emoji: '🤨', file: 'queisso.mp3' },
    { label: 'SÓ FUNK',     emoji: '🔊', file: 'funk.mp3' },
    { label: 'AIR HORN',    emoji: '📢', file: 'airhorn.mp3' },
    { label: 'VRAU',        emoji: '🏎️', file: 'vrau.mp3' },
    { label: 'NOSSA!',      emoji: '🙏', file: 'nossa.mp3' },
  ];

  let volume = volEl ? Number(volEl.value) : 0.8;
  let currentAudio = null;
  let currentBtn = null;
  const buttons = [];

  function stopCurrent() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    if (currentBtn) currentBtn.classList.remove('playing');
    currentAudio = null;
    currentBtn = null;
    if (nowEl) nowEl.style.opacity = '0';
  }

  function play(snd, btn) {
    stopCurrent();
    const audio = new Audio('assets/audio/' + snd.file);
    audio.volume = volume;
    currentAudio = audio;
    currentBtn = btn;
    btn.classList.add('playing');
    if (nowEl) { nowEl.textContent = '▶ ' + snd.label; nowEl.style.opacity = '1'; }
    audio.addEventListener('ended', () => {
      btn.classList.remove('playing');
      if (currentBtn === btn) { currentAudio = null; currentBtn = null; if (nowEl) nowEl.style.opacity = '0'; }
    });
    audio.play().catch(() => {
      btn.classList.remove('playing');
      if (nowEl) nowEl.style.opacity = '0';
    });
    // Confete colorido em sons "fortes"
    if (window.RianFX && (snd.file === 'airhorn.mp3' || snd.file === 'funk.mp3')) RianFX.burst();
  }

  SOUNDS.forEach((snd) => {
    const btn = document.createElement('button');
    btn.className = 'sb-btn flex flex-col items-center gap-1';
    btn.innerHTML = `<span class="text-2xl">${snd.emoji}</span><span class="text-xs sm:text-sm">${snd.label}</span>`;
    btn.addEventListener('click', () => play(snd, btn));
    board.appendChild(btn);
    buttons.push(btn);
  });

  // Volume
  if (volEl) volEl.addEventListener('input', () => {
    volume = Number(volEl.value);
    if (currentAudio) currentAudio.volume = volume;
  });

  // Parar
  if (stopBtn) stopBtn.addEventListener('click', stopCurrent);

  // DJ Rian: toca um efeito aleatório
  if (randomBtn) randomBtn.addEventListener('click', () => {
    const i = Math.floor(Math.random() * SOUNDS.length);
    play(SOUNDS[i], buttons[i]);
  });
})();
