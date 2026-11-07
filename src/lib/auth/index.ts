/**
 * Auth do site: Wix (conta real) em primeiro lugar; o mock local de
 * demonstração (senha casaloba123) fica para as contas de teste e para os
 * fluxos ainda sem versão Wix (cadastro, perfil, recuperação de senha —
 * ver docs/AUTH.md e docs/INSTRUCOES-MOCKCUP.md).
 */
import mockAuth from "./mockAuth";
import { usuariaWix } from "./wixAuth";
import { limparSessaoLocal } from "./wixSession";
export const auth = {
  cadastrar: mockAuth.cadastrar,
  entrar: mockAuth.entrar,
  recuperarSenha: mockAuth.recuperarSenha,
  redefinirSenha: mockAuth.redefinirSenha,
  atualizarPerfil: mockAuth.atualizarPerfil,
  async sair(): Promise<void> {
    await mockAuth.sair();
    limparSessaoLocal();
  },
  async usuariaAtual() {
    const membro = await usuariaWix();
    if (membro) return membro;
    // No build de produção não existe conta de demonstração.
    return import.meta.env.DEV ? mockAuth.usuariaAtual() : null;
  },
};
export type { AuthService } from "./types";
