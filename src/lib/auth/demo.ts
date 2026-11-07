/**
 * Contas de demonstração (DEV apenas). Não entram no bundle de produção:
 * a fachada de auth só devolve o mock quando `import.meta.env.DEV`.
 */
import type { PlanoPagoId } from "../planos";

export interface ContaDemo {
  nome: string;
  email: string;
  plano: PlanoPagoId;
}

export const CONTAS_DEMO: readonly ContaDemo[] = [
  { nome: "Loba Essencial", email: "lobaessencial@teste.com", plano: "loba-essencial" },
  { nome: "Loba Ativa", email: "lobaativa@teste.com", plano: "loba-ativa" },
  { nome: "Loba Rede", email: "lobarede@teste.com", plano: "loba-rede" },
];
