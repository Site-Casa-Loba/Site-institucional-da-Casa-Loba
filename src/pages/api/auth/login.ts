/**
 * GET /api/auth/login?redirect=/membros.html
 *
 * Inicia o fluxo OAuth com a página de login do Wix: gera o estado + PKCE,
 * guarda no cookie HttpOnly `casaloba_oauth` (10 min) e redireciona o
 * navegador para a URL de autorização do Wix. O retorno acontece em
 * /api/auth/callback.
 *
 * A URI de retorno (/api/auth/callback) precisa estar cadastrada como
 * redirect URI permitida no app headless (Headless Settings → Clientes
 * headless) — ver docs/AUTH.md.
 */
import type { APIRoute } from "astro";
import { createClient, OAuthStrategy } from "@wix/sdk";
import { salvarEstadoOauth, destinoSeguro } from "../../../lib/session";

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const clientId = import.meta.env.PUBLIC_WIX_CLIENT_ID;
  if (!clientId) {
    return new Response("PUBLIC_WIX_CLIENT_ID não configurado.", {
      status: 500,
    });
  }
  const retorno = destinoSeguro(url.searchParams.get("redirect"));
  const redirectUri = new URL("/api/auth/callback", url.origin).toString();

  const client = createClient({ auth: OAuthStrategy({ clientId }) });
  const oauthData = client.auth.generateOAuthData(redirectUri, retorno);
  const { authUrl } = await client.auth.getAuthUrl(oauthData, {
    responseMode: "query",
  });

  salvarEstadoOauth(cookies, { oauthData, retorno });
  return redirect(authUrl, 302);
};
