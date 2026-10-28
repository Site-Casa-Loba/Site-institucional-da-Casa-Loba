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
| Landing (home) | `src/pages/index.astro` | Já implementada. Textos ainda provisórios |
| Recuperar senha | `src/pages/recuperar-senha.astro` | Via recursos de membros do Wix |
| Perfil da usuária | `src/pages/perfil.astro` | Ver e editar dados |
| Planos | `src/pages/planos.astro` | Já implementada. Comparação dos planos, com dados provisórios em `src/lib/planos.ts`. Por enquanto, "assinar" leva à pré-inscrição |
| Pré-inscrição / lista de espera | `src/pages/pre-inscricao.astro` | Já implementada. Substitui o checkout enquanto a comunidade paga não for lançada. O formulário de e-mail ainda não envia nada |
| Checkout | `src/pages/checkout.astro` | Pagamento por cartão dentro do site. Só entra se a cobrança for lançada |
| Confirmação de pagamento | `src/pages/confirmacao.astro` | Só entra junto com o checkout |
| Home da área de membros | `src/pages/membros/index.astro` | Mostra apenas o que o plano da pessoa libera |
| Conteúdo de exemplo | `src/pages/membros/exemplo.astro` | Vídeo ou curso de teste para demonstrar o controle de acesso |
| Conteúdo bloqueado | `src/pages/membros/bloqueado.astro` | Aviso "faça upgrade" para quem não tem o plano |
| Termos de uso | `src/pages/termos-de-uso.astro` | Texto precisa de revisão jurídica antes de ser final |
| Política de privacidade | `src/pages/politica-de-privacidade.astro` | LGPD. Mesma observação dos termos |

> Login e cadastro não são páginas: são modais em `src/components/` (`ModalLogin.astro` e `ModalCadastro.astro`), que abrem por cima da página atual. Não existem as rotas `/login` nem `/cadastro`.

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

## Rodando o projeto

```bash
npm install     # instala as dependências
npm run dev     # servidor local em http://localhost:4321
npm run build   # gera a versão de produção
```
