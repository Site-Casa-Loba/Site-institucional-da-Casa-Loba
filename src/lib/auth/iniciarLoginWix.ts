import { createClient, OAuthStrategy } from "@wix/sdk";

/**
 * Login real via página hospedada do Wix (OAuth + PKCE).
 *
 * Guarda o estado do fluxo em sessionStorage (`casaloba_oauth`) e
 * redireciona para a página de login do Wix (ou de registro, com
 * `modo: "signup"`). Depois de autenticar, o Wix devolve o navegador
 * para /auth/callback.html (arquivo estático em public/auth/callback.html,
 * que troca o code por tokens — ver docs/AUTH.md).
 */

export const RETORNO_PADRAO = "/membros.html";

// A validação + RETORNO_PADRAO também valem em public/auth/callback.html
// (JS puro, sem bundler) — mudou aqui, mude lá junto.
export function destinoSeguro(valor: string | null | undefined, padrao = RETORNO_PADRAO): string {
  return valor && valor.startsWith("/") && !valor.startsWith("//") ? valor : padrao;
}

export async function iniciarLoginWix(
  retorno = RETORNO_PADRAO,
  modo: "login" | "signup" = "login",
): Promise<void> {
  const clientId = import.meta.env.PUBLIC_WIX_CLIENT_ID;
  if (!clientId) throw new Error("PUBLIC_WIX_CLIENT_ID não configurado.");
  const destino = destinoSeguro(retorno);
  // O host estático do Wix reserva /api/* (nada ali responde), então o
  // callback é /auth/callback.html. A URI exata precisa estar na lista de
  // redirect URIs do app OAuth (Headless Settings) — ver docs/AUTH.md.
  const redirectUri = `${window.location.origin}/auth/callback.html`;

  const client = createClient({ auth: OAuthStrategy({ clientId }) });
  const oauthData = client.auth.generateOAuthData(redirectUri, destino);
  sessionStorage.setItem(
    "casaloba_oauth",
    JSON.stringify({ oauthData, retorno: destino, iniciadoEm: Date.now() }),
  );
  const { authUrl } = await client.auth.getAuthUrl(oauthData, {
    responseMode: "query",
  });
  // Registro: pede ao Wix para abrir direto na tela de cadastro. Se o Wix
  // ignorar o parâmetro, cai na tela de login (que oferece cadastro).
  const url =
    modo === "signup"
      ? `${authUrl}${authUrl.includes("?") ? "&" : "?"}mode=signup`
      : authUrl;
  window.location.assign(url);
}
