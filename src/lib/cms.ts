/**
 * SERVIDOR/PREFETCH APENAS: nunca importar em scripts de cliente (.js em
 * <script>): usa WIX_API_TOKEN (credencial de servidor). Importe só no
 * frontmatter de .astro ou em endpoints, que rodam no build.
 *
 * Contrato: erro não derruba o build; quem chama recebe { ok: false, erro }
 * e decide o que renderizar.
 */
import { createClient, OAuthStrategy } from "@wix/sdk";
import { items } from "@wix/data";

/**
 * Leitura do CMS (Wix Data) pelo Astro. Ver docs/CMS.md.
 *
 * Caminho principal: SDK com token de visitante (PUBLIC_WIX_CLIENT_ID,
 * que é o do próprio site headless; client ID de outro site falha com
 * "WDE0110: Wix CMS app is not installed for site"). Fallback: REST da
 * Data Items API com WIX_API_TOKEN, para o CI/build sem client ID e
 * para transitórios do SDK; leitura REST lê coleções restritas mesmo
 * para anônimos, por isso também é só-servidor.
 */

export interface ResultadoCms<T> {
  ok: boolean;
  dados: T[];
  erro?: string;
}

export interface Consulta {
  ordenarPor?: string;
  ordem?: "ASC" | "DESC";
  limite?: number;
}

function ambiente(chave: string): string | undefined {
  return (import.meta.env as Record<string, string | undefined>)[chave] ??
    process.env[chave];
}

async function consultarRest<T>(
  colecao: string,
  { ordenarPor, ordem = "ASC", limite = 50 }: Consulta,
): Promise<ResultadoCms<T>> {
  const token = ambiente("WIX_API_TOKEN");
  const siteId = ambiente("WIX_SITE_ID");
  if (!token || !siteId) {
    return {
      ok: false,
      dados: [],
      erro: "WIX_API_TOKEN e/ou WIX_SITE_ID não configurados no ambiente",
    };
  }
  const resposta = await fetch(
    "https://www.wixapis.com/wix-data/v2/items/query",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
        "wix-site-id": siteId,
      },
      body: JSON.stringify({
        dataCollectionId: colecao,
        query: {
          ...(ordenarPor
            ? { sort: [{ fieldName: ordenarPor, order: ordem }] }
            : {}),
          paging: { limit: limite },
        },
      }),
    },
  );
  if (!resposta.ok) {
    const corpo = await resposta.text();
    throw new Error(`HTTP ${resposta.status}: ${corpo.slice(0, 300)}`);
  }
  const corpo = (await resposta.json()) as {
    dataItems?: Array<{ data: T }>;
  };
  return { ok: true, dados: (corpo.dataItems ?? []).map((item) => item.data) };
}

async function consultarSdkVisitante<T>(
  colecao: string,
  limite = 50,
): Promise<ResultadoCms<T>> {
  const clientId = ambiente("PUBLIC_WIX_CLIENT_ID");
  if (!clientId) {
    throw new Error("PUBLIC_WIX_CLIENT_ID não configurado no ambiente");
  }
  const wixClient = createClient({
    modules: { items },
    auth: OAuthStrategy({ clientId }),
  });
  wixClient.auth.setTokens(await wixClient.auth.generateVisitorTokens());
  const resposta = await wixClient.items
    .query(colecao)
    .limit(limite)
    .find();
  const lista = (resposta as unknown as { items?: Array<{ data?: T } | T> })
    .items ?? [];
  return {
    ok: true,
    dados: lista.map((item) => {
      const comDados = item as { data?: T };
      return (comDados?.data ?? item) as T;
    }),
  };
}

function ordenar<T>(dados: T[], por?: string): T[] {
  if (!por) return dados;
  return [...dados].sort(
    (a, b) =>
      Number((a as Record<string, unknown>)[por] ?? 0) -
      Number((b as Record<string, unknown>)[por] ?? 0),
  );
}

/**
 * Lê uma coleção: tenta o SDK de visitante e cai no REST com a chave de
 * servidor. Nunca lança: devolve `{ ok: false, erro }`.
 */
export async function consultarColecao<T>(
  colecao: string,
  consulta: Consulta = {},
): Promise<ResultadoCms<T>> {
  const limite = consulta.limite ?? 50;
  try {
    const resultado = await consultarSdkVisitante<T>(colecao, limite);
    return { ok: true, dados: ordenar(resultado.dados, consulta.ordenarPor) };
  } catch (sdkErro) {
    const motivo = sdkErro instanceof Error ? sdkErro.message : String(sdkErro);
    console.warn(
      `[cms] SDK falhou para "${colecao}" (${motivo}); tentando REST com a chave de servidor`,
    );
    try {
      return await consultarRest<T>(colecao, consulta);
    } catch (restErro) {
      const mensagem = restErro instanceof Error ? restErro.message : String(restErro);
      console.error(`[cms] falha ao ler a coleção "${colecao}": ${mensagem}`);
      return { ok: false, dados: [], erro: `${mensagem} (SDK: ${motivo})` };
    }
  }
}
