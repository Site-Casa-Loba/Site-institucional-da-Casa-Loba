import { createClient, OAuthStrategy } from "@wix/sdk";

/**
 * Inicia o login real via página hospedada do Wix (OAuth + PKCE).
 *
 * Guarda o estado do fluxo em sessionStorage (`casaloba_oauth`, 10 minutos
 * — a validade real é do navegador/aba) e redireciona para a página
 * de login do Wix. Depois de autenticar, o Wix devolve o navegador
 * para /api/auth/callback (arquivo estático em public/api/auth/callback,
 * que troca o code por tokens — ver docs/AUTH.md).
 *
 * Entrega no plano estático: sem servidor envolvido, funciona no site
 * publicado como está.
 */
export async function iniciarLoginWix(retorno = "/membros.html"): Promise<void> {
  const clientId = import.meta.env.PUBLIC_WIX_CLIENT_ID;
  if (!clientId) throw new Error("PUBLIC_WIX_CLIENT_ID não configurado.");
  const destino =
    retorno.startsWith("/") && !retorno.startsWith("//") ? retorno : "/membros.html";
  const redirectUri = `${window.location.origin}/api/auth/callback`;

  const client = createClient({ auth: OAuthStrategy({ clientId }) });
  const oauthData = client.auth.generateOAuthData(redirectUri, destino);
  sessionStorage.setItem(
    "casaloba_oauth",
    JSON.stringify({ oauthData, retorno: destino, iniciadoEm: Date.now() }),
  );
  const { authUrl } = await client.auth.getAuthUrl(oauthData, {
    responseMode: "query",
  });
  window.location.assign(authUrl);
}
