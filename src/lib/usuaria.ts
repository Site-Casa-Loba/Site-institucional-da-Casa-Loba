import type { PlanoPagoId } from "./planos";

export interface Usuaria {
  nome: string;
  imagem?: string;
  email: string;
  plano: PlanoPagoId;
}
