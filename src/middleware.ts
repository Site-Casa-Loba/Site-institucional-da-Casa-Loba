/**
 * Proteção de rotas por sessão (server-side).
 *
 * Roda em TODA navegação quando o site está em SSR (ASTRO_OUTPUT=server).
 * Em build estático (o padrão hoje) os arquivos são gerados de uma vez e
 * não há requisição a interceptar — a proteção efetiva no site publicado
 * depende do deploy SSR (ver docs/AUTH.md). Enquanto o mock local continuar,
 * a guarda client-side de src/lib/auth segue existindo.
 *
 * O middleware:
 *  1. Deixa passar tudo que não é /membros* ou /admin*.
 *  2. Exige sessão (cookie casaloba_session); senão redireciona para
 *     /entrar.html?redirect=<caminho original>.
 *  3. Se o access token expirou, tenta renovar com o refresh token.
 *     Falhando, apaga a sessão e redireciona para o login.
 */
import { defineMiddleware } from "astro:middleware";
import { createClient, OAuthStrategy } from "@wix/sdk";
import {
  lerSessao,
  salvarSessao,
  apagarSessao,
  acessoExpirado,
} from "./lib/session";
import type { TokensWix } from "./lib/session";

const PREFIXOS_PROTEGIDOS = ["/membros", "/admin"];

export const onRequest = defineMiddleware(async (context, next) => {
  const caminho = context.url.pathname;
  const protegida = PREFIXOS_PROTEGIDOS.some(
    (prefixo) =>
      caminho === prefixo ||
      caminho === `${prefixo}.html` ||
      caminho.startsWith(`${prefixo}/`),
  );
  if (!protegida) return next();

  const destinoLogin = () =>
    context.redirect(
      `/entrar.html?redirect=${encodeURIComponent(caminho + context.url.search)}`,
      302,
    );

  const clientId = import.meta.env.PUBLIC_WIX_CLIENT_ID;
  const sessao = lerSessao(context.cookies);
  if (!clientId || !sessao) return destinoLogin();

  if (!acessoExpirado(sessao)) {
    context.locals.membro = true;
    return next();
  }

  try {
    const client = createClient({ auth: OAuthStrategy({ clientId }) });
    const tokens = (await client.auth.renewToken(
      sessao.refreshToken as unknown as Parameters<
        ReturnType<typeof createClient>["auth"]["renewToken"]
      >[0],
    )) as unknown as TokensWix;
    salvarSessao(context.cookies, tokens);
    context.locals.membro = true;
    return next();
  } catch (erro) {
    console.error("[middleware] refresh token rejeitado:", erro);
    apagarSessao(context.cookies);
    return destinoLogin();
  }
});
