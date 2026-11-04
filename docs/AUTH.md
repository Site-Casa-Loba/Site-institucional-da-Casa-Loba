# Autenticação — como funciona hoje

Hoje o site publica arquivos estáticos (GitHub Actions → `dist/client/` →
drop no Wix Headless). Por isso o login real acontece **no navegador**,
sem servidor pelo meio, e as áreas seguem protegidas no cliente (como o
mock sempre foi). O SSR (middleware + `/api/auth/*`) está implementado e
testado como opção futura — ver "Opção SSR" abaixo.

## Fluxo de login (ativo)

1. **Entrar** — na página `/entrar.html` ou no modal de login do cabeçalho,
   o botão principal leva à página de login hospedada do Wix (OAuth +
   PKCE). `src/lib/auth/iniciarLoginWix.ts` gera PKCE + `state`, guarda em
   `sessionStorage` (`casaloba_oauth`) e redireciona.
2. **Callback** — `public/api/auth/callback` (arquivo **sem extensão**,
   copiado para `dist/client/api/auth/callback`). É a URL exata
   cadastrada no app OAuth do site. Valida o `state`, troca o `code` por
   tokens (`POST /oauth2/token`, `authorization_code` + `codeVerifier`) e
   salva a sessão em `localStorage` (`casaloba_session`). Redireciona de
   volta para o destino original (`?redirect=`).
3. **Sessão nos componentes** — `auth.usuariaAtual()`
   (`src/lib/auth/index.ts`) devolve o membro real via
   `members.getCurrentMember` (SDK) quando há sessão válida; o access
   token é renovado via `refresh_token` quando expira.
   Em produção, sem sessão Wix não há acesso. Em `npm run dev`, o mock de
   demonstração (senha `casaloba123`) também funciona; no build de
   produção o mock é eliminado da interface.
   A área de membros lê os conteúdos do CMS com o **token de membro**
   (`src/lib/membrosCms.ts`); o Wix recusa anônimos (`WDE0027`), e o
   conteúdo nunca entra no bundle publicado.
4. **Plano do membro** — o plano real virá do Wix Pricing Plans (tarefa
   separada). Até lá, membro real entra como **loba** (acesso mínimo);
   as contas demo mantêm os três níveis.
5. **Sair** — `auth.sair()` limpa a sessão local (Wix e mock).

## App OAuth no Wix (feito)

- O site **Casa Loba | Headless** tem o cliente headless (tela *Headless
  Settings → Clientes headless* do dashboard) — é o `PUBLIC_WIX_CLIENT_ID`
  do `.env` (e está no CI, pois client ID é público).
- As **redirect URIs já estão cadastradas** no app:
  `http://localhost:4321/api/auth/callback` e
  `https://headless-urlsttluzfw-arthursoares1234-1410.wix-site-host.com/api/auth/callback`
  (mais as variantes `logout-callback` e preview). Nada a fazer no
  dashboard para o login funcionar.
- OAuth do Wix Headless **não usa secret**.

## Verificado

- `POST /oauth2/token` com o client ID de produção → `200`.
- `generateOAuthData` + `getAuthUrl` (mesmo código do site) → URL de
  autorização válida (host do Wix, PKCE, `responseMode=query`).
- Build inclui `dist/client/api/auth/callback` e os botões **Entrar**
  nas duas portas. `npm run check` limpo; build estático e SSR passam.

**Ainda não verificado (depende do seu teste no ar):** o caminho completo
em produção — o callback só existe após o push para `main` (deploy).
**Risco conhecido:** o host estático pode servir o arquivo sem extensão
com Content-Type inadequado (o navegador baixa em vez de renderizar). Se
acontecer, o retorno do login quebra — aí vale o SSR (abaixo) ou esconder
o botão até lá.

## Opção SSR (implementado e testado, não ativo)

Para que a proteção `/membros*` aconteça **no servidor** (e o botão de
login nem precise de PKCE manual), o site precisa rodar num servidor
Node. O código está pronto e testado localmente:

- Rotas `/api/auth/{login,callback,logout}` (`src/pages/api/auth/`),
  cookies HttpOnly, `src/lib/session.ts`.
- Middleware (`src/middleware.ts`): fora de `/membros*` e `/admin*` passa
  direto; sem sessão → `302 /entrar.html?redirect=…`; token expirado →
  renova via refresh token; falhou → apaga cookies e redireciona.
- Ativar com `ASTRO_OUTPUT=server npm run build` e servir
  `dist/server/entry.mjs`. Evidências locais em 04/11/2026: todos os
  redirecionamentos e a renovação de sessão responderam como esperado.

## Arquivos

- Client-side: `src/lib/auth/{iniciarLoginWix,wixSession,wixAuth,index}.ts`,
  `src/lib/membrosCms.ts`, `public/api/auth/callback`,
  `src/pages/entrar.astro`, `src/components/ModalLogin.astro`
- SSR (não ativo): `src/pages/api/auth/*`, `src/lib/session.ts`,
  `src/middleware.ts`, `src/env.d.ts`
- `src/lib/cms.ts` — leitura do CMS (ver `docs/CMS.md`)
