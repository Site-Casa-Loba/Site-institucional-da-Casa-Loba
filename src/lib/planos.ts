/**
 * Catálogo dos planos — fonte única no código.
 *
 * Quando os planos forem publicados, a fonte no ar é a coleção `planos`
 * do CMS (leitura pública já validada, ver docs/CMS.md); a lista abaixo é
 * o fallback do build sem CMS e a fonte de `nivel`, que o CMS não tem.
 * Débito para as sócias: preços podem mudar — aqui E na coleção `planos`.
 */
import { obterPlanosCms, type PlanoCms } from "./cms";

export type PlanoId =
  | "loba-livre"
  | "loba-essencial"
  | "loba-ativa"
  | "loba-rede";

/** Ids dos planos que podem ser assinados (Wix Pricing Plans). */
export type PlanoPagoId = Exclude<PlanoId, "loba-livre">;

// Cor do selo e do botão do plano: vira .plano__selo--<cor> e .btn--<cor>
export type CorPlano = "ameixa" | "rosa" | "azul" | "vermelho";

export interface Plano {
  id: PlanoId;
  nome: string;
  selo: string;
  cor: CorPlano;
  // Texto exibido antes de "/mês", sem formatação
  preco: string;
  beneficios: string[];
  // Plano em destaque: contorno azul (.plano--destaque)
  destaque?: boolean;
  /** Nível de acesso: 0 (Livre) a 3 (Rede); maior nível contém os menores. */
  nivel: number;
}

export const CATALOGO_PLANOS: readonly Plano[] = [
  {
    id: "loba-livre",
    nome: "Loba Livre",
    selo: "porta de entrada",
    cor: "ameixa",
    preco: "R$ 0",
    beneficios: [
      "Conteúdo aberto",
      "Newsletter",
      "Convites para os eventos",
    ],
    nivel: 0,
  },
  {
    id: "loba-essencial",
    nome: "Loba Essencial",
    selo: "para começar",
    cor: "rosa",
    preco: "R$ 19,90",
    beneficios: [
      "Participação na comunidade online Casa Loba",
      "Rodas de conversa mensais",
      "Materiais sobre carreira e maternidade",
    ],
    nivel: 1,
  },
  {
    id: "loba-ativa",
    nome: "Loba Ativa",
    selo: "para se conectar",
    cor: "azul",
    preco: "R$ 49,90",
    beneficios: [
      "Todos os benefícios do plano Loba Essencial",
      "Meia diária de cuidadoteca no mês",
      "Desconto no Sábado Loba",
    ],
    nivel: 2,
  },
  {
    id: "loba-rede",
    nome: "Loba Rede",
    selo: "para ampliar sua participação",
    cor: "vermelho",
    preco: "R$ 149,90",
    beneficios: [
      "Todos os benefícios do plano Loba Ativa",
      "Cortesia no Sábado Loba",
      "Conexões de rede",
      "Mentoria entre associadas",
    ],
    nivel: 3,
  },
];

/** O plano do catálogo pelo id (aceita maiúsculas/minúsculas variadas). */
export function obterPlano(id: string): Plano | undefined {
  const buscado = id.trim().toLowerCase();
  return CATALOGO_PLANOS.find((plano) => plano.id.toLowerCase() === buscado);
}

/** Plano mínimo conferido pela área de membros (sem assinatura legível). */
export const PLANO_MINIMO: PlanoPagoId = "loba-essencial";

export function temAcessoAoConteudo(
  planoAtual: string,
  planoNecessario: string,
): boolean {
  const nivelAtual = obterPlano(planoAtual)?.nivel;
  const nivelNecessario = obterPlano(planoNecessario)?.nivel;
  return nivelAtual !== undefined && nivelNecessario !== undefined && nivelAtual >= nivelNecessario;
}

/**
 * Normaliza um nome/ID de plano que veio do Wix (Pricing Plans) para o id
 * do catálogo: "Loba Ativa"/"Loba Ativa " → "loba-ativa".
 * Nome desconhecido → null (nunca vira plano por chute).
 */
export function normalizaNomePlanoWix(valor: unknown): PlanoPagoId | null {
  if (typeof valor !== "string") return null;
  const normalizado = valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  const plano = obterPlano(normalizado);
  if (!plano || plano.nivel === 0) return null;
  return plano.id as PlanoPagoId;
}

function planoDoCms(plano: PlanoCms): Plano {
  const doCatalogo = obterPlano(plano.slug);
  return {
    id: plano.slug as PlanoId,
    nome: plano.nome,
    selo: plano.selo,
    cor: plano.cor as CorPlano,
    preco: plano.preco_texto,
    beneficios: plano.beneficios
      .split(/\r?\n/)
      .map((beneficio) => beneficio.trim())
      .filter((beneficio) => beneficio.length > 0),
    destaque: plano.destaque,
    nivel: doCatalogo?.nivel ?? 0,
  };
}

const IDS_CONHECIDOS = new Set(CATALOGO_PLANOS.map((plano) => plano.id));

// Assíncrona para que a troca por outra fonte remota não mude quem chama.
export async function obterPlanos(): Promise<Plano[]> {
  try {
    const resultado = await obterPlanosCms();
    // Se o CMS falhar ou não retornar registros, usa o catálogo local.
    if (!resultado.ok || resultado.dados.length === 0) {
      console.warn("[planos] Usando catálogo local como fallback.");
      return CATALOGO_PLANOS.filter((plano) => plano.nivel > 0) as Plano[];
    }
    // Só planos ativos que esse código conhece; obterPlanosCms já devolve
    // ordenado por `ordem`.
    return resultado.dados
      .filter((plano) => plano.ativo && IDS_CONHECIDOS.has(plano.slug as PlanoId))
      .map(planoDoCms);
  } catch (erro) {
    console.error("[planos] Erro ao consultar CMS:", erro);
    return CATALOGO_PLANOS.filter((plano) => plano.nivel > 0) as Plano[];
  }
}
