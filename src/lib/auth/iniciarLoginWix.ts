import { createClient, OAuthStrategy } from "@wix/sdk";

/**
 * Inicia o login real via página hospedada do Wix (OAuth + PKCE).
 *
 * Guarda o estado do fluxo em sessionStorage (`casaloba_oauth`) e
 * redireciona para a página de login do Wix (ou de registro, com
 * `modo: "signup"`). Depois de autenticar, o Wix
 * devolve o navegador para /auth/callback.html (arquivo estático em
 * public/auth/callback.html, que troca o code por tokens — ver docs/AUTH.md).
 *
 * Entrega no plano estático: sem servidor envolvido, funciona no site
 * publicado como está.
 */
export async function iniciarLoginWix(
  retorno = "/membros.html",
  modo: "login" | "signup" = "login",
): Promise<void> {
  const clientId = import.meta.env.PUBLIC_WIX_CLIENT_ID;
  if (!clientId) throw new Error("PUBLIC_WIX_CLIENT_ID não configurado.");
  const destino =
    retorno.startsWith("/") && !retorno.startsWith("//") ? retorno : "/membros.html";
  // O host estático do Wix reserva /api/* (nada ali responde), então o
  // callback é /auth/callback.html (public/auth/callback.html, copiado
  // para dist/auth/callback.html e também servido pelo astro dev). A URI
  // exata precisa estar na lista de redirect URIs do app OAuth
  // (Headless Settings) para produção e para localhost.
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
