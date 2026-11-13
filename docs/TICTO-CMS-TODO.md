# TODO — Webhook da Ticto e integração com o CMS
Arthur - 12/11/2026

Este documento descreve como está hoje o webhook que recebe as notificações de
pagamento da Ticto (`/api/webhooks/ticto`), o que ainda falta para ele virar uma
integração completa e, principalmente, **por que** cada pendência existe.

Para entender o contexto de publicação: o site não é mais um monte de arquivos
estáticos. Ele é publicado como um **build server-rendered do Wix** — as páginas
continuam prontas de antemão, mas rotas como o webhook rodam de verdade num
servidor da Wix. Por causa disso, o jeito de publicar mudou: o release é feito
pelo script `scripts/wix-release.mjs` (que conversa com o Wix por MCP usando a
chave de API), e **não** por drop de arquivos estáticos nem pelo `wix release`
do CLI — esses dois publicam só arquivos e desligam o servidor, o que fazia o
webhook voltar a dar 404. Isso já nos aconteceu e está documentado no
cabeçalho de `.github/workflows/deploy.yml` e em `docs/AUTH.md`.

## O que já está funcionando

- Quando a Ticto salva a URL do webhook, ela faz um teste ping: um `GET` em
  `/api/webhooks/ticto`, que hoje responde `200 {"status":"online"}`. Passou.
- Quando uma notificação real chega (`POST`), o webhook confere um token
  secreto para garantir que a chamada veio mesmo da Ticto. A Ticto pode enviar
  esse token no corpo da mensagem (campo `token`) ou no header
  `x-ticto-token`. Token errado ou ausente → `401`, e a notificação é ignorada.
**Mas há um porém importante:** depois de reconhecer a venda, o webhook hoje
apenas escreve uma linha no log e encerra. A venda não é registrada em lugar
nenhum, não vira assinatura, não libera acesso, não avisa ninguém. O que
segue abaixo é o caminho para fechar esse ciclo.

## Pendência 1 — O token da Ticto está costurado no build (e isso é errado)

**O que acontece hoje.** O código do webhook lê o token secreto através de
`import.meta.env.TICTO_WEBHOOK_TOKEN`. Essa forma de ler tem um efeito que não
é óbvio: o valor é **colado dentro do código durante o build**. Ou seja, toda
é óbvio: o valor é **colado dentro do código durante o build**. Ou seja, toda
vez que o site é compilado, o token vira parte do arquivo do servidor que
publicamos.

**Como deveria ser.** Um segredo deve ser lido **quando o servidor executa**,
não quando o código é compilado. É o mesmo princípio que já usamos sem pensar:
o client ID do login fica no código porque é público; um segredo nunca deveria
seguir esse caminho. Na prática, a migração é fazer o webhook ler o token em
tempo de execução (Astro tem suporte nativo a isso com `astro:env` em modo
secret) e cadastrar o valor como variável de ambiente do projeto no painel da
Wix. Com isso, o build não carrega segredo algum, trocar o token vira uma
alteração no painel sem redeploy, e o secret `TICTO_WEBHOOK_TOKEN` sai do
GitHub por completo.

**Por que ainda não fizemos.** Falta de tempo.

## Pendência 2 — Registrar a venda no CMS

Hoje, quando chega uma venda aprovada (a Ticto manda `status` `authorized` ou
`approved`), o webhook reconhece o plano e... para aí. Para a venda significar
algo, falta um caminho inteiro:

1. **O webhook precisa de credenciais para falar com a Wix.** Ele roda num
   servidor, sem navegador e sem sessão de pessoa logada — então precisa de um
   token de acesso próprio, de máquina. Há dois caminhos possíveis a validar:
   gerar um client secret para o cliente headless no painel da Wix (o par
   client ID + secret que autentica a máquina), ou usar as credenciais de
   aplicativo privado que a Wix criaria num projeto gerenciado pelo CLI —
   hoje o projeto preenche essas variáveis com valores provisórios
   (`build-placeholder`) apenas para o build funcionar. **Decidir qual dos
   dois antes de escrever código**, e guardar o que for segredo em tempo de
   execução (pendência 1), nunca costurado no build.

2. **Onde a venda vai morar.** Precisamos de uma coleção no CMS do Wix para
   registrar cada compra: qual plano, quem comprou (nome e e-mail), valor,
   data e — importante — o identificador da transação na Ticto, que é a chave
   para não registrar a mesma venda duas vezes.

3. **Ligar a compra à pessoa certa.** A notificação da Ticto traz os dados de
   quem pagou? Se sim, o webhook pode procurar a pessoa entre os membros do
   site pelo e-mail e liberar o plano dela. Se não traz, precisamos definir
   outra forma de identificar o comprador — sem isso, uma venda aprovada não
   tem a quem pertencer.

4. **A Ticto reenvia notificações.** Se o webhook demora ou falha ao
   responder, a Ticto tenta de novo — e a mesma venda pode chegar duas ou
   três vezes. O registro precisa deduplicar pelo identificador da transação:
   a segunda cópia da mesma venda deve ser reconhecida e ignorada, não
   processada de novo.

5. **Responder rápido e certo.** Tudo que o webhook conseguir aceitar deve
   receber um `2xx` imediato; erro ou demora faz a Ticto marcar falha e
   reenviar. Token inválido continua `401`. A regra de ouro: responder rápido,
   processar com calma.

6. **Dar visibilidade ao que acontece.** Hoje o único registro é um
   `console.log`, e ninguém definiu onde esses logs aparecem dentro da Wix.
   Quando uma compra real der problema, vamos precisar saber: a notificação
   chegou? o token bateu? o plano foi reconhecido? a gravação no CMS
   funcionou? Vale definir desde já o mínimo que cada notificação registra.

## Ordem sugerida

1. **Pendência 1 primeiro** — é pequena, tira um segredo do pipeline de build e
   cria a base (segredos em runtime) que a pendência 2 vai precisar de
   qualquer forma.
2. **Pendência 2, itens 1 e 2** — credenciais de servidor e a coleção no CMS,
   que são a fundação da integração.
3. **Restante da pendência 2**, testando com notificações reais da Ticto num
   ambiente de sandbox antes de apontar o webhook de produção para o código
   novo.
