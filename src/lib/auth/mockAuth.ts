import type { PlanoMembroId } from "../membros";
import type { Usuaria } from "../usuaria-mock";
import type { AuthService } from "./types";

interface ContaSalva {
  nome: string;
  email: string;
  plano: PlanoMembroId;
  imagem?: string;
}

const CHAVE_SESSAO = "casa-loba-sessao";
const CHAVE_CONTAS = "casa-loba-contas";
const SENHA_DEMO = "casaloba123";
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const contasTeste: ContaSalva[] = [
  { nome: "Loba", email: "loba@teste.com", plano: "loba" },
  { nome: "Matilha", email: "matilha@teste.com", plano: "matilha" },
  { nome: "Alcateia", email: "alcateia@teste.com", plano: "alcateia" },
];

function esperar(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 300 + Math.floor(Math.random() * 301)));
}

function armazenamentoDisponivel(): boolean {
  return typeof window !== "undefined";
}

function lerContas(): ContaSalva[] {
  if (!armazenamentoDisponivel()) return [];
  try {
    const contas = window.localStorage.getItem(CHAVE_CONTAS);
    return contas ? (JSON.parse(contas) as ContaSalva[]) : [];
  } catch (erro) {
    console.error("Não foi possível ler as contas da demonstração.", erro);
    throw new Error("Não foi possível acessar os dados locais. Verifique o armazenamento do navegador.");
  }
}

function salvarContas(contas: ContaSalva[]): void {
  if (!armazenamentoDisponivel()) return;
  try {
    window.localStorage.setItem(CHAVE_CONTAS, JSON.stringify(contas));
  } catch (erro) {
    console.error("Não foi possível salvar as contas da demonstração.", erro);
    throw new Error("Não foi possível salvar seus dados neste navegador.");
  }
}

function obterConta(email: string): ContaSalva | undefined {
  const normalizado = email.trim().toLowerCase();
  const contasSalvas = lerContas();
  const contasDemo = contasTeste.map((conta) =>
    contasSalvas.find((salva) => salva.email === conta.email) ?? conta,
  );
  return [...contasDemo, ...contasSalvas.filter((conta) => !contasTeste.some((demo) => demo.email === conta.email))]
    .find((conta) => conta.email === normalizado);
}

function transformarConta(conta: ContaSalva): Usuaria {
  return { ...conta };
}

function salvarSessao(email: string): void {
  if (!armazenamentoDisponivel()) return;
  try {
    window.localStorage.setItem(CHAVE_SESSAO, email);
  } catch (erro) {
    console.error("Não foi possível salvar a sessão da demonstração.", erro);
    throw new Error("Não foi possível iniciar sua sessão neste navegador.");
  }
}

// Senha apenas de demonstração: não é persistida e não representa autenticação real.
const mockAuth: AuthService = {
  async cadastrar({ nome, email, senha }) {
    await esperar();
    const normalizado = email.trim().toLowerCase();
    if (!EMAIL_VALIDO.test(normalizado)) throw new Error("Informe um e-mail válido.");
    if (obterConta(normalizado)) throw new Error("Este e-mail já está cadastrado. Faça login para continuar.");
    if (senha !== SENHA_DEMO) throw new Error(`Use a senha fixa de demonstração: ${SENHA_DEMO}.`);

    const conta: ContaSalva = { nome: nome.trim(), email: normalizado, plano: "loba" };
    salvarContas([...lerContas(), conta]);
    salvarSessao(normalizado);
    return transformarConta(conta);
  },

  async entrar(email, senha) {
    await esperar();
    const normalizado = email.trim().toLowerCase();
    if (!EMAIL_VALIDO.test(normalizado)) throw new Error("Informe um e-mail válido.");
    const conta = obterConta(normalizado);
    if (!conta || senha !== SENHA_DEMO) {
      throw new Error(`E-mail ou senha incorretos. Use a senha de demonstração ${SENHA_DEMO}.`);
    }
    salvarSessao(normalizado);
    return transformarConta(conta);
  },

  async sair() {
    if (!armazenamentoDisponivel()) return;
    try {
      window.localStorage.removeItem(CHAVE_SESSAO);
    } catch (erro) {
      console.error("Não foi possível encerrar a sessão da demonstração.", erro);
      throw new Error("Não foi possível encerrar sua sessão. Tente novamente.");
    }
  },

  async recuperarSenha(email) {
    await esperar();
    if (!EMAIL_VALIDO.test(email.trim())) throw new Error("Informe um e-mail válido.");
    // WIX: solicitar recuperação de senha sem revelar se a conta existe.
  },

  async redefinirSenha(_token, _novaSenha) {
    await esperar();
    // WIX: validar token e definir uma nova senha.
  },

  async atualizarPerfil(dados) {
    await esperar();
    const usuaria = await this.usuariaAtual();
    if (!usuaria) throw new Error("Sua sessão expirou. Entre novamente.");
    const contas = lerContas();
    const atualizada: ContaSalva = { ...usuaria, ...dados };
    salvarContas([...contas.filter((conta) => conta.email !== usuaria.email), atualizada]);
    return transformarConta(atualizada);
  },

  async usuariaAtual() {
    if (!armazenamentoDisponivel()) return null;
    try {
      const email = window.localStorage.getItem(CHAVE_SESSAO);
      if (!email) return null;
      const conta = obterConta(email);
      if (!conta) {
        window.localStorage.removeItem(CHAVE_SESSAO);
        return null;
      }
      const salva = lerContas().find((item) => item.email === conta.email);
      return transformarConta(salva ?? conta);
    } catch (erro) {
      if (erro instanceof Error && erro.message.startsWith("Não foi possível acessar")) throw erro;
      console.error("Não foi possível recuperar a sessão da demonstração.", erro);
      throw new Error("Não foi possível verificar sua sessão neste navegador.");
    }
  },
};

export default mockAuth;
