/**
 * Leitura dos conteúdos da área de membros no NAVEGADOR, com o token do
 * membro (sessão Wix). O Wix recusa leitores anônimos com WDE0027, então
 * o conteúdo só existe depois do login — nunca no bundle estático.
 *
 * Como o site é estático, a lista de slugs fica fixa em SLUGS_CONTEUDOS
 * (os conteúdos atuais são placeholder; conteúdo novo exige deploy).
 */
import { createClient, OAuthStrategy } from "@wix/sdk";
import { items } from "@wix/data";
import { sessaoValida } from "./auth/wixSession";
import type { TokensWix } from "./auth/wixSession";

/** Slugs dos conteúdos publicados — precisa bater com as coleções do CMS. */
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
  plano: "loba" | "matilha" | "alcateia";
  video_url?: string;
  conteudo: string;
  ordem: number;
  publicado: boolean;
}

function clienteMembro(tokens: TokensWix) {
  return createClient({
    modules: { items },
    auth: OAuthStrategy({
      clientId: import.meta.env.PUBLIC_WIX_CLIENT_ID,
      tokens: tokens as never,
    }),
  });
}

/** Conteúdos publicados; [] se não houver sessão de membro ou der erro. */
export async function obterConteudosMembro(): Promise<ConteudoMembro[]> {
  const tokens = await sessaoValida();
  if (!tokens) return [];
  const client = clienteMembro(tokens);
  const resposta = await client.items.query("conteudos").limit(50).find();
  const linhas =
    (resposta as unknown as { items?: Array<{ data?: ConteudoMembro }> }).items ??
    [];
  return linhas
    .map((item) => item.data)
    .filter(
      (d): d is ConteudoMembro =>
        !!d && typeof d.slug === "string" && d.publicado !== false,
    )
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
}

/** Um conteúdo pelo slug; null quando não existe ou sem sessão. */
export async function obterConteudoMembro(
  slug: string,
): Promise<ConteudoMembro | null> {
  const todos = await obterConteudosMembro();
  return todos.find((conteudo) => conteudo.slug === slug) ?? null;
}
