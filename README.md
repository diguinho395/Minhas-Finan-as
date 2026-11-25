<div align="center">

# 💰 Minhas Finanças

**Controle financeiro pessoal, simples, bonito e feito sob medida.**

Registre receitas e despesas, acompanhe cartões, objetivos e relatórios, e tenha seus dados salvos na nuvem.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)

[Funcionalidades](#-funcionalidades) · [Como rodar](#-como-rodar-localmente) · [Nuvem](#-ativar-a-nuvem-supabase) · [Publicar](#-publicar-na-vercel) · [Créditos](#-créditos)

</div>

---

## 📖 Sobre o projeto

O **Minhas Finanças** nasceu da vontade de ter um site profissional para organizar as finanças do dia a dia, sem planilhas e sem complicação. Foi idealizado por **Rodrigo Araújo** e desenvolvido em parceria com o **Claude**, a IA da Anthropic: o Rodrigo definiu as telas e as regras, e o Claude escreveu o código. O projeto evolui a cada versão: começou como uma tela simples de saldo e hoje reúne contas, cartões com fatura, objetivos com imagem, relatórios e sincronização na nuvem.

Não usa framework nem etapa de build: é HTML, CSS e JavaScript puro, fácil de entender e de modificar.

Funciona de dois jeitos:

| Modo | Onde ficam os dados | Para quê |
|---|---|---|
| **Local** (padrão) | No navegador | Testar e usar sem criar nenhuma conta externa |
| **Nuvem** (Supabase) | Na sua conta, no servidor | Acessar de qualquer aparelho, recuperar a senha por e-mail |

## ✨ Funcionalidades

- 📊 **Início:** saldo atual, saldo previsto até o fim do mês, gráfico de evolução dos últimos 6 meses, receitas, despesas e saldo do mês, gastos por dia, visão dos meses passados e futuros, vencimentos e orçamento por categoria.
- 🧾 **Lançamentos:** receitas e despesas com categorias, subcategorias e ícones. Lançamentos com data futura ficam agendados e entram no saldo no dia. Suporte a repetição mensal e parcelamento.
- 🏦 **Contas e cartões:** saldo de cada conta. Cartões com limite, dia de fechamento e vencimento: as compras entram na fatura certa conforme a data de fechamento, e a fatura pode ser paga pelo app.
- 🎯 **Objetivos:** metas com valor, prazo e imagem de fundo, mostrando quanto guardar por mês.
- 📈 **Relatórios:** despesas e receitas por categoria e comparativo dos últimos 6 meses.
- ⚙️ **Configurações:** categorias e subcategorias, metas por categoria, meta de economia mensal, exportar e importar dados (JSON).
- 🔐 **Conta:** cadastro, login, "olhinho" para ver a senha e recuperação de senha.

## 🚀 Como rodar localmente

1. Baixe ou clone este repositório:

   ```bash
   git clone https://github.com/diguinho395/Minhas-Finan-as.git
   ```

2. Abra `minhas-financas/login.html` no navegador, crie uma conta e use.

Se o navegador reclamar ao abrir direto do disco, sirva a pasta com um servidor local:

```bash
cd minhas-financas
python3 -m http.server 3000
# abra http://localhost:3000/login.html
```

> **Atenção:** no modo local, os dados ficam no `localStorage` do navegador. Eles **não** são enviados para lugar nenhum, não sincronizam entre aparelhos e somem se você limpar os dados de navegação. Use **Configurações → Exportar dados** para guardar uma cópia.

## 📂 Estrutura

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

## ☁️ Ativar a nuvem (Supabase)

1. Crie um projeto em <https://supabase.com> (o plano gratuito serve).
2. Em **SQL Editor**, cole o conteúdo de `minhas-financas/supabase/schema.sql` e clique em **Run**.
3. Em **Project Settings → API**, copie a **Project URL** e a chave **Publishable** (começa com `sb_publishable_`). Fica em **Project Settings → API Keys**.
4. Preencha `minhas-financas/js/config.js`:

   ```js
   window.MF_CONFIG = {
     SUPABASE_URL: 'https://SEU-PROJETO.supabase.co',
     SUPABASE_ANON_KEY: 'sb_publishable_...'
   };
   ```

5. Em **Authentication → URL Configuration**, defina:
   - **Site URL:** o endereço do site publicado (ex.: `https://seu-projeto.vercel.app`).
   - **Redirect URLs:** `https://seu-projeto.vercel.app/**` (e `http://localhost:3000/**` para testes locais).
6. Em **Authentication → Providers → Email**, deixe "Confirm email" ligado.

Na primeira entrada, se houver dados salvos no navegador, o app oferece enviá-los para a sua conta. Você também pode usar **Configurações → Importar dados** com um arquivo exportado antes.

## 🌐 Publicar na Vercel

1. Na Vercel, clique em **Add New → Project** e importe este repositório.
2. Em **Root Directory**, escolha `minhas-financas` (o código fica dentro dessa pasta).
3. **Framework Preset:** `Other`. Não há comando de build.
4. Faça o deploy e copie o endereço para o passo 5 da seção anterior.

## 🔒 Segurança e privacidade

- A chave **publishable** do Supabase (antes chamada *anon*) é pública por design: quem protege os dados são as regras RLS de `schema.sql`, que deixam cada pessoa ler e alterar somente a própria linha.
- **Nunca** coloque a chave `secret` (`sb_secret_...`) nem a `service_role` no código ou neste repositório.
- No modo nuvem, as senhas ficam com o Supabase Auth. No modo local, a senha é guardada só como hash (PBKDF2) no navegador, o que serve para testes e uso pessoal, e não como proteção contra quem tem acesso ao seu computador.
- Se você abrir o app em dois aparelhos e alterar nos dois, o segundo a salvar recebe um aviso de conflito e precisa recarregar. Isso evita sobrescrever dados por engano.
- O e-mail padrão do Supabase tem limite baixo de envios por hora. Para mais usuários, configure um SMTP próprio em **Authentication → SMTP Settings**.

## 🗺️ Próximos passos

- [ ] Transferências entre contas
- [ ] Instalação como app (PWA)
- [ ] Modo escuro
- [ ] Testes automatizados

## 👤 Créditos

- **Ideia, design e direção do produto:** [Rodrigo Araújo](https://github.com/diguinho395) (`@diguinho395`)
- **Desenvolvimento do código:** [Claude](https://claude.ai), IA da [Anthropic](https://www.anthropic.com), a partir das instruções do Rodrigo

Sugestões e ideias são bem-vindas: abra uma *issue* aqui no repositório.

---

<div align="center">
Idealizado por <a href="https://github.com/diguinho395">Rodrigo Araújo</a> · Código escrito com o Claude (Anthropic)
</div>
