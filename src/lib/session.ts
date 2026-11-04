/**
 * Sessão do membro no site (cookie HttpOnly).
 *
 * Os tokens do Wix (access + refresh) ficam num cookie HttpOnly — nunca em
 * localStorage — para que não sejam legíveis por JavaScript (XSS). O refresh
 * token dura ~2 semanas; o access token expira em minutos e é renovado pelo
 * middleware (src/middleware.ts) quando necessário.
 *
 * O cookie `casaloba_oauth` é de curta duração (10 min) e guarda o estado do
 * fluxo OAuth entre /api/auth/login e /api/auth/callback.
 */
import type { AstroCookies } from "astro";

export const COOKIE_SESSAO = "casaloba_session";
export const COOKIE_OAUTH = "casaloba_oauth";

export interface TokensWix {
  accessToken: { value: string; expiresAt: number };
  refreshToken: { value: string; role: string };
}

function opcoesCookie(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: import.meta.env.PROD,
    path: "/",
    maxAge,
  };
}

export function lerSessao(cookies: AstroCookies): TokensWix | null {
  const bruto = cookies.get(COOKIE_SESSAO)?.value;
  if (!bruto) return null;
  try {
    const tokens = JSON.parse(bruto) as TokensWix;
    if (!tokens?.accessToken?.value || !tokens?.refreshToken?.value) {
      return null;
    }
    return tokens;
  } catch {
    return null;
  }
}

export function salvarSessao(cookies: AstroCookies, tokens: TokensWix): void {
  cookies.set(COOKIE_SESSAO, JSON.stringify(tokens), opcoesCookie(60 * 60 * 24 * 14));
}

export function apagarSessao(cookies: AstroCookies): void {
  cookies.delete(COOKIE_SESSAO, { path: "/" });
  cookies.delete(COOKIE_OAUTH, { path: "/" });
}

export function salvarEstadoOauth(
  cookies: AstroCookies,
  estado: unknown,
): void {
  cookies.set(COOKIE_OAUTH, JSON.stringify(estado), opcoesCookie(60 * 10));
}

export function lerEstadoOauth<T>(cookies: AstroCookies): T | null {
  const bruto = cookies.get(COOKIE_OAUTH)?.value;
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as T;
  } catch {
    return null;
  }
}

export function acessoExpirado(tokens: TokensWix, margemSegundos = 60): boolean {
  const bruto = Number(tokens.accessToken?.expiresAt ?? 0);
  // Wix pode devolver segundos ou milissegundos — normaliza pelo tamanho.
  const segundos = bruto > 1e12 ? bruto / 1000 : bruto;
  return segundos - margemSegundos < Date.now() / 1000;
}

/** Destino pós-login seguro: só caminhos internos absolutos. */
export function destinoSeguro(valor: string | null, padrao = "/membros.html"): string {
  if (valor && valor.startsWith("/") && !valor.startsWith("//")) return valor;
  return padrao;
}
