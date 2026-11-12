import type { APIRoute } from 'astro';

export const prerender = false;

type PlanoPagoId = 'loba-essencial' | 'loba-ativa' | 'loba-rede';

function identificarPlano(body: any): PlanoPagoId | null {
  const nomeProduto = String(
    body.item?.product_name || body.product?.name || ''
  ).toLowerCase();

  if (nomeProduto.includes('rede')) return 'loba-rede';
  if (nomeProduto.includes('ativa')) return 'loba-ativa';
  if (nomeProduto.includes('essencial')) return 'loba-essencial';

  const valorCentavos = Number(body.item?.amount || body.order?.paid_amount || 0);
  if (valorCentavos === 14990) return 'loba-rede';
  if (valorCentavos === 4990) return 'loba-ativa';
  if (valorCentavos === 1990) return 'loba-essencial';

  return null;
}

// Responde 200 quando a Ticto testa a URL ao salvar
export const GET: APIRoute = async () => {
  console.log('Ping GET da Ticto recebido!');
  return new Response(JSON.stringify({ status: 'online' }), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    console.log('--- PAYLOAD RECEBIDO DA TICTO ---');
    console.log(JSON.stringify(body, null, 2));

    const tictoToken = import.meta.env.TICTO_WEBHOOK_TOKEN;
    const rawToken =
      body.token ||
      request.headers.get('Authorization') ||
      request.headers.get('x-ticto-token');

    const cleanToken = rawToken ? String(rawToken).replace(/^Bearer\s+/i, '').trim() : '';

    if (!tictoToken || cleanToken !== tictoToken) {
      console.log('Token Ticto inválido recebido:', rawToken);
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 });
    }

    const status = body.status || body.payment_status;
    if (status !== 'authorized' && status !== 'approved') {
      return new Response(JSON.stringify({ message: 'Evento ignorado (não aprovado)' }), { status: 200 });
    }

    const matchedPlanId = identificarPlano(body);
    if (!matchedPlanId) {
      console.warn('Produto de teste genérico recebido:', body.item);
      return new Response(JSON.stringify({ message: 'Recebido (teste Ticto)' }), { status: 200 });
    }

    const customerName = body.customer?.name || 'Cliente Casa Loba';
    const customerEmail = body.customer?.email;

    console.log(`Venda Ticto aprovada! Plano: ${matchedPlanId} | Cliente: ${customerName} (${customerEmail})`);

    return new Response(
      JSON.stringify({
        message: 'Recebido com sucesso',
        plano: matchedPlanId,
        cliente: customerEmail,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro interno no webhook:', error);
    return new Response(JSON.stringify({ error: 'Erro interno no servidor' }), { status: 500 });
  }
};