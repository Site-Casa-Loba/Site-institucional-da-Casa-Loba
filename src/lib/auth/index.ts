/**
 * Auth do site: Wix (conta real) em primeiro lugar; a conta de demonstração
 * fica só no `npm run dev` e só entra no bundle DEV.
 *
 * Esta fachada é o contrato: as páginas não conhecem `mockAuth`, chaves de
 * `localStorage` nem o fluxo OAuth. Ver docs/AUTH.md.
 */
import type { Usuaria } from "../usuaria";
import type { ContaDemo } from "./demo";
import { usuariaWix } from "./wixAuth";
import { limparSessaoLocal } from "./wixSession";

type PerfilEditavel = Partial<Pick<Usuaria, "nome" | "imagem">>;

async function demo() {
  return (await import("./mockAuth")).default;
}

export const auth = {
  async usuariaAtual(): Promise<Usuaria | null> {
    const membro = await usuariaWix();
    if (membro) return membro;
    return import.meta.env.DEV ? (await demo()).usuariaAtual() : null;
  },

  async sair(): Promise<void> {
    limparSessaoLocal();
    if (import.meta.env.DEV) (await demo()).sair();
  },

  /** Troca a conta logada por uma conta de demonstração (DEV). */
  async entrarDemo(email: string): Promise<Usuaria> {
    if (!import.meta.env.DEV) throw new Error("Contas de demonstração só existem em desenvolvimento.");
    return (await demo()).entrarDemo(email);
  },

  /** Contas disponíveis no seletor DEV. */
  async contasDemo(): Promise<readonly ContaDemo[]> {
    if (!import.meta.env.DEV) return [];
    return (await import("./demo")).CONTAS_DEMO;
  },

  async atualizarPerfil(dados: PerfilEditavel): Promise<Usuaria> {
    if (!import.meta.env.DEV) {
      throw new Error("A edição de perfil chega junto com a conta Wix.");
    }
    return (await demo()).atualizarPerfil(dados);
  },
};

