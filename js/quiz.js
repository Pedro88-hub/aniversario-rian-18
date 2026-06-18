/* =====================================================================
 *  QUIZ — "O quanto você conhece o Rian?"
 *  Edite as perguntas/respostas à vontade. `answer` = índice da correta.
 * ===================================================================== */
(function quiz() {
  const box = document.getElementById('quiz-box');
  if (!box) return;

  const QUESTIONS = [
    {
      q: 'Qual é o maior talento oculto do Rian?',
      options: ['Dormir em qualquer lugar', 'Gastar dinheiro que não tem com besteira', 'Dançar funk igual uma lagartixa', 'Sumir quando é hora de pagar a conta'],
      answer: 2,
    },
    {
      q: 'Onde o Rian foi flagrado usando coroa de rei?',
      options: ['Na igreja', 'No McCafé 👑', 'No banheiro', 'Na aula de matemática'],
      answer: 1,
    },
    {
      q: 'Agora que fez 18, a primeira coisa que o Rian vai fazer é:',
      options: ['Tirar a CNH e bater o carro na semana', 'Votar consciente (mentira)', 'Comprar fiado mesmo assim', 'Continuar pedindo dinheiro pros pais'],
      answer: 3,
    },
    {
      q: 'O bordão oficial do Rian é:',
      options: ['"Calma que já vou"', '"Tô chegando" (não tá)', '"Foi mal, esqueci"', '"Bora marcar" (nunca marca)'],
      answer: 1,
    },
    {
      q: 'Se o Rian fosse um meme, ele seria:',
      options: ['Cachorro caramelo 🐕', 'Flork de braços abertos', 'Aquele do "tá rindo do quê?"', 'Todos ao mesmo tempo'],
      answer: 3,
    },
  ];

  const RESULTS = [
    { min: 0, max: 2, title: '💀 Você é um estranho', sub: 'Tu conhece o Rian de onde? Do busão? Bem-vindo, intruso.' },
    { min: 3, max: 4, title: '😎 Quase um parça', sub: 'Tá no caminho, mas ainda falta vivência de rolê com o cria.' },
    { min: 5, max: 5, title: '🐐 O VERDADEIRO PARÇA', sub: 'Acertou tudo. Ou tu é o Rian, ou tu paga as contas dele. Lenda!' },
  ];

  let current = 0;
  let score = 0;

  function render() {
    const item = QUESTIONS[current];
    box.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <span class="font-meme text-cyber text-lg">PERGUNTA ${current + 1}/${QUESTIONS.length}</span>
        <span class="font-comic text-white/60 text-sm">Acertos: ${score}</span>
      </div>
      <h3 class="font-comic text-xl mb-5">${item.q}</h3>
      <div id="quiz-opts"></div>
    `;
    const opts = box.querySelector('#quiz-opts');
    item.options.forEach((opt, i) => {
      const b = document.createElement('button');
      b.className = 'quiz-opt font-body';
      b.innerHTML = `<span class="font-meme text-shock mr-2">${String.fromCharCode(65 + i)})</span> ${opt}`;
      b.addEventListener('click', () => choose(i, b, item.answer));
      opts.appendChild(b);
    });
  }

  function choose(i, btn, correct) {
    const buttons = box.querySelectorAll('.quiz-opt');
    buttons.forEach((b, idx) => {
      b.disabled = true;
      if (idx === correct) b.classList.add('correct');
      if (idx === i && i !== correct) b.classList.add('wrong');
    });
    if (i === correct) {
      score++;
      window.RianFX && RianFX.burst();
    }
    setTimeout(() => {
      current++;
      if (current < QUESTIONS.length) render();
      else finish();
    }, 900);
  }

  function finish() {
    const r = RESULTS.find((x) => score >= x.min && score <= x.max) || RESULTS[0];
    if (score === QUESTIONS.length) window.RianFX && RianFX.rain(3000);
    box.innerHTML = `
      <div class="text-center py-4">
        <p class="font-comic text-white/60">Você fez</p>
        <p class="font-meme text-6xl text-neon my-2">${score}/${QUESTIONS.length}</p>
        <h3 class="font-meme text-3xl text-shock mt-4">${r.title}</h3>
        <p class="font-comic text-white/70 mt-2 max-w-md mx-auto">${r.sub}</p>
        <button id="quiz-restart" class="mt-6 font-meme text-lg bg-cyber text-black px-6 py-3 rounded-full hover:bg-neon transition active:scale-95">
          🔁 Jogar de novo
        </button>
      </div>
    `;
    box.querySelector('#quiz-restart').addEventListener('click', () => {
      current = 0; score = 0; render();
    });
  }

  render();
})();
