# Autenticação — como funciona hoje

Hoje o site publica arquivos estáticos (GitHub Actions → `dist/` →
drop no Wix Headless). Por isso o login real acontece **no navegador**,
sem servidor pelo meio, e as áreas seguem protegidas no cliente (como o
mock sempre foi).

> **Middleware SSR removido do repo (04/11/2026):** o middleware de sessão
> (`src/middleware.ts`) + rotas SSR `/api/auth/*` + `src/lib/session.ts`
> vivem agora em `../middleware-ssr` (fora deste repositório), para uso
> futuro quando o deploy virar SSR. Motivo: no build estático o Astro
> executava o middleware no prerender, sem sessão, e o build emitia as
> páginas de membros como página de redirect — era a causa do "loop"
> de login (`/membros.html` ↔ `/entrar.html`). Sem ele, o build estático
> é 100% páginas reais, e a proteção no ar é a client-side + o Wix
> recusando a leitura de `conteudos` para anônimos (`WDE0027`).

## Fluxo de login (ativo)

1. **Entrar** — na página `/entrar.html` ou no modal de login do cabeçalho,
   o botão principal leva à página de login hospedada do Wix (OAuth +
   PKCE). `src/lib/auth/iniciarLoginWix.ts` gera PKCE + `state`, guarda em
   `sessionStorage` (`casaloba_oauth`) e redireciona.
2. **Callback** — `public/auth/callback.html` (copiado para
   `dist/auth/callback.html`; servido também pelo `astro dev`). O host
   estático do Wix **reserva `/api/*`** (tudo ali responde 404, mesmo
   arquivos subidos), por isso o callback é `/auth/callback.html` e a
   URL exata precisa estar cadastrada no app OAuth. Valida o `state`,
   troca o `code` por tokens (`POST /oauth2/token`,
   `authorization_code` + `codeVerifier`) e salva a sessão em
   `localStorage` (`casaloba_session`). Redireciona de volta para o
   destino original (`?redirect=`).
3. **Sessão nos componentes** — `auth.usuariaAtual()`
   (`src/lib/auth/index.ts`) devolve o membro real via
   `members.getCurrentMember` (SDK) quando há sessão válida; o access
   token é renovado via `refresh_token` quando expira.
   Em produção, sem sessão Wix não há acesso. Em `npm run dev`, o mock de
   demonstração (senha `casaloba123`) também funciona; no build de
   produção o mock é eliminado da interface.
   A área de membros lê os conteúdos do CMS com o **token de membro**
   (`src/lib/membrosCms.ts`); o Wix recusa anônimos (`WDE0027`), e o
   conteúdo nunca entra no bundle publicado. Erro transitório ao ler o
   perfil/token **não** apaga a sessão (só 4xx do Wix desloga);
   ver `src/lib/auth/wixAuth.ts` e `wixSession.ts`.
4. **Plano do membro** — o plano real virá do Wix Pricing Plans (tarefa
   separada). Até lá, membro real entra como **loba** (acesso mínimo);
   as contas demo mantêm os três níveis.
5. **Sair** — `auth.sair()` limpa a sessão local (Wix e mock).

## App OAuth no Wix (feito)

- O site **Casa Loba | Headless** tem o cliente headless (tela *Headless
  Settings → Clientes headless* do dashboard) — é o `PUBLIC_WIX_CLIENT_ID`
  do `.env` (e está no CI, pois client ID é público).
- **Redirect URIs necessárias** (correspondência exata):
  - Produção: `https://headless-urlsttluzfw-arthursoares1234-1410.wix-site-host.com/auth/callback.html`
  - Local: `http://localhost:4321/auth/callback.html`
- **O host estático reserva `/api/*` (404)**, então as URIs antigas
  `/api/auth/callback` não servem em produção; a do item acima é a
  correta.
- **A API não permite editar a lista** de redirect URIs (testado em
  04/11/2026: o campo é ignorado). A edição é manual no painel
  (Headless Settings → Clientes headless → CompanionApp → Redirect URIs).
- "Invalid redirect URI" no login = URI não salva na lista.
- OAuth do Wix Headless **não usa secret**.

## Verificado

- `POST /oauth2/token` com o client ID de produção → `200` (também do
  navegador, via fetch: status 200).
- `generateOAuthData` + `getAuthUrl` (mesmo código do site) → URL de
  autorização válida (host do Wix, PKCE, `responseMode=query`).
- Build inclui `dist/auth/callback.html` (200/text-html no ar) e os
  botões **Entrar** nas duas portas. Sem o middleware no repo, o build
  estático emite páginas reais de membros (sem interstício de redirect).
- `npm run check` limpo; build estático passa.

**Verificado em produção (04/11/2026):** login real completado no ar —
a usuária caiu na área de membros sem loop, logout e redirect de
`/membros.html` sem sessão funcionando (`/entrar.html?redirect=…`).
Se o retorno do Wix quebrar de novo, o fallback é o SSR
(em `../middleware-ssr`).

## Arquivos

- Client-side: `src/lib/auth/{iniciarLoginWix,wixSession,wixAuth,index}.ts`,
  `src/lib/membrosCms.ts`, `public/auth/callback.html`,
  `src/pages/entrar.astro`, `src/components/ModalLogin.astro`
- Leitura pública do CMS: `src/lib/cms.ts` (ver `docs/CMS.md`)
- Fora do repo (uso futuro): `../middleware-ssr` (middleware de sessão,
  rotas SSR `/api/auth/*`, `src/lib/session.ts`, `src/env.d.ts`, snippet
  do adapter — ver o README lá)
