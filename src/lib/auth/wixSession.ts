/**
 * SESSÃO WIX NO NAVEGADOR (client-side).
 */
import { createClient, OAuthStrategy } from "@wix/sdk";

// A SHAPE DOS TOKENS e esta chave também são usadas por
// public/auth/callback.html (JS puro, sem bundler) — ao mudar um dos dois,
// mude o outro junto:
//   callback.html → chave `casaloba_session`, montagem de { accessToken, refreshToken }.
export const CHAVE_SESSAO_WIX = "casaloba_session";

export interface TokensWix {
  accessToken: { value: string; expiresAt: number };
  refreshToken: { value: string; role: string };
}

/** Módulos Wix usados em cada chamada (ex.: { members }, { items }). */
export type ModulosWix = Record<string, unknown>;

export function lerSessaoLocal(): TokensWix | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = window.localStorage.getItem(CHAVE_SESSAO_WIX);
    if (!bruto) return null;
    const tokens = JSON.parse(bruto) as TokensWix;
    if (!tokens?.accessToken?.value || !tokens?.refreshToken?.value) return null;
    return tokens;
  } catch {
    return null;
  }
}

export function salvarSessaoLocal(tokens: TokensWix): void {
  try {
    window.localStorage.setItem(CHAVE_SESSAO_WIX, JSON.stringify(tokens));
  } catch (erro) {
    console.error("Não foi possível salvar a sessão do Wix.", erro);
  }
}

export function limparSessaoLocal(): void {
  try {
    window.localStorage.removeItem(CHAVE_SESSAO_WIX);
  } catch {
    /* armazenamento indisponível */
  }
}

export function acessoExpirado(tokens: TokensWix, margemSegundos = 60): boolean {
  const bruto = Number(tokens.accessToken?.expiresAt ?? 0);
  const segundos = bruto > 1e12 ? bruto / 1000 : bruto;
  return segundos - margemSegundos < Date.now() / 1000;
}

/**
 * Devolve tokens válidos, renovando o access token com o refresh token
 * quando necessário (POST /oauth2/token, grant refresh_token).
 * Retorna null quando não há sessão ou ela é irrecuperável — o chamador
 * decide o redirect.
 */
export async function sessaoValida(): Promise<TokensWix | null> {
  const tokens = lerSessaoLocal();
  if (!tokens) return null;
  if (!acessoExpirado(tokens)) return tokens;
  try {
    const resposta = await fetch("https://www.wixapis.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: import.meta.env.PUBLIC_WIX_CLIENT_ID,
        grantType: "refresh_token",
        refreshToken: tokens.refreshToken.value,
      }),
    });
    if (!resposta.ok) {
      // 4xx = refresh token inválido/revogado → sessão morta; demais
      // erros (rede, 5xx) podem ser transitórios → mantém a sessão.
      if (resposta.status >= 400 && resposta.status < 500) {
        limparSessaoLocal();
      }
      return null;
    }
    const dados = (await resposta.json()) as {
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
    };
    if (!dados.access_token) return null;
    const renovados: TokensWix = {
      accessToken: {
        value: dados.access_token,
        expiresAt:
          Math.floor(Date.now() / 1000) + (dados.expires_in ?? 14400),
      },
      refreshToken: {
        value: dados.refresh_token ?? tokens.refreshToken.value,
        role: tokens.refreshToken.role,
      },
    };
    salvarSessaoLocal(renovados);
    return renovados;
  } catch {
    return null;
  }
}

/**
 * Cliente Wix autenticado com os tokens do membro, para leituras feitas no
 * navegador (membros assinaturas, perfil, CMS de membros). Cada chamada
 * passa só os módulos que vai usar.
 */
export function criarClienteMembro<M extends ModulosWix>(tokens: TokensWix, modules: M) {
  return createClient({
    modules,
    auth: OAuthStrategy({
      clientId: import.meta.env.PUBLIC_WIX_CLIENT_ID,
      tokens: tokens as never,
    }),
  });
}
