/**
 * Contrato client-side do fluxo de login Wix. Também vale em
 * public/auth/callback.html (JS puro, sem bundler). Mudou aqui, mude lá junto;
 * `npm run check` roda check-contrato.mjs para acusar divergência.
 */

export const CHAVE_SESSAO_WIX = "casaloba_session";
export const CHAVE_OAUTH = "casaloba_oauth";
export const RETORNO_PADRAO = "/membros.html";

/**
 * Caminho do callback OAuth, igual no início do login e na troca de code
 * por tokens (o Wix exige `redirect_uri` idêntica nas duas pontas).
 * Precisa estar cadastrado, com correspondência exata, em
 * Headless Settings → Clientes headless → Redirect URIs.
 */
export const CAMINHO_CALLBACK = "/auth/callback.html";

/** URI de redirect absoluta para a origem atual (produção ou localhost). */
export function uriCallback(origem: string): string {
  return `${origem}${CAMINHO_CALLBACK}`;
}

export function destinoSeguro(valor: string | null | undefined, padrao = RETORNO_PADRAO): string {
  return valor && valor.startsWith("/") && !valor.startsWith("//") ? valor : padrao;
}
