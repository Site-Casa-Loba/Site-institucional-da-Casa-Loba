/**
 * Plano efetivo do membro, consultado via `/api/meu-plano` (que lê a
 * coleção `assinaturas` do Wix CMS pelo e-mail da usuária autenticada).
 *
 * Qualquer falha de rede ou ausência de assinatura ativa cai com
 * segurança no `PLANO_MINIMO`.
 */
import type { TokensWix } from "./auth/wixSession";
import { obterPlano, PLANO_MINIMO, type PlanoPagoId } from "./planos";

export interface AssinaturaWix {
  plano?: string;
  status?: string;
  expiraEm?: string | null;
}

export async function planoDoMembro(tokens: TokensWix): Promise<PlanoPagoId> {
  try {
    const resposta = await fetch("/api/meu-plano", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokens }),
    });

    if (!resposta.ok) {
      return PLANO_MINIMO;
    }

    const dados = (await resposta.json()) as { plano?: string };
    const planoValido = dados?.plano ? obterPlano(dados.plano) : undefined;

    if (planoValido && planoValido.nivel > 0) {
      return planoValido.id as PlanoPagoId;
    }

    return PLANO_MINIMO;
  } catch (erro) {
    console.warn("[plano] não foi possível consultar /api/meu-plano:", erro);
    return PLANO_MINIMO;
  }
}