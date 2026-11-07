/**
 * Serviço de autenticação via Wix (membro real, login na página do Wix).
 * Devolve o membro logado ou null. O plano vem de `planoAssinatura.ts`
 * (Pricing Plans, com fallback PLANO_MINIMO enquanto não há assinatura).
 */
import {
  criarClienteMembro,
  guardarTokensRenovados,
  sessaoValida,
} from "./wixSession";
import { planoDoMembro } from "../planoAssinatura";
import type { Usuaria } from "../usuaria";
import { members } from "@wix/members";

interface MembroWix {
  loginEmail?: string;
  profile?: { nickname?: string; slug?: string; photo?: { url?: string } };
  contact?: { firstName?: string };
}

export async function usuariaWix(): Promise<Usuaria | null> {
  const tokens = await sessaoValida();
  if (!tokens) return null;
  try {
    const client = criarClienteMembro(tokens, { members });
    const resposta = (await client.members.getCurrentMember({
      fieldsets: ["EXTENDED"],
    })) as unknown as { member?: MembroWix } & MembroWix;
    // O SDK pode devolver o membro direto ou aninhado em { member }.
    const membro = resposta?.member ?? resposta;
    guardarTokensRenovados(client, tokens);
    const perfil = membro?.profile ?? {};
    const contato = membro?.contact ?? {};
    return {
      nome: perfil.nickname ?? contato.firstName ?? perfil.slug ?? "Membro Casa Loba",
      email: membro?.loginEmail ?? "",
      imagem: perfil.photo?.url,
      plano: await planoDoMembro(tokens),
    };
  } catch (erro) {
    // Erro lendo o perfil (rede instável, 5xx, CORS…): NÃO apaga a sessão.
    // A pessoa continua “logada”; verá a área de membros na próxima tentativa.
    console.error("[auth] não foi possível ler o membro Wix:", erro);
    return null;
  }
}
