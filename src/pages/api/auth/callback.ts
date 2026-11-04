/**
 * GET /api/auth/callback?code=...&state=...
 *
 * Destino do redirect do Wix após o login. Verifica o `state` contra o
 * cookie `casaloba_oauth`, troca o `code` por tokens de membro
 * (access + refresh), guarda a sessão no cookie HttpOnly `casaloba_session`
 * e redireciona para o destino original (ou /membros.html).
 */
import type { APIRoute } from "astro";
import { createClient, OAuthStrategy } from "@wix/sdk";
import {
  lerEstadoOauth,
  salvarSessao,
  destinoSeguro,
  COOKIE_OAUTH,
} from "../../../lib/session";
import type { TokensWix } from "../../../lib/session";

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const falha = (motivo: string) =>
    redirect(`/entrar.html?erro=${encodeURIComponent(motivo)}`, 302);

  const erroOauth = url.searchParams.get("error");
  if (erroOauth) {
    return falha(url.searchParams.get("error_description") ?? erroOauth);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const salvo = lerEstadoOauth<{
    oauthData: Parameters<
      ReturnType<typeof createClient>["auth"]["getMemberTokens"]
    >[2];
    retorno: string;
  }>(cookies);

  if (!code || !state || !salvo?.oauthData) {
    return falha("sessao-oauth-ausente");
  }
  if (salvo.oauthData.state !== state) {
    return falha("state-invalido");
  }

  const clientId = import.meta.env.PUBLIC_WIX_CLIENT_ID;
  if (!clientId) {
    return falha("client-id-ausente");
  }

  const client = createClient({ auth: OAuthStrategy({ clientId }) });
  try {
    const tokens = (await client.auth.getMemberTokens(
      code,
      state,
      salvo.oauthData,
    )) as unknown as TokensWix;
    salvarSessao(cookies, tokens);
    cookies.delete(COOKIE_OAUTH, { path: "/" });
    return redirect(destinoSeguro(salvo.retorno), 302);
  } catch (erro) {
    console.error("[auth] falha na troca do code por tokens:", erro);
    return falha("troca-code-falhou");
  }
};
