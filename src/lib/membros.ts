export const planosMembros = [
  {
    id: "loba-essencial",
    nome: "Loba Essencial",
    nivel: 1,
    beneficios: ["Boas-vindas à comunidade", "Conteúdos para começar"],
  },
  {
    id: "loba-ativa",
    nome: "Loba Ativa",
    nivel: 2,
    beneficios: ["Tudo do plano Loba Essencial", "Rodas e encontros exclusivos"],
  },
  {
    id: "loba-rede",
    nome: "Loba Rede",
    nivel: 3,
    beneficios: ["Tudo do plano Loba Ativa", "Biblioteca completa e materiais especiais"],
  },
] as const;

// Os conteúdos (textos, vídeos) NÃO ficam neste arquivo: eles vivem na
// coleção `conteudos` do CMS e são lidos pelo navegador após o login
// (src/lib/membrosCms.ts) — o Wix só libera a leitura para membros.

export type PlanoMembroId = (typeof planosMembros)[number]["id"];

export function obterPlanoMembro(nome: string) {
  return planosMembros.find((plano) => plano.id === nome.toLowerCase());
}

export function temAcessoAoConteudo(planoAtual: string, planoNecessario: string) {
  const nivelAtual = obterPlanoMembro(planoAtual)?.nivel;
  const nivelNecessario = obterPlanoMembro(planoNecessario)?.nivel;

  return nivelAtual !== undefined && nivelNecessario !== undefined && nivelAtual >= nivelNecessario;
}
