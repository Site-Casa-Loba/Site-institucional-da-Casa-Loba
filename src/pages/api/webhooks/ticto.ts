import type { APIRoute } from 'astro';

export const prerender = false;

type PlanoPagoId = 'loba-essencial' | 'loba-ativa' | 'loba-rede';

// Mapeamento dos códigos de oferta da Ticto para os IDs internos do site
const OFERTAS_TICTO: Record<string, PlanoPagoId> = {
  OECFA7173: 'loba-essencial', // Se criou uma oferta nova para o Essencial, troque este código
  OE159E066: 'loba-ativa',
  OE887B542: 'loba-rede',
};

function ambiente(chave: string): string | undefined {
  return (
    (import.meta.env as Record<string, string | undefined>)[chave] ??
    process.env[chave]
  );
}

function identificarPlano(body: any): PlanoPagoId | null {
  // 1. Tenta identificar pelo código da oferta da Ticto (mais seguro)
  const candidatosCodigo = [
    body.item?.offer_code,
    body.offer?.code,
    body.item?.offer_id,
    body.offer?.id,
  ]
    .filter(Boolean)
    .map((c) => String(c).trim().toUpperCase());

  for (const codigo of candidatosCodigo) {
    if (OFERTAS_TICTO[codigo]) {
      return OFERTAS_TICTO[codigo];
    }
  }

  // 2. Tenta identificar pelo nome da oferta ou do produto
  const textoBusca = [
    body.item?.offer_name,
    body.offer?.name,
    body.item?.product_name,
    body.product?.name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (textoBusca.includes('rede')) return 'loba-rede';
  if (textoBusca.includes('ativa')) return 'loba-ativa';
  if (textoBusca.includes('essencial')) return 'loba-essencial';

  // 3. Fallback pelo valor pago em centavos
  const valorCentavos = Number(
    body.item?.amount || body.order?.paid_amount || 0
  );
  if (valorCentavos === 14990) return 'loba-rede';
  if (valorCentavos === 4990) return 'loba-ativa';
  if (valorCentavos === 1990) return 'loba-essencial';

  return null;
}

async function wixDataRequest(
  endpoint: string,
  method: 'POST' | 'PUT',
  payload: unknown
) {
  const token = ambiente('WIX_API_TOKEN');
  const siteId = ambiente('WIX_SITE_ID');

  if (!token || !siteId) {
    throw new Error('WIX_API_TOKEN ou WIX_SITE_ID não configurados no servidor.');
  }

  const resposta = await fetch(`https://www.wixapis.com/wix-data/v2/${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
      'wix-site-id': siteId,
    },
    body: JSON.stringify(payload),
  });

  if (!resposta.ok) {
    const erroTexto = await resposta.text();
    throw new Error(`Erro Wix Data (${resposta.status}): ${erroTexto}`);
  }

  return resposta.json();
}

async function salvarAssinaturaNoWix(dados: {
  email: string;
  nome: string;
  plano: PlanoPagoId;
  status: 'ACTIVE' | 'CANCELED';
  transacaoId: string;
}) {
  const emailNormalizado = dados.email.trim().toLowerCase();

  // Evita processar a mesma transação duas vezes se a Ticto reenviar o webhook
  if (dados.transacaoId) {
    const porTransacao = await wixDataRequest('items/query', 'POST', {
      dataCollectionId: 'assinaturas',
      query: {
        filter: { transacao_id: { $eq: dados.transacaoId } },
        paging: { limit: 1 },
      },
    });

    if ((porTransacao.dataItems ?? []).length > 0) {
      console.log(`Transação ${dados.transacaoId} já registrada anteriormente.`);
      return;
    }
  }

  // Verifica se já existe um registro para este e-mail (para atualizar em vez de duplicar)
  const porEmail = await wixDataRequest('items/query', 'POST', {
    dataCollectionId: 'assinaturas',
    query: {
      filter: { email: { $eq: emailNormalizado } },
      paging: { limit: 1 },
    },
  });

  const registroExistente = (porEmail.dataItems ?? [])[0];
  const itemData = {
    email: emailNormalizado,
    nome: dados.nome,
    plano: dados.plano,
    status: dados.status,
    transacao_id: dados.transacaoId,
  };

  if (registroExistente?.id) {
    await wixDataRequest(`items/${registroExistente.id}`, 'PUT', {
      dataCollectionId: 'assinaturas',
      dataItem: {
        id: registroExistente.id,
        data: itemData,
      },
    });
  } else {
    await wixDataRequest('items', 'POST', {
      dataCollectionId: 'assinaturas',
      dataItem: {
        data: itemData,
      },
    });
  }
}

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ status: 'online' }), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const tictoToken = ambiente('TICTO_WEBHOOK_TOKEN');
    const rawToken =
      body.token ||
      request.headers.get('Authorization') ||
      request.headers.get('x-ticto-token');

    const cleanToken = rawToken
      ? String(rawToken).replace(/^Bearer\s+/i, '').trim()
      : '';

    if (!tictoToken || cleanToken !== tictoToken) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
      });
    }

    const statusEvento = String(
      body.status || body.payment_status || ''
    ).toLowerCase();

    const aprovado =
      statusEvento === 'authorized' || statusEvento === 'approved';
    const cancelado = [
      'refunded',
      'canceled',
      'cancelled',
      'chargeback',
      'expired',
    ].includes(statusEvento);

    if (!aprovado && !cancelado) {
      return new Response(
        JSON.stringify({ message: `Evento ignorado (${statusEvento})` }),
        { status: 200 }
      );
    }

    const matchedPlanId = identificarPlano(body);
    if (!matchedPlanId) {
      console.warn('Plano não identificado no payload da Ticto:', body.item);
      return new Response(
        JSON.stringify({ message: 'Recebido (plano não mapeado)' }),
        { status: 200 }
      );
    }

    const customerEmail = body.customer?.email;
    if (!customerEmail) {
      return new Response(
        JSON.stringify({ error: 'E-mail do comprador ausente no payload' }),
        { status: 400 }
      );
    }

    const customerName = body.customer?.name || 'Cliente Casa Loba';
    const transacaoId = String(
      body.order?.hash || body.order?.id || body.transaction?.hash || ''
    );

    await salvarAssinaturaNoWix({
      email: customerEmail,
      nome: customerName,
      plano: matchedPlanId,
      status: aprovado ? 'ACTIVE' : 'CANCELED',
      transacaoId,
    });

    console.log(
      `Assinatura ${aprovado ? 'ativada' : 'cancelada'}: ${matchedPlanId} | ${customerEmail}`
    );

    return new Response(
      JSON.stringify({
        message: 'Processado com sucesso',
        plano: matchedPlanId,
        cliente: customerEmail,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro interno no webhook Ticto:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno no servidor' }),
      { status: 500 }
    );
  }
};