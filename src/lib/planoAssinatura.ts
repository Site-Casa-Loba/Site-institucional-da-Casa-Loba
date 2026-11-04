/**
 * Helper reutilizável de plano do membro (task "Implementar verificação de
 * plano no Astro").
 *
 * Fonte da verdade pretendida: Wix Pricing Plans (assinatura ativa do
 * membro, lida com o token de membro). Enquanto os planos não forem
 * configurados no Wix, nenhuma assinatura existe e tudo cai no plano
 * mínimo "loba" — comportamento seguro e documentado.
 *
 * O gate de nível reutiliza `temAcessoAoConteudo` de `src/lib/membros.ts`
 * (loba < matilha < alcateia), aplicado sobre o campo `plano` mínimo dos
 * conteúdos do CMS.
 */
import { createClient, OAuthStrategy } from "@wix/sdk";
import { planSubscriptions } from "@wix/pricing-plans";
import { sessaoValida } from "./auth/wixSession";
import type { TokensWix } from "./auth/wixSession";
import { obterPlanoMembro, type PlanoMembroId } from "./membros";

/**
 * Normaliza um nome/ID de plano do Wix para o catálogo da Casa Loba.
 * "Loba" → "loba", "Matilha" → "matilha", "Alcateia"/"alcateia" → "alcateia".
 * Nome desconhecido → null (nunca vira plano por chute).
 */
export function normalizaNomePlano(valor: unknown): PlanoMembroId | null {
  if (typeof valor !== "string") return null;
  const normalizado = valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
  if (normalizado === "loba" || normalizado === "matilha") {
    return normalizado as PlanoMembroId;
  }
  if (normalizado === "alcateia" || normalizado === "alcatéia") {
    return "alcateia";
  }
  return null;
}

export interface AssinaturaAtiva {
  /** Nome/ID do plano no Wix, se informado */
  plano?: string;
  /** Status da assinatura (ex.: ACTIVE, PAUSED, CANCELED) */
  status?: string;
  /** Data de expiração ISO, se houver */
  expiraEm?: string | null;
}

const STATUS_ATIVOS = new Set(["ACTIVE", "STARTED", "TRIALING", "ONGOING"]);

/**
 * Escolhe o plano de maior nível entre assinaturas ativas e não expiradas.
 * Puro e testável: nenhuma chamada de rede aqui.
 */
export function escolherPlano(
  assinaturas: AssinaturaAtiva[],
): PlanoMembroId | null {
  const agora = Date.now();
  const ativas = assinaturas.filter((a) => {
    const status = (a.status ?? "").toUpperCase();
    if (status && !STATUS_ATIVOS.has(status)) return false;
    if (a.expiraEm && Date.parse(a.expiraEm) < agora) return false;
    return true;
  });
  let melhor: PlanoMembroId | null = null;
  let melhorNivel = 0;
  for (const a of ativas) {
    const plano = normalizaNomePlano(a.plano);
    if (!plano) continue;
    const nivel = obterPlanoMembro(plano)?.nivel ?? 0;
    if (nivel > melhorNivel) {
      melhor = plano;
      melhorNivel = nivel;
    }
  }
  return melhor;
}

function clienteCom(tokens: TokensWix) {
  return createClient({
    modules: { planSubscriptions },
    auth: OAuthStrategy({
      clientId: import.meta.env.PUBLIC_WIX_CLIENT_ID,
      tokens: tokens as never,
    }),
  });
}

/**
 * Lê as assinaturas do membro no Wix Pricing Plans com o token dele.
 * Qualquer erro (app não instalado, sem escopo, rede) retorna [] —
 * nunca lança. Isso mantém a experiência de membros com plano mínimo
 * funcionando mesmo sem planos configurados.
 */
export async function obterAssinaturasMembro(
  tokens: TokensWix,
): Promise<AssinaturaAtiva[]> {
  try {
    const client = clienteCom(tokens);
    // Query builder (sem argumentos): assinaturas visíveis ao membro.
    const resultado = (await client.planSubscriptions
      .queryPlanSubscriptions()
      .limit(50)
      .find()) as unknown as {
      planSubscriptions?: Array<{
        status?: string;
        plan?: { name?: string; id?: string };
        planId?: string;
        currentPeriodEndDate?: string;
        endDate?: string;
      }>;
      subscriptions?: Array<Record<string, unknown>>;
    };
    const lista =
      resultado?.planSubscriptions ?? resultado?.subscriptions ?? [];
    return lista.map((s) => {
      const plano = (s as Record<string, unknown>)?.plan as
        | { name?: string; id?: string }
        | undefined;
      return {
        plano: plano?.name ?? plano?.id ?? (s as Record<string, unknown>)?.planId as string,
        status: s?.status,
        expiraEm: s?.currentPeriodEndDate ?? s?.endDate ?? null,
      };
    });
  } catch (erro) {
    console.warn("[plano] não foi possível ler assinaturas do Wix:", erro);
    return [];
  }
}

/**
 * Plano efetivo do membro logado: assinatura ativa de maior nível, ou
 * "loba" (mínimo) quando não há assinatura legível.
 */
export async function planoDoMembro(): Promise<PlanoMembroId> {
  const tokens = await sessaoValida();
  if (!tokens) return "loba";
  const assinaturas = await obterAssinaturasMembro(tokens);
  return escolherPlano(assinaturas) ?? "loba";
}
