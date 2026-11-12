import { createClient, OAuthStrategy } from "@wix/sdk";
import { CHAVE_OAUTH, RETORNO_PADRAO, destinoSeguro, uriCallback } from "./contrato";

export interface OpcoesBotaoEntrar {
  modo?: "login" | "signup";
  destino?: string;
  /** Elemento onde a mensagem de erro aparece (aria-live). */
  mensagem?: HTMLElement | null;
}

const ROTULO_CARREGANDO = { login: "Entrando…", signup: "Abrindo cadastro…" };

/**
 * Liga um botão ao fluxo de login do Wix, cuidando do estado visual e do
 * erro num só lugar (cabeçalho, página de entrar).
 */
export function ligarBotaoEntrar(
  botao: HTMLButtonElement,
  { modo = "login", destino = RETORNO_PADRAO, mensagem }: OpcoesBotaoEntrar = {},
): void {
  botao.addEventListener("click", () => {
    const rotulo = botao.textContent;
    botao.disabled = true;
    botao.textContent = ROTULO_CARREGANDO[modo];
    iniciarLoginWix(destino, modo).catch((erro) => {
      console.error(`[auth] não foi possível iniciar o ${modo === "signup" ? "cadastro" : "login"}:`, erro);
      botao.disabled = false;
      botao.textContent = rotulo;
      if (mensagem) {
        mensagem.textContent = "Não foi possível falar com a Casa Loba. Tente novamente.";
        mensagem.focus();
      }
    });
  });
}

/**
 * Login real via página hospedada do Wix (OAuth + PKCE).
 *
 * Guarda o estado do fluxo em sessionStorage (`CHAVE_OAUTH`) e redireciona
 * para a página de login do Wix (ou de registro, com `modo: "signup"`).
 * Depois de autenticar, o Wix devolve o navegador para
 * /auth/callback.html (arquivo estático em public/auth/callback.html, que
 * troca o code por tokens (ver docs/AUTH.md).
 */
export async function iniciarLoginWix(
  retorno = RETORNO_PADRAO,
  modo: "login" | "signup" = "login",
): Promise<void> {
  const clientId = import.meta.env.PUBLIC_WIX_CLIENT_ID;
  if (!clientId) throw new Error("PUBLIC_WIX_CLIENT_ID não configurado.");
  const destino = destinoSeguro(retorno);
  // O host estático do Wix reserva /api/* (nada ali responde), então o
  // callback é public/auth/callback.html. A URI exata precisa estar na lista
  // de redirect URIs do app OAuth (Headless Settings). Ver docs/AUTH.md.
  const redirectUri = uriCallback(window.location.origin);

  const client = createClient({ auth: OAuthStrategy({ clientId }) });
  const oauthData = client.auth.generateOAuthData(redirectUri, destino);
  sessionStorage.setItem(
    CHAVE_OAUTH,
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
