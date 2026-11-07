/**
 * Guard client-side da área de membros (site 100% estático, sem middleware):
 * devolve a usuária logada ou redireciona para /entrar.html?redirect=…
 * Não lança; o chamador segue no ramo "sem usuária" após o redirect.
 */
import { usuariaDaPagina } from "./sessao";
import type { Usuaria } from "./usuaria";

export async function exigirLogin(): Promise<Usuaria | null> {
  const usuaria = await usuariaDaPagina();
  if (usuaria) return usuaria;
  const destino = `${window.location.pathname}${window.location.search}`;
  window.location.replace(`/entrar.html?redirect=${encodeURIComponent(destino)}`);
  return null;
}
