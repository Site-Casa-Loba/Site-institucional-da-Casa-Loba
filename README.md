# Site institucional da Casa Loba

Site da Casa Loba, comunidade para mães e mulheres empreendedoras. Projeto de extensão.

O site é a vitrine da marca e a porta de entrada da comunidade: apresenta a Casa Loba, permite cadastro e assinatura de um plano e libera áreas conforme o plano. A conversa do dia a dia da comunidade continua em grupo de WhatsApp.

## Stack

- **Front-end:** [Astro](https://astro.build/) (código neste repositório).
- **Negócio (membros, planos, pagamentos, vídeos):** Wix Headless. A publicação e a hospedagem são feitas pelo Wix.
- **Pagamento:** Ticto, à pedido da Amabile.

## Estrutura de pastas

```
/
├── src/
│   ├── pages/          # Cada arquivo vira uma rota (página) do site
│   ├── layouts/        # Esqueleto comum das páginas (head, menu, rodapé)
│   ├── components/     # Pedaços reutilizáveis (botão, card, plano, menu...)
│   ├── styles/         # CSS global e variáveis da identidade visual
│   ├── scripts/        # JavaScript do navegador (ex.: menu que fica sólido ao rolar)
│   └── lib/            # Integração com o Wix (cliente, acesso por plano)
├── public/             # Arquivos servidos como estão (logo, favicon, imagens)
├── astro.config.mjs    # Configuração do Astro
├── package.json        # Dependências e comandos
└── README.md
```

> Os caminhos acima seguem o padrão do Astro. Se alguma pasta ainda não existir, ela é criada quando for necessária.

## Onde cada página vai

Cada arquivo em `src/pages/` vira uma URL: `src/pages/login.astro` → `/login`. Pastas viram prefixos: `src/pages/membros/index.astro` → `/membros`.

### Versão 1 (MVP)

| Página | Arquivo | Observação |
|---|---|---|
| Landing (home) | `src/pages/index.astro` | Textos da versão atual; planos ainda sem preço definido |
| Cadastro | `src/pages/cadastro.astro` | Cadastro local de demonstração |
| Login | `src/pages/entrar.astro` | Página de login; o cabeçalho também abre em modal (`ModalLogin.astro`) |
| Recuperar senha | `src/pages/recuperar-senha.astro` | Simulado; envio real de e-mail só na versão Wix |
| Perfil da usuária | `src/pages/perfil.astro` | Redireciona para `/membros/perfil` |
| Planos | `src/pages/planos.astro` | Comparação dos planos |
| Pré-inscrição / lista de espera | `src/pages/pre-inscricao.astro` | Substitui o checkout enquanto a comunidade paga não for lançada |
| Checkout | `src/pages/checkout.astro` | Pagamento por cartão dentro do site. Só entra se a cobrança for lançada |
| Confirmação de pagamento | `src/pages/confirmacao.astro` | Só entra junto com o checkout |
| Home da área de membros | `src/pages/membros/index.astro` | Mostra apenas o que o plano da pessoa libera (mock local) |
| Conteúdo de exemplo | `src/pages/membros/[slug].astro` | Inclui o vídeo de boas-vindas e os demais conteúdos de demonstração |
| Conteúdo bloqueado | `src/pages/membros/[slug].astro` | Tela de upgrade quando o plano não libera o conteúdo |
| Termos de uso | `src/pages/termos-de-uso.astro` | Minuta 0.2 com revisão jurídica pendente |
| Política de privacidade | `src/pages/politica-de-privacidade.astro` | Minuta LGPD 0.2 com revisão jurídica pendente |

> Login e cadastro são páginas (`/entrar` e `/cadastro`); o login também abre em modal pelo cabeçalho. A rota `/login` não existe. A autenticação atual é um mock local — veja `docs/INSTRUCOES-MOCKCUP.md`.

### Versão 2

| Página | Arquivo |
|---|---|
| Minha assinatura (trocar plano, cancelar, histórico) | `src/pages/membros/assinatura.astro` |
| Mural de networking | `src/pages/membros/mural.astro` |
| Eventos (lista) | `src/pages/eventos/index.astro` |
| Evento (detalhe) | `src/pages/eventos/[slug].astro` |
| Acesso à comunidade de WhatsApp | `src/pages/membros/comunidade.astro` |
| Contato e FAQ | `src/pages/contato.astro` |
| Administração (membros, assinaturas, conteúdos) | `src/pages/admin/index.astro` |

Atualize estas tabelas ao criar, renomear ou remover uma página.

## Onde vai cada tipo de arquivo

| O que é | Onde |
|---|---|
| Uma página nova | `src/pages/` |
| Menu, rodapé, `<head>` e fontes (comuns a todas as páginas) | `src/layouts/` |
| Algo usado em mais de uma página (botão, card, cartão de plano, selo) | `src/components/` |
| Seções da landing (hero, sobre, frentes, planos, para quem é, chamada final) | `src/components/` (um componente por seção), montadas em `src/pages/index.astro` |
| Variáveis de cor/fonte, reset e estilos globais | `src/styles/` |
| Estilo que só uma página ou componente usa | dentro do próprio `.astro`, em `<style>` |
| JavaScript do navegador | `src/scripts/` |
| Conexão com o Wix, regra de acesso por plano, chamadas de pagamento | `src/lib/` |
| Logo, favicon, imagens e vídeos de apoio | `public/` (imagens em `public/images/`) |
| Chaves e IDs de ambiente (Wix, Stripe) | arquivo `.env` local, **nunca** commitado |

## Conteúdo: o que o site pode afirmar

A Cuidadoteca, os eventos próprios e as parcerias com coworkings ainda são objetivos futuros. O site deve apresentá-los como iniciativas **"em breve"**, nunca como serviços em funcionamento.

Os planos ainda não foram definidos pelas sócias (quantidade, nomes, preços e benefícios). Os nomes e valores que aparecem hoje são provisórios.

## Identidade visual

Cores, fontes, formas, componentes, arcos, logo e tom de voz estão em [identidade-visual.md](identidade-visual.md).

## Documentos legais

Os textos de termos de uso e política de privacidade ficam em `src/content/legal/` e são renderizados por `src/layouts/LegalLayout.astro`. As páginas usam `noindex,nofollow` e exibem aviso de minuta; a publicação definitiva depende do preenchimento dos campos `PREENCHER_`, da conferência do que Wix e Ticto tratam de fato e da revisão jurídica.

## Rodando o projeto

```bash
npm install     # instala as dependências
npm run dev     # servidor local em http://localhost:4321
npm run build   # gera a versão de produção
npm run wix:check  # confere se o site no ar está igual ao dist/
```

## Deploy

O site fica no Wix Headless em
<https://headless-urlsttluzfw-arthursoares1234-1410.wix-site-host.com>
(site `5542fcdd-bc0a-4731-aa1b-6fa3c00f8082`).

O deploy é automático: cada push na `main` dispara o workflow
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), que roda
`npm run build` e envia o `dist/` inteiro para o site. O envio substitui todo
o conjunto de arquivos publicados — nada de upload incremental.

Para o workflow funcionar, o repositório precisa do secret `WIX_API_TOKEN`: uma
chave de API do Wix com acesso ao site Headless (gerada em
`manage.wix.com/account/api-keys`). Sem ele o job falha na hora de publicar.

O último passo do workflow roda `npm run wix:check`, que compara cada arquivo
do `dist/` com o que está no ar e falha se algo não chegou. É o mesmo comando
que dá pra rodar na mão depois de publicar.

Publicar manualmente, sem passar pelo GitHub:

```bash
npm run build
cd dist && zip -qr /tmp/site.zip . && cd ..
curl -X POST \
  "https://www.wixapis.com/headless-business-setup/v1/headless-business/$WIX_SITE_ID/drop" \
  -H "Authorization: $(grep '^WIX_API_TOKEN=' .env | cut -d= -f2-)" \
  -F "files=@/tmp/site.zip"
```
