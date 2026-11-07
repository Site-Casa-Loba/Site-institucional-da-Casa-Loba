/**
 * Conta de demonstração no navegador (DEV). Só as contas de `demo.ts` entram;
 * a sessão e as edições de perfil ficam no localStorage deste navegador.
 */
import { lerJson, remover, salvarJson } from "../armazenamento";
import type { Usuaria } from "../usuaria";
import { CONTAS_DEMO, type ContaDemo } from "./demo";

const CHAVE_SESSAO = "casa-loba-sessao";
const CHAVE_PERFIS = "casa-loba-perfis";

type PerfilDemo = ContaDemo & { imagem?: string };

interface SessaoDemo {
  email: string;
}

function lerPerfis(): PerfilDemo[] {
  return lerJson<PerfilDemo[]>(CHAVE_PERFIS, []);
}

function salvarPerfis(perfis: PerfilDemo[]): void {
  try {
    salvarJson(CHAVE_PERFIS, perfis);
  } catch {
    throw new Error("Não foi possível salvar seus dados neste navegador.");
  }
}

/** Perfil editado (se houver) sobre a conta fixa de demonstração. */
function perfilDe(email: string): PerfilDemo | undefined {
  const conta = CONTAS_DEMO.find((demo) => demo.email === email);
  if (!conta) return undefined;
  return lerPerfis().find((perfil) => perfil.email === email) ?? conta;
}

function comoUsuaria({ nome, email, plano, imagem }: PerfilDemo): Usuaria {
  return { nome, email, plano, ...(imagem ? { imagem } : {}) };
}

function salvarSessao(email: string): void {
  try {
    salvarJson(CHAVE_SESSAO, { email } satisfies SessaoDemo);
  } catch {
    throw new Error("Não foi possível iniciar sua sessão neste navegador.");
  }
}

const mockAuth = {
  /** Troca a conta logada pela conta de demonstração `email`. */
  entrarDemo(email: string): Usuaria {
    const perfil = perfilDe(email);
    if (!perfil) throw new Error("Conta de demonstração desconhecida.");
    salvarSessao(perfil.email);
    return comoUsuaria(perfil);
  },

  sair(): void {
    remover(CHAVE_SESSAO);
  },

  usuariaAtual(): Usuaria | null {
    const { email } = lerJson<SessaoDemo>(CHAVE_SESSAO, { email: "" });
    const perfil = email ? perfilDe(email) : undefined;
    return perfil ? comoUsuaria(perfil) : null;
  },

  atualizarPerfil(dados: Partial<Pick<Usuaria, "nome" | "imagem">>): Usuaria {
    const atual = mockAuth.usuariaAtual();
    if (!atual) throw new Error("Sua sessão expirou. Entre novamente.");
    const perfil: PerfilDemo = { ...atual, ...dados };
    salvarPerfis([...lerPerfis().filter((item) => item.email !== atual.email), perfil]);
    return comoUsuaria(perfil);
  },
};

export default mockAuth;
