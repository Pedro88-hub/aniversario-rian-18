/* =====================================================================
 *  CONFIG — Mexa SÓ aqui pra ligar o site nas suas contas/credenciais.
 *  Nada de código fora deste arquivo precisa ser alterado.
 * ===================================================================== */

window.RIAN_CONFIG = {
  /* ---------- Aniversariante ---------- */
  // Data e hora de nascimento do Rian (nasceu em 17/06/2008).
  // Formato: ano, mês-1 (0=Jan), dia, hora, min. Ajuste se souber a hora certa.
  birthDate: new Date(2008, 5, 17, 12, 0, 0),

  /* ---------- Spotify ---------- */
  spotify: {
    // ID da playlist que toca no player (pega na URL: open.spotify.com/playlist/<ESTE_ID>)
    embedPlaylistId: '3IKZHLSvyLfi2rkTElZHJO', // 💥🔉 — playlist do baile
    // Link COMPLETO da playlist COLABORATIVA (botão "adicionar funk")
    collabPlaylistUrl: 'https://open.spotify.com/playlist/3IKZHLSvyLfi2rkTElZHJO?si=1028595351744ade',
  },

  /* ---------- Supabase (persistência do mural) ----------
   * Enquanto ficar em branco, o site roda em MODO MOCK:
   * as mensagens são salvas só no navegador (localStorage).
   *
   * Pra ativar de verdade:
   *  1. Crie um projeto em https://supabase.com
   *  2. Cole a URL e a anon key abaixo.
   *  3. Rode o SQL que está em supabase-setup.sql (cria tabela + bucket).
   */
  supabase: {
    url: '',      // <- ex: 'https://xxxxxxxx.supabase.co'
    anonKey: '',  // <- ex: 'eyJhbGciOi...'
    table: 'mural',          // nome da tabela das mensagens
    bucket: 'mural-fotos',   // nome do bucket de imagens
  },
};

/* Helper: estamos com banco de verdade configurado? */
window.RIAN_CONFIG.hasSupabase = Boolean(
  window.RIAN_CONFIG.supabase.url && window.RIAN_CONFIG.supabase.anonKey
);
