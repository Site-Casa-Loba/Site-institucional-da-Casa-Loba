/**
 * Serviço de autenticação via Wix (membro real, login na página do Wix).
 * Devolve o membro logado ou null. O plano vem de `planoAssinatura.ts`
 * (Pricing Plans, com fallback PLANO_MINIMO enquanto não há assinatura).
 * Edição de perfil do membro Wix fica para depois (perfil usa mock).
 */
import {
  criarClienteMembro,
  salvarSessaoLocal,
  sessaoValida,
  type TokensWix,
} from "./wixSession";
import { planoDoMembro } from "../planoAssinatura";
import type { Usuaria } from "../usuaria";
import { members } from "@wix/members";

export async function usuariaWix(): Promise<Usuaria | null> {
  const tokens = await sessaoValida();
  if (!tokens) return null;
  try {
    const client = criarClienteMembro(tokens, { members });
    const resposta = (await client.members.getCurrentMember({
      fieldsets: ["EXTENDED"],
    })) as unknown as {
      member?: {
        loginEmail?: string;
        profile?: { nickname?: string; slug?: string; photo?: { url?: string } };
        contact?: { firstName?: string };
      };
    };
    // O SDK pode devolver o membro direto ou aninhado em { member }.
    const membro =
      resposta?.member ??
      (resposta as unknown as { loginEmail?: string; profile?: { nickname?: string; slug?: string; photo?: { url?: string } }; contact?: { firstName?: string } });
    const perfil = membro?.profile ?? {};
    const contato = membro?.contact ?? {};
    // O Wix pode renovar os tokens durante a chamada; salva se veio algo novo.
    try {
      const atualizados = client.auth.getTokens() as TokensWix | undefined;
      if (
        atualizados?.refreshToken?.value &&
        atualizados.refreshToken.value !== tokens.refreshToken.value
      ) {
        salvarSessaoLocal(atualizados);
      }
    } catch {
      /* sem renovação: segue com os tokens atuais */
    }
    return {
      nome: perfil.nickname ?? contato.firstName ?? perfil.slug ?? "Membro Casa Loba",
      email: membro?.loginEmail ?? "",
      imagem: perfil.photo?.url,
      plano: await planoDoMembro(),
    };
  } catch (erro) {
    // Erro lendo o perfil (rede instável, 5xx, CORS…): NÃO apaga a sessão.
    // A pessoa continua “logada”; verá a área de membros na próxima tentativa.
    console.error("[auth] não foi possível ler o membro Wix:", erro);
    return null;
  }
}
