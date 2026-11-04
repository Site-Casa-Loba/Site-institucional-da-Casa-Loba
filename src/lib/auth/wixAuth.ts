/**
 * Serviço de autenticação via Wix (membro real, login na página do Wix).
 *
 * Regras atuais:
 * - `usuariaWix` devolve o membro logado pelo Wix, ou null.
 * - O plano vem de Wix Pricing Plans — ainda não configurado (tarefa
 *   "Configurar planos de assinatura no Wix" / verificação de plano).
 *   Até lá, membro real entra como plano "loba" (acesso mínimo, seguro).
 * - Edição de perfil do membro Wix fica para depois (perfil usa mock).
 */
import { createClient, OAuthStrategy } from "@wix/sdk";
import { members } from "@wix/members";
import {
  sessaoValida,
  salvarSessaoLocal,
  limparSessaoLocal,
  type TokensWix,
} from "./wixSession";
import type { Usuaria } from "../usuaria-mock";

function clienteCom(tokens: TokensWix) {
  return createClient({
    modules: { members },
    auth: OAuthStrategy({
      clientId: import.meta.env.PUBLIC_WIX_CLIENT_ID,
      tokens: tokens as never,
    }),
  });
}

export async function usuariaWix(): Promise<Usuaria | null> {
  const tokens = await sessaoValida();
  if (!tokens) return null;
  try {
    const client = clienteCom(tokens);
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
      plano: "loba",
    };
  } catch (erro) {
    console.error("[auth] membro Wix inválido, sessão apagada:", erro);
    limparSessaoLocal();
    return null;
  }
}
