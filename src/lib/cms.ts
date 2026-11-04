/**
 * SERVIDOR APENAS — nunca importar em scripts de cliente (.js em <script>).
 * Este módulo usa WIX_API_TOKEN, uma credencial de servidor; ela não pode
 * aparecer no bundle do navegador. Importe apenas em frontmatter de .astro
 * ou em endpoints (src/pages/api/**), que rodam no servidor/build.
 */
import { createClient, OAuthStrategy } from "@wix/sdk";
import { items } from "@wix/data";

/**
 * Leitura do CMS (Wix Data) pelo Astro. Ver docs/CMS.md.
 *
 * Caminho principal: SDK do Wix com token de visitante (OAuth do app headless
 * do site — o CompanionAppId do site headless, é público por design).
 * Verificado em 04/11/2026: a leitura dos planos semeados funciona com esse
 * client ID. O client ID anterior do .env pertencia a outro site (sem CMS
 * instalado) e falhava com "WDE0110: Wix CMS app is not installed for site".
 *
 * Fallback: REST da Data Items API com a chave de servidor (WIX_API_TOKEN +
 * wix-site-id), escopada ao site headless — também verificada. O fallback
 * existe para o CI/build sem client ID e para transitórios do SDK. Atenção:
 * a chave eleva permissões — usar só no servidor.
 *
 * Erros não derrubam o build: quem chama recebe { ok: false, erro } e decide
 * o que renderizar.
 */

export interface ResultadoCms<T> {
  ok: boolean;
  dados: T[];
  erro?: string;
}

interface Consulta {
  ordenarPor?: string;
  ordem?: "ASC" | "DESC";
  limite?: number;
}

function ambiente(chave: string): string | undefined {
  // import.meta.env cobre build e SSR Astro; process.env cobre `node` puro.
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

export async function consultarSdkVisitante<T>(
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

async function consultar<T>(
  colecao: string,
  consulta: Consulta,
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

export interface PlanoCms {
  _id?: string;
  slug: string;
  nome: string;
  selo: string;
  cor: string;
  preco_texto: string;
  beneficios: string;
  ordem: number;
  destaque: boolean;
  ativo: boolean;
}

export interface ConteudoCms {
  _id?: string;
  slug: string;
  titulo: string;
  categoria: string;
  resumo: string;
  plano: string;
  video_url?: string;
  conteudo: string;
  ordem: number;
  publicado: boolean;
}

// Leitura pública (ANYONE): usada na landing e na página de teste.
export function obterPlanosCms(): Promise<ResultadoCms<PlanoCms>> {
  return consultar<PlanoCms>("planos", { ordenarPor: "ordem" });
}

// Leitura restrita a membros (SITE_MEMBER) para o público anônimo; a chave de
// servidor lê mesmo assim (acesso elevado) — usar só no servidor.
export function obterConteudosCms(): Promise<ResultadoCms<ConteudoCms>> {
  return consultar<ConteudoCms>("conteudos", { ordenarPor: "ordem" });
}
