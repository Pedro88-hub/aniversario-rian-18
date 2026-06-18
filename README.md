# 🔞 O RIAN FEZ 18! — Site de Aniversário Colaborativo

Site de zoeira, memes e baile funk pros 18 anos do **Rian Baccarin** (17/06).
HTML5 + Tailwind (CDN) + JavaScript puro. **Não precisa de build nem instalar nada.**

## ▶️ Como abrir

- **Mais simples:** dê duplo clique em `index.html`.
- **Recomendado (pra Spotify e upload funcionarem 100%):** rode um servidor local:
  ```bash
  # com Python instalado
  python -m http.server 8000
  ```
  Depois abra http://localhost:8000

## 🧩 O que tem (conforme o escopo)

| Seção | O que faz |
|-------|-----------|
| **Hero** | Título meme, foto do Rian, contador de vida em tempo real e chuva de confete automática |
| **Mural** | Grid masonry estilo Polaroid, reações (❤️ 😂 🚀), modal expandido e formulário de envio (nome, mensagem, foto) |
| **Baile Funk** | Player do Spotify, botão pra playlist colaborativa e mesa de efeitos (soundboard) |
| **Quiz** | 5 perguntas zoeiras com resultado/meme no final |

Extras: cursor customizado (🕶️/👑), stickers de meme no fundo, visual dark/neon e 100% responsivo.

## ⚙️ Configuração — mexa SÓ no `js/config.js`

```js
window.RIAN_CONFIG = {
  birthDate: new Date(2008, 5, 17, 12, 0, 0), // 17/06/2008
  spotify: {
    embedPlaylistId: '...',     // ID da playlist que toca no player
    collabPlaylistUrl: '...',   // link da playlist COLABORATIVA
  },
  supabase: { url: '', anonKey: '', table: 'mural', bucket: 'mural-fotos' },
};
```

### Modo DEMO vs. Banco real
- **Sem Supabase (padrão):** as mensagens são salvas no `localStorage` do navegador — ótimo pra testar, mas cada pessoa vê só o que ela postou.
- **Com Supabase:** todo mundo vê tudo em tempo real, com fotos salvas na nuvem.

### Ligar o Supabase (5 min)
1. Crie um projeto grátis em https://supabase.com
2. No **SQL Editor**, cole e rode o conteúdo de [`supabase-setup.sql`](./supabase-setup.sql)
3. Em **Project Settings → API**, copie a **URL** e a **anon key**
4. Cole as duas em `js/config.js` → `supabase.url` e `supabase.anonKey`
5. Recarregue o site — o aviso do mural vira 🟢 "Conectado ao banco"

## 🔊 Soundboard (Mesa de Efeitos)
Agora usa **áudios de meme reais** (`.mp3` em `assets/audio/`): EITA, RECEBA (Luva de
Pedreiro), CHEGUEI, VISH, AI QUE DELÍCIA, QUE ISSO, SÓ FUNK, AIR HORN, VRAU e NOSSA.
Tem ainda **controle de volume**, botão **⏹️ PARAR** e **🎲 DJ RIAN** (toca um efeito
aleatório). Só um som toca por vez e o pad ativo pisca em neon.

Quer adicionar/trocar efeitos? Jogue o `.mp3` em `assets/audio/` e edite a lista
`SOUNDS` em `js/soundboard.js`.

> Os áudios foram baixados de [myinstants.com](https://www.myinstants.com) (sons de
> meme de uso livre/comunidade). Troque por outros à vontade.

## 🎵 Spotify
Pegue o ID na URL da playlist: `open.spotify.com/playlist/`**`<ESTE_ID>`**.
Para a colaborativa, ative "Playlist colaborativa" no app do Spotify e cole o link completo.

## 📁 Estrutura
```
index.html
css/styles.css
js/
  config.js      ← suas credenciais/preferências
  effects.js     ← confete, cursor, stickers, toast
  countdown.js   ← contador de vida
  soundboard.js  ← mesa de efeitos
  quiz.js        ← quiz
  mural.js       ← mural (mock + Supabase)
  main.js        ← cola tudo
assets/img/      ← fotos do Rian
supabase-setup.sql
```
