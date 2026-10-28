export const planosMembros = [
  {
    id: "loba",
    nome: "Loba",
    nivel: 1,
    beneficios: ["Boas-vindas à comunidade", "Conteúdos para começar"],
  },
  {
    id: "matilha",
    nome: "Matilha",
    nivel: 2,
    beneficios: ["Tudo do plano Loba", "Rodas e encontros exclusivos"],
  },
  {
    id: "alcateia",
    nome: "Alcateia",
    nivel: 3,
    beneficios: ["Tudo do plano Matilha", "Biblioteca completa e materiais especiais"],
  },
] as const;

export const conteudosMembros = [
  {
    slug: "boas-vindas",
    titulo: "Boas-vindas à Casa",
    categoria: "Comece por aqui",
    resumo: "Conheça a comunidade e encontre seu lugar na matilha.",
    plano: "loba",
    conteudo:
      "Este é o seu espaço para chegar com calma, conhecer a Casa Loba e descobrir as possibilidades da comunidade.",
  },
  {
    slug: "rede-de-apoio",
    titulo: "Construindo sua rede de apoio",
    categoria: "Cuidado e comunidade",
    resumo: "Ideias práticas para fortalecer sua rede no dia a dia.",
    plano: "loba",
    conteudo:
      "Uma rede de apoio começa com conversas possíveis, pedidos claros e acordos que respeitam o momento de cada pessoa.",
  },
  {
    slug: "rodas-de-conversa",
    titulo: "Rodas de conversa",
    categoria: "Encontros",
    resumo: "Um espaço seguro para trocar experiências com outras mães.",
    plano: "matilha",
    conteudo:
      "As rodas de conversa são encontros para escutar, compartilhar experiências e construir apoio em comunidade.",
  },
  {
    slug: "encontros",
    titulo: "Agenda de encontros",
    categoria: "Encontros",
    resumo: "Veja os encontros e atividades reservados para a comunidade.",
    plano: "matilha",
    conteudo:
      "A programação de encontros será atualizada por aqui. Enquanto isso, este espaço reúne as informações da comunidade.",
  },
  {
    slug: "biblioteca",
    titulo: "Biblioteca da matilha",
    categoria: "Materiais",
    resumo: "Guias e materiais para apoiar seus próximos passos.",
    plano: "alcateia",
    conteudo:
      "A biblioteca reúne materiais de apoio, guias e referências para você consultar no seu ritmo.",
  },
  {
    slug: "materiais-especiais",
    titulo: "Materiais especiais",
    categoria: "Materiais",
    resumo: "Conteúdos aprofundados disponíveis no plano Alcateia.",
    plano: "alcateia",
    conteudo:
      "Este espaço é dedicado a materiais aprofundados e conteúdos especiais da Casa Loba.",
  },
] as const;

export type PlanoMembroId = (typeof planosMembros)[number]["id"];

export function obterPlanoMembro(nome: string) {
  return planosMembros.find((plano) => plano.id === nome.toLowerCase());
}

export function temAcessoAoConteudo(planoAtual: string, planoNecessario: string) {
  const nivelAtual = obterPlanoMembro(planoAtual)?.nivel;
  const nivelNecessario = obterPlanoMembro(planoNecessario)?.nivel;

  return nivelAtual !== undefined && nivelNecessario !== undefined && nivelAtual >= nivelNecessario;
}
