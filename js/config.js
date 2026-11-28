// Para ativar a nuvem (Supabase), preencha as duas linhas abaixo.
// Deixe vazio para usar o app só neste navegador (modo local).
// Use a chave PUBLISHABLE (começa com sb_publishable_...). A chave "anon" antiga também funciona.
// Ela é pública por design: a segurança vem das regras RLS do banco.
// NUNCA coloque aqui a chave "secret" (sb_secret_...) nem a "service_role".
window.MF_CONFIG = {
  SUPABASE_URL: 'https://ndgejvqjtmyyyrssjibr.supabase.co',       // ex.: https://abcdefgh.supabase.co
  SUPABASE_ANON_KEY: 'sb_publishable_r_hBHc0el10g7cHBoCZKPg_ssEO9ZW0'   // ex.: eyJhbGciOi...
};
