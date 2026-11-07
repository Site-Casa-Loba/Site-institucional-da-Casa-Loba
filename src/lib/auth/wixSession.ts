/**
 * SESSÃO WIX NO NAVEGADOR (client-side).
 */
import { createClient, OAuthStrategy } from "@wix/sdk";
import { lerJson, remover, salvarJson } from "../armazenamento";
import { CHAVE_SESSAO_WIX } from "./contrato";

export interface TokensWix {
  accessToken: { value: string; expiresAt: number };
  refreshToken: { value: string; role: string };
}

/** Módulos Wix usados em cada chamada (ex.: { members }, { items }). */
export type ModulosWix = Record<string, unknown>;

function lerSessaoLocal(): TokensWix | null {
  const tokens = lerJson<TokensWix | null>(CHAVE_SESSAO_WIX, null);
  if (!tokens?.accessToken?.value || !tokens?.refreshToken?.value) return null;
  return tokens;
}

function salvarSessaoLocal(tokens: TokensWix): void {
  try {
    salvarJson(CHAVE_SESSAO_WIX, tokens);
  } catch (erro) {
    console.error("Não foi possível salvar a sessão do Wix.", erro);
  }
}

export function limparSessaoLocal(): void {
  remover(CHAVE_SESSAO_WIX);
}

/**
 * Salva os tokens se o SDK os renovou durante uma chamada (o Wix pode
 * devolver um refresh token novo sem avisar).
 */
export function guardarTokensRenovados(
  client: { auth: { getTokens(): unknown } },
  anteriores: TokensWix,
): void {
  try {
    const atuais = client.auth.getTokens() as TokensWix | undefined;
    if (atuais?.refreshToken?.value && atuais.refreshToken.value !== anteriores.refreshToken.value) {
      salvarSessaoLocal(atuais);
    }
  } catch {
    /* sem renovação: segue com os tokens atuais */
  }
}

/** `expiresAt` chega em segundos, mas aceita ms de versões antigas do callback. */
function expiraEmSegundos(expiresAt: unknown): number {
  const bruto = Number(expiresAt ?? 0);
  return bruto > 1e12 ? Math.floor(bruto / 1000) : bruto;
}

function acessoExpirado(tokens: TokensWix, margemSegundos = 60): boolean {
  return expiraEmSegundos(tokens.accessToken?.expiresAt) - margemSegundos < Date.now() / 1000;
}

/**
 * Devolve tokens válidos, renovando o access token com o refresh token
 * quando necessário (POST /oauth2/token, grant refresh_token).
 * Retorna null quando não há sessão ou ela é irrecuperável; o chamador
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
