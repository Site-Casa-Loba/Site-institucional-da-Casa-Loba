/**
 * Plano efetivo do membro, lido do Wix Pricing Plans com o token dele.
 *
 * Fonte da verdade: assinatura ativa. Enquanto os planos não existirem no
 * Wix, nenhuma assinatura é lida e tudo cai no PLANO_MINIMO —
 * comportamento seguro e documentado. O gate de nível fica em
 * `src/lib/planos.ts` (temAcessoAoConteudo), aplicado sobre o campo
 * `plano` mínimo dos conteúdos do CMS.
 */
import { planSubscriptions } from "@wix/pricing-plans";
import {
  criarClienteMembro,
  sessaoValida,
  type TokensWix,
} from "./auth/wixSession";
import {
  normalizaNomePlanoWix,
  obterPlano,
  PLANO_MINIMO,
  type PlanoPagoId,
} from "./planos";

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
 * Puro: nenhuma chamada de rede aqui.
 */
export function escolherPlano(
  assinaturas: AssinaturaAtiva[],
): PlanoPagoId | null {
  const agora = Date.now();
  const ativas = assinaturas.filter((a) => {
    const status = (a.status ?? "").toUpperCase();
    if (status && !STATUS_ATIVOS.has(status)) return false;
    if (a.expiraEm && Date.parse(a.expiraEm) < agora) return false;
    return true;
  });
  let melhor: PlanoPagoId | null = null;
  let melhorNivel = 0;
  for (const a of ativas) {
    const plano = normalizaNomePlanoWix(a.plano);
    if (!plano) continue;
    const nivel = obterPlano(plano)?.nivel ?? 0;
    if (nivel > melhorNivel) {
      melhor = plano;
      melhorNivel = nivel;
    }
  }
  return melhor;
}

/**
 * Lê as assinaturas do membro no Wix Pricing Plans com o token dele.
 * Qualquer erro (app não instalado, sem escopo, rede) retorna [] —
 * nunca lança.
 */
export async function obterAssinaturasMembro(
  tokens: TokensWix,
): Promise<AssinaturaAtiva[]> {
  try {
    const client = criarClienteMembro(tokens, { planSubscriptions });
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
        plano:
          plano?.name ?? plano?.id ?? (s as Record<string, unknown>)?.planId,
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
 * PLANO_MINIMO quando não há assinatura legível.
 */
export async function planoDoMembro(): Promise<PlanoPagoId> {
  const tokens = await sessaoValida();
  if (!tokens) return PLANO_MINIMO;
  const assinaturas = await obterAssinaturasMembro(tokens);
  return escolherPlano(assinaturas) ?? PLANO_MINIMO;
}
