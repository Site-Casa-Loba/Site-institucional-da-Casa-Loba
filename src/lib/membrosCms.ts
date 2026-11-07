/**
 * Leitura dos conteúdos da área de membros NO NAVEGADOR, com o token do
 * membro (sessão Wix). O Wix recusa leitores anônimos com WDE0027, então
 * o conteúdo só existe depois do login, nunca no bundle estático.
 *
 * Como o site é estático, a lista de slugs fica fixa em SLUGS_CONTEUDOS
 * (os conteúdos atuais são placeholder; conteúdo novo exige deploy) e
 * precisa bater com os slugs da coleção `conteudos` do CMS.
 */
import { items } from "@wix/data";
import {
  criarClienteMembro,
  guardarTokensRenovados,
  sessaoValida,
  type TokensWix,
} from "./auth/wixSession";
import type { PlanoPagoId } from "./planos";

/** Slugs dos conteúdos publicados; precisa bater com os do CMS. */
export const SLUGS_CONTEUDOS = [
  "boas-vindas",
  "rede-de-apoio",
  "rodas-de-conversa",
  "encontros",
  "biblioteca",
  "materiais-especiais",
] as const;

export interface ConteudoMembro {
  slug: string;
  titulo: string;
  categoria: string;
  resumo: string;
  plano: PlanoPagoId;
  video_url?: string;
  conteudo: string;
  ordem: number;
  publicado: boolean;
}

function comoConteudo(dado: unknown): ConteudoMembro | null {
  const conteudo = dado as ConteudoMembro | undefined;
  if (!conteudo || typeof conteudo.slug !== "string" || conteudo.publicado === false) {
    return null;
  }
  return conteudo;
}

async function buscar(
  tokens: TokensWix,
  slug?: string,
): Promise<ConteudoMembro[]> {
  const client = criarClienteMembro(tokens, { items });
  const base = client.items.query("conteudos");
  const query = slug ? base.eq("slug", slug) : base;
  const resposta = await query.limit(50).find();
  guardarTokensRenovados(client, tokens);
  const linhas =
    (resposta as unknown as { items?: Array<{ data?: unknown }> }).items ?? [];
  return linhas
    .map((item) => comoConteudo(item.data))
    .filter((conteudo): conteudo is ConteudoMembro => conteudo !== null)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
}

/** Conteúdos publicados; [] se não houver sessão de membro. */
export async function obterConteudosMembro(): Promise<ConteudoMembro[]> {
  const tokens = await sessaoValida();
  if (!tokens) return [];
  return buscar(tokens);
}

/** Um conteúdo pelo slug; null quando não existe ou sem sessão. */
export async function obterConteudoMembro(
  slug: string,
): Promise<ConteudoMembro | null> {
  const tokens = await sessaoValida();
  if (!tokens) return null;
  const [conteudo] = await buscar(tokens, slug);
  return conteudo ?? null;
}
