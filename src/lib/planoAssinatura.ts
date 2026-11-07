/**
 * Plano efetivo do membro, lido do Wix Pricing Plans com o token dele.
 *
 * Fonte da verdade: assinatura ativa. Enquanto os planos não existirem no
 * Wix, nenhuma assinatura é lida e tudo cai no PLANO_MINIMO,
 * comportamento seguro e documentado. O gate de nível fica em
 * `src/lib/planos.ts` (temAcessoAoConteudo), aplicado sobre o campo
 * `plano` mínimo dos conteúdos do CMS.
 */
import { planSubscriptions } from "@wix/pricing-plans";
import { criarClienteMembro, guardarTokensRenovados, type TokensWix } from "./auth/wixSession";
import {
  normalizaNomePlanoWix,
  obterPlano,
  PLANO_MINIMO,
  type PlanoPagoId,
} from "./planos";

export interface AssinaturaWix {
  /** Nome/ID do plano no Wix, se informado */
  plano?: string;
  /** Status da assinatura (ex.: ACTIVE, PAUSED, CANCELED) */
  status?: string;
  /** Data de expiração ISO, se houver */
  expiraEm?: string | null;
}

/** Status do Wix que liberam o plano. */
const STATUS_ATIVOS = new Set(["ACTIVE", "STARTED", "TRIALING", "ONGOING"]);

/** Assinatura paga e não vencida, a regra que dá acesso ao plano. */
function assinaturaVigente(
  assinatura: AssinaturaWix,
  agora = Date.now(),
): boolean {
  const status = (assinatura.status ?? "").toUpperCase();
  if (status && !STATUS_ATIVOS.has(status)) return false;
  return !assinatura.expiraEm || Date.parse(assinatura.expiraEm) >= agora;
}

/**
 * Escolhe o plano de maior nível entre assinaturas vigentes.
 * Puro: nenhuma chamada de rede aqui.
 */
function escolherPlano(
  assinaturas: AssinaturaWix[],
  agora = Date.now(),
): PlanoPagoId | null {
  let melhor: PlanoPagoId | null = null;
  let melhorNivel = 0;
  for (const assinatura of assinaturas) {
    if (!assinaturaVigente(assinatura, agora)) continue;
    const plano = normalizaNomePlanoWix(assinatura.plano);
    if (!plano) continue;
    const nivel = obterPlano(plano)?.nivel ?? 0;
    if (nivel > melhorNivel) {
      melhor = plano;
      melhorNivel = nivel;
    }
  }
  return melhor;
}

function texto(valor: unknown): string | undefined {
  return typeof valor === "string" && valor.length > 0 ? valor : undefined;
}

/**
 * Lê as assinaturas do membro no Wix Pricing Plans com o token dele.
 * Qualquer erro (app não instalado, sem escopo, rede) retorna [] sem lançar.
 */
async function obterAssinaturasMembro(
  tokens: TokensWix,
): Promise<AssinaturaWix[]> {
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
    guardarTokensRenovados(client, tokens);
    const lista = resultado?.planSubscriptions ?? resultado?.subscriptions ?? [];
    return lista.map((s) => {
      const linha = s as {
        plan?: { name?: string; id?: string };
        planId?: unknown;
        status?: unknown;
        currentPeriodEndDate?: unknown;
        endDate?: unknown;
      };
      return {
        plano: linha.plan?.name ?? linha.plan?.id ?? texto(linha.planId),
        status: texto(linha.status),
        expiraEm: texto(linha.currentPeriodEndDate) ?? texto(linha.endDate) ?? null,
      };
    });
  } catch (erro) {
    console.warn("[plano] não foi possível ler assinaturas do Wix:", erro);
    return [];
  }
}

/**
 * Plano efetivo de quem tem os `tokens`: assinatura vigente de maior nível,
 * ou PLANO_MINIMO quando não há assinatura legível.
 */
export async function planoDoMembro(tokens: TokensWix): Promise<PlanoPagoId> {
  const assinaturas = await obterAssinaturasMembro(tokens);
  return escolherPlano(assinaturas) ?? PLANO_MINIMO;
}
