# Minhas Finanças

Site estático (HTML, CSS e JavaScript). Funciona de dois jeitos:

- **Modo local** (padrão): os dados ficam só no navegador. Basta abrir `login.html`.
- **Modo nuvem (Supabase)**: login de verdade, e-mail de confirmação/redefinição de senha e dados salvos na sua conta, acessíveis de qualquer aparelho.

## Ativar a nuvem (Supabase)

1. Crie um projeto em https://supabase.com (plano gratuito serve).
2. Em **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e clique em **Run**.
3. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public**.
4. Abra `js/config.js` e preencha `SUPABASE_URL` e `SUPABASE_ANON_KEY`.
   Use somente a chave *anon*. Nunca coloque a *service_role* no site.
5. Em **Authentication → URL Configuration**:
   - **Site URL**: o endereço do seu site (ex.: `https://minhas-financas.vercel.app`).
   - **Redirect URLs**: adicione `https://minhas-financas.vercel.app/**` (e `http://localhost:3000/**` se for testar localmente).
6. Em **Authentication → Providers → Email**, deixe "Confirm email" ligado.

## Publicar no GitHub + Vercel

1. Crie um repositório **privado** no GitHub e envie esta pasta.
2. Na Vercel: **Add New → Project**, importe o repositório. Framework: *Other*. Não precisa de build.
3. Depois do deploy, copie o endereço para o passo 5 acima.

## Observações

- A pasta `js/vendor/` contém a biblioteca oficial do Supabase (v2.45.4, licença MIT), para o site não depender de CDN.
- Os dados de cada pessoa ficam em uma linha da tabela `financas`, protegida por RLS.
- Se você abrir o app em dois aparelhos ao mesmo tempo e alterar nos dois, o segundo a salvar recebe um aviso de **conflito** e precisa recarregar. Isso evita sobrescrever dados sem querer.
- O e-mail padrão do Supabase tem limite baixo de envios por hora. Para uso real, configure um SMTP próprio em *Authentication → SMTP Settings*.
- Para o seu uso pessoal, o modelo "um JSON por usuário" é simples e suficiente. Se um dia precisar de relatórios no servidor, vale migrar para tabelas separadas.
