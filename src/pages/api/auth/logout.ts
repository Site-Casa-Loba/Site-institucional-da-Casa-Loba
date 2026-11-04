/**
 * GET /api/auth/logout
 *
 * Apaga a sessão local (cookie casaloba_session) e redireciona o navegador
 * para a URL de logout do Wix, que encerra também a sessão SSO no Wix.
 * Se o Wix não estiver alcançável, sai apenas pela porta local.
 */
import type { APIRoute } from "astro";
import { createClient, OAuthStrategy } from "@wix/sdk";
import { lerSessao, apagarSessao } from "../../../lib/session";
import type { TokensWix } from "../../../lib/session";

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const clientId = import.meta.env.PUBLIC_WIX_CLIENT_ID;
  const sessao = lerSessao(cookies);
  let destino = new URL("/entrar.html", url.origin).toString();

  if (clientId && sessao) {
    try {
      const client = createClient({
        auth: OAuthStrategy({
          clientId,
          tokens: sessao as unknown as Parameters<
            typeof OAuthStrategy
          >[0]["tokens"],
        }),
      });
      const { logoutUrl } = await client.auth.logout(destino);
      if (logoutUrl) destino = logoutUrl;
    } catch (erro) {
      // Mesmo se o Wix falhar, a sessão local é apagada.
      console.error("[auth] falha ao pedir logout ao Wix:", erro);
    }
  }

  apagarSessao(cookies);
  return redirect(destino, 302);
};
