import type { APIRoute } from "astro";
import { createClient, OAuthStrategy } from "@wix/sdk";
import { members } from "@wix/members";
import { obterPlano, PLANO_MINIMO, type PlanoPagoId } from "../../lib/planos";

export const prerender = false;

function ambiente(chave: string): string | undefined {
  return (
    (import.meta.env as Record<string, string | undefined>)[chave] ??
    process.env[chave]
  );
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const tokens = body?.tokens;

    if (!tokens?.accessToken?.value) {
      return new Response(JSON.stringify({ plano: PLANO_MINIMO }), {
        status: 401,
      });
    }

    const clientId =
      ambiente("PUBLIC_WIX_CLIENT_ID") ?? ambiente("WIX_CLIENT_ID");
    const apiToken = ambiente("WIX_API_TOKEN");
    const siteId = ambiente("WIX_SITE_ID");

    if (!clientId || !apiToken || !siteId) {
      return new Response(JSON.stringify({ plano: PLANO_MINIMO }), {
        status: 200,
      });
    }

    // 1. Confirma no Wix quem é o membro dono desse token (evita fraude de e-mail)
    const client = createClient({
      modules: { members },
      auth: OAuthStrategy({ clientId, tokens }),
    });

    const respostaMembro = (await client.members.getCurrentMember()) as unknown as {
      member?: { loginEmail?: string };
      loginEmail?: string;
    };

    const email = (
      respostaMembro?.member?.loginEmail ??
      respostaMembro?.loginEmail ??
      ""
    )
      .trim()
      .toLowerCase();

    if (!email) {
      return new Response(JSON.stringify({ plano: PLANO_MINIMO }), {
        status: 200,
      });
    }

    // 2. Busca a assinatura ativa desse e-mail na coleção "assinaturas"
    const respostaCms = await fetch(
      "https://www.wixapis.com/wix-data/v2/items/query",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiToken,
          "wix-site-id": siteId,
        },
        body: JSON.stringify({
          dataCollectionId: "assinaturas",
          query: {
            filter: { email: { $eq: email } },
            paging: { limit: 10 },
          },
        }),
      }
    );

    if (!respostaCms.ok) {
      return new Response(JSON.stringify({ plano: PLANO_MINIMO }), {
        status: 200,
      });
    }

    const dadosCms = (await respostaCms.json()) as {
      dataItems?: Array<{ data?: { plano?: string; status?: string } }>;
    };

    const assinaturaAtiva = (dadosCms.dataItems ?? []).find(
      (item) => item.data?.status === "ACTIVE"
    );

    const planoEncontrado = assinaturaAtiva?.data?.plano
      ? obterPlano(assinaturaAtiva.data.plano)
      : undefined;

    const planoFinal: PlanoPagoId =
      planoEncontrado && planoEncontrado.nivel > 0
        ? (planoEncontrado.id as PlanoPagoId)
        : PLANO_MINIMO;

    return new Response(JSON.stringify({ plano: planoFinal }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (erro) {
    console.error("[meu-plano] erro ao consultar plano no CMS:", erro);
    return new Response(JSON.stringify({ plano: PLANO_MINIMO }), {
      status: 200,
    });
  }
};