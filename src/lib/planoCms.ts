/**
 * Coleção `planos` do CMS (ver docs/CMS.md). O `slug` precisa bater com os
 * ids de `src/lib/planos.ts`; o `nivel` (que o CMS não tem) vem do catálogo.
 */
import { consultarColecao, type ResultadoCms } from "./cms";

export interface PlanoCms {
  _id?: string;
  slug: string;
  nome: string;
  selo: string;
  cor: string;
  preco_texto: string;
  beneficios: string;
  ordem: number;
  destaque: boolean;
  ativo: boolean;
}

export function obterPlanosCms(): Promise<ResultadoCms<PlanoCms>> {
  return consultarColecao<PlanoCms>("planos", { ordenarPor: "ordem" });
}
