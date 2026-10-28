/**
 * Catálogo público dos planos, mostrado na página /planos.
 *
 * PLACEHOLDER: os planos ainda não foram definidos pelas sócias (ver README).
 * Nomes, preços e benefícios abaixo são provisórios. Para trocar a fonte dos
 * dados (ex.: Pricing Plans do Wix), basta reescrever obterPlanos(): quem usa
 * o catálogo depende só do tipo Plano.
 *
 * Os ids repetem os de planosMembros (src/lib/membros.ts). Ainda não há
 * fonte única: os benefícios podem divergir até a definição das sócias.
 */

export type PlanoId = "loba" | "matilha" | "alcateia";

// Cor do selo e do botão do plano: vira .plano__selo--<cor> e .btn--<cor>
export type CorPlano = "rosa" | "azul" | "vermelho";

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
}

const planos: Plano[] = [
  {
    id: "loba",
    nome: "loba",
    selo: "para começar",
    cor: "rosa",
    preco: "[R$ 00]",
    beneficios: [
      "Participação na comunidade Casa Loba",
      "Trocas com mulheres e mães empreendedoras",
      "Informações sobre a programação da Casa",
    ],
  },
  {
    id: "matilha",
    nome: "matilha",
    selo: "para se conectar",
    cor: "azul",
    preco: "[R$ 00]",
    beneficios: [
      "Todos os benefícios do plano loba",
      "Acesso ao mural de conexões profissionais",
      "Acesso a uma seleção de cursos gravados",
      "Espaço para apresentar seu negócio à comunidade",
    ],
    destaque: true,
  },
  {
    id: "alcateia",
    nome: "alcateia",
    selo: "para ampliar sua participação",
    cor: "vermelho",
    preco: "[R$ 00]",
    beneficios: [
      "Todos os benefícios do plano matilha",
      "Acesso ampliado aos cursos gravados",
      "Participação em encontros exclusivos",
      "Condições especiais em iniciativas parceiras",
    ],
  },
];

// Assíncrona para que a troca por uma fonte remota não mude quem chama
export async function obterPlanos(): Promise<Plano[]> {
  return planos;
}
