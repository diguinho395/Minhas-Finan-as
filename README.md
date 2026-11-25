# Minhas Finanças

Site de controle financeiro pessoal: registre receitas e despesas, acompanhe saldo, cartões, objetivos e relatórios. Feito com HTML, CSS e JavaScript puro, sem framework e sem etapa de build.

Funciona de dois jeitos:

- **Modo local (padrão):** os dados ficam só no navegador. Basta abrir `minhas-financas/login.html`.
- **Modo nuvem (Supabase):** login com e-mail, redefinição de senha por link e dados salvos na sua conta, acessíveis de qualquer aparelho.

## Funcionalidades

- **Início:** saldo atual, saldo previsto até o fim do mês, gráfico de evolução dos últimos 6 meses, receitas, despesas e saldo do mês, gastos por dia, visão dos meses passados e futuros, vencimentos e orçamento por categoria.
- **Lançamentos:** receitas e despesas com categorias, subcategorias e ícones. Lançamentos com data futura ficam agendados e entram no saldo no dia. Suporte a repetição mensal e parcelamento.
- **Contas e cartões:** saldo de cada conta; cartões com limite, dia de fechamento e vencimento. As compras entram na fatura certa conforme a data de fechamento, e a fatura pode ser paga pelo app.
- **Objetivos:** metas com valor, prazo e imagem de fundo, com quanto guardar por mês.
- **Relatórios:** despesas e receitas por categoria e comparativo dos últimos 6 meses.
- **Configurações:** categorias e subcategorias, metas por categoria, meta de economia mensal, exportar e importar dados (JSON).
- **Conta:** cadastro, login, "olhinho" para ver a senha e recuperação de senha.

## Como rodar localmente

1. Baixe ou clone este repositório.
2. Abra `minhas-financas/login.html` no navegador, crie uma conta e use.

Se o navegador reclamar ao abrir direto do disco, sirva a pasta com um servidor local:

```bash
cd minhas-financas
python3 -m http.server 3000
# abra http://localhost:3000/login.html
```

No modo local, os dados ficam no `localStorage` do navegador. Eles **não** são enviados para lugar nenhum, não sincronizam entre aparelhos e somem se você limpar os dados de navegação. Use **Configurações → Exportar dados** para guardar uma cópia.

## Estrutura

```
minhas-financas/
├── index.html          # app (início, transações, contas, cartões, objetivos, relatórios, configurações)
├── login.html          # entrar
├── cadastro.html       # criar conta
├── esqueci.html        # esqueci a senha
├── redefinir.html      # nova senha (link enviado por e-mail, modo nuvem)
├── css/style.css
├── js/
│   ├── config.js       # chaves do Supabase (vazio = modo local)
│   ├── store.js        # autenticação e armazenamento (local ou nuvem)
│   ├── auth.js         # telas de login, cadastro e recuperação
│   ├── boot.js         # carrega a sessão e inicia o app
│   ├── app.js          # telas e regras do app
│   ├── icons.js        # ícones
│   └── vendor/         # biblioteca oficial do Supabase (MIT)
├── supabase/schema.sql # tabela e regras de segurança (RLS)
└── LEIA-ME.md
```

## Ativar a nuvem (Supabase)

1. Crie um projeto em <https://supabase.com> (o plano gratuito serve).
2. Em **SQL Editor**, cole o conteúdo de `minhas-financas/supabase/schema.sql` e clique em **Run**.
3. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public**.
4. Preencha `minhas-financas/js/config.js`:

   ```js
   window.MF_CONFIG = {
     SUPABASE_URL: 'https://SEU-PROJETO.supabase.co',
     SUPABASE_ANON_KEY: 'sua-chave-anon'
   };
   ```

5. Em **Authentication → URL Configuration**, defina:
   - **Site URL:** o endereço do site publicado (ex.: `https://seu-projeto.vercel.app`).
   - **Redirect URLs:** `https://seu-projeto.vercel.app/**` (e `http://localhost:3000/**` para testes locais).
6. Em **Authentication → Providers → Email**, deixe "Confirm email" ligado.

Na primeira entrada, se houver dados salvos no navegador, o app oferece enviá-los para a sua conta. Você também pode usar **Configurações → Importar dados** com um arquivo exportado antes.

## Publicar na Vercel

1. Na Vercel, clique em **Add New → Project** e importe este repositório.
2. Em **Root Directory**, escolha `minhas-financas` (o código fica dentro dessa pasta).
3. **Framework Preset:** `Other`. Não há comando de build.
4. Faça o deploy e copie o endereço para o passo 5 da seção anterior.

## Segurança e privacidade

- A chave **anon** do Supabase é pública por design: quem protege os dados são as regras RLS de `schema.sql`, que deixam cada pessoa ler e alterar somente a própria linha.
- **Nunca** coloque a chave `service_role` no código ou neste repositório.
- No modo nuvem, as senhas ficam com o Supabase Auth. No modo local, a senha é guardada só como hash (PBKDF2) no navegador, o que serve para testes e uso pessoal, e não como proteção contra quem tem acesso ao seu computador.
- Se você abrir o app em dois aparelhos e alterar nos dois, o segundo a salvar recebe um aviso de conflito e precisa recarregar. Isso evita sobrescrever dados por engano.
- O e-mail padrão do Supabase tem limite baixo de envios por hora. Para mais usuários, configure um SMTP próprio em **Authentication → SMTP Settings**.

## Tecnologias

HTML, CSS e JavaScript (sem build) · [Supabase](https://supabase.com) (Auth e PostgreSQL, opcional) · [Vercel](https://vercel.com) (hospedagem)

## Próximos passos

- Transferências entre contas
- Instalação como app (PWA)
- Modo escuro
- Testes automatizados
