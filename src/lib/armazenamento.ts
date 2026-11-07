/**
 * Helper único de `localStorage` JSON (client-side).
 * `lerJson` nunca lança (parse inválido volta ao fallback);
 * `salvarJson` lança Error se o navegador não puder escrever; o chamador
 * decide a mensagem amigável (mock) ou só registra (mural, sessão Wix).
 */

export function lerJson<T>(chave: string, fallback: T): T {
  try {
    const bruto = window.localStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : fallback;
  } catch (erro) {
    console.error(`Não foi possível ler "${chave}" no navegador.`, erro);
    return fallback;
  }
}

export function salvarJson(chave: string, dados: unknown): void {
  try {
    window.localStorage.setItem(chave, JSON.stringify(dados));
  } catch (erro) {
    console.error(`Não foi possível salvar "${chave}" no navegador.`, erro);
    throw new Error(`Não foi possível salvar "${chave}" neste navegador.`);
  }
}

export function remover(chave: string): void {
  try {
    window.localStorage.removeItem(chave);
  } catch {
    /* armazenamento indisponível */
  }
}
