/**
 * Contrato client-side do fluxo de login Wix. Também vale em
 * public/auth/callback.html (JS puro, sem bundler). Mudou aqui, mude lá junto;
 * `npm run check` roda check-contrato.mjs para acusar divergência.
 */

export const CHAVE_SESSAO_WIX = "casaloba_session";
export const CHAVE_OAUTH = "casaloba_oauth";
export const RETORNO_PADRAO = "/membros.html";

export function destinoSeguro(valor: string | null | undefined, padrao = RETORNO_PADRAO): string {
  return valor && valor.startsWith("/") && !valor.startsWith("//") ? valor : padrao;
}
