/**
 * Sessão da página: uma leitura de `auth.usuariaAtual()` por carregamento.
 * Cabeçalho, guard e página compartilham o mesmo resultado (sem repetir
 * chamadas ao Wix nem arriscar respostas divergentes no meio da página).
 */
import { auth } from "./auth";
import type { Usuaria } from "./usuaria";

let pendente: Promise<Usuaria | null> | undefined;

export function usuariaDaPagina(): Promise<Usuaria | null> {
  pendente ??= auth.usuariaAtual().catch((erro) => {
    console.error("[sessao] não foi possível conferir o acesso:", erro);
    return null;
  });
  return pendente;
}

/** Sai da conta e volta para a home. */
export async function sairDaConta(): Promise<void> {
  await auth.sair();
  window.location.assign("/");
}
