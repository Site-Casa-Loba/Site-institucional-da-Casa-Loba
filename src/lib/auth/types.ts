import type { Usuaria } from "../usuaria-mock";

export interface AuthService {
  cadastrar(dados: { nome: string; email: string; senha: string }): Promise<Usuaria>;
  entrar(email: string, senha: string): Promise<Usuaria>;
  sair(): Promise<void>;
  recuperarSenha(email: string): Promise<void>;
  redefinirSenha(token: string, novaSenha: string): Promise<void>;
  atualizarPerfil(dados: Partial<Pick<Usuaria, "nome" | "imagem">>): Promise<Usuaria>;
  usuariaAtual(): Promise<Usuaria | null>;
}
