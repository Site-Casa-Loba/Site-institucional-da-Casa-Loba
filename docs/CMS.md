# CMS no Wix — coleções da Casa Loba

Site: **Casa Loba | Headless** (`5542fcdd-bc0a-4731-aa1b-6fa3c00f8082`).
Criadas via API de Dados do Wix (Data Collections, `POST /wix-data/v2/collections`) em 04/11/2026.

## Por que não há coleção "Membros"

Dados de membro (cadastro, login, perfil privado) são responsabilidade do app
**Wix Members**, que mantém as coleções de sistema (`Members/PrivateMembersData`,
`Members/PublicData`, `Members/FullData`, `Members/Badges`) e a autenticação
OAuth. Criar uma coleção própria duplicaria essa fonte e criaria dois "donos"
dos mesmos dados (LGPD). O plano de assinatura de cada pessoa vem do **Wix
Pricing Plans** (ainda não configurado — ver `tasks.md`). A área logada usa
essas fontes quando a integração estiver completa.

## Coleções

| Coleção | displayName | Leitura | Escrita | Uso |
|---|---|---|---|---|
| `planos` | Planos | `ANYONE` | `ADMIN` | Catálogo público exibido em `/planos` |
| `conteudos` | Conteúdos | `SITE_MEMBER` | `ADMIN` | Conteúdos da área de membros (vídeo, texto) com plano mínimo |
| `depoimentos` | Depoimentos | `ANYONE` | `ADMIN` | Depoimentos aprovados para a landing |
| `inscricoes` | Inscrições | `ADMIN` | insert `ANYONE` | Pré-inscrições / lista de espera (contém e-mail — não público, LGPD) |

> `conteudos.read = SITE_MEMBER` de propósito: os dados trazem URLs de vídeo da
> área paga. Não devem ser legíveis por visitantes anônimos. A liberação por
> **plano** (e não apenas "está logada") é verificada pela aplicação
> (`src/lib/membros.ts` hoje; verificação real de assinatura entra com o Pricing
> Plans — ver card "Implementar verificação de plano no Astro"). Quem ainda não
> deve ver o conteúdo simplesmente não deve saber as URLs — por isso a leitura
> exige login e as páginas de conteúdo bloqueado não expõem o `video_url`.

### `planos`

| Campo | Tipo | Observação |
|---|---|---|
| `slug` | TEXT | `loba`, `matilha`, `alcateia` (igual a `src/lib/planos.ts`) |
| `nome` | TEXT | Nome exibido |
| `selo` | TEXT | Ex.: "para começar" |
| `cor` | TEXT | `rosa`, `azul`, `vermelho` (ver identidade visual) |
| `preco_texto` | TEXT | Preço como texto; os planos reais ainda não foram definidos pelas sócias — hoje `[R$ 00]` |
| `beneficios` | TEXT | Um benefício por linha |
| `ordem` | NUMBER | Ordem de exibição |
| `destaque` | BOOLEAN | Plano em destaque (contorno azul) |
| `ativo` | BOOLEAN | Permite ocultar um plano sem apagar |

### `conteudos`

| Campo | Tipo | Observação |
|---|---|---|
| `slug` | TEXT | URL da página |
| `titulo` | TEXT | |
| `categoria` | TEXT | Ex.: "Comece por aqui" |
| `resumo` | TEXT | Card |
| `plano` | TEXT | Plano mínimo: `loba`, `matilha` ou `alcateia` |
| `video_url` | URL | Opcional |
| `conteudo` | TEXT | Texto da página |
| `ordem` | NUMBER | |
| `publicado` | BOOLEAN | |

### `depoimentos`

| Campo | Tipo | Observação |
|---|---|---|
| `nome` | TEXT | |
| `texto` | TEXT | |
| `plano` | TEXT | Opcional |
| `imagem_url` | URL | Opcional |
| `aprovado` | BOOLEAN | Só exibir aprovados |
| `ordem` | NUMBER | |

### `inscricoes`

| Campo | Tipo | Observação |
|---|---|---|
| `nome` | TEXT | |
| `email` | TEXT | Dado pessoal — leitura restrita a `ADMIN` |
| `plano_interesse` | TEXT | |
| `origem` | TEXT | Ex.: `landing`, `pre-inscricao` |
| `criado_em` | DATE | |

## Dados de exemplo

`planos` e `conteudos` foram semeados com os mesmos dados provisórios que já
estão no código (`src/lib/planos.ts` e `src/lib/membros.ts`) — nenhum dado novo
foi inventado. `depoimentos` e `inscricoes` estão **vazias** de propósito
(depoimentos reais virão de autorização da comunidade; inscrições são dados
pessoais). Nomes e preços continuam provisórios até as sócias definirem.

## Lendo o CMS pelo Astro

- **Catálogo público (planos):** `src/lib/cms.ts` — usado por
  `/cms-teste.html` (página de exemplo da validação). O Astro lê no build;
  sem credenciais, usa token de visitante; no servidor, cai na chave de
  API (escopo elevado) como fallback.
- **Área de membros (conteudos):** `src/lib/membrosCms.ts` — o navegador
  lê com o **token de membro** da sessão Wix. O Wix recusa anônimos
  (`WDE0027`), então o conteúdo nunca chega ao bundle estático
  (`dist/`) e anônimos recebem HTTP 4xx do Wix. Verificado: as strings
  dos conteúdos e o ID do vídeo não aparecem em `dist`.

## Decisões de segurança (04/11/2026)

- O texto/vídeos dos conteúdos **não** são commitados nem entram no build.
- Em `npm run dev` existe o mock local de demonstração (senha
  `casaloba123`); **no build de produção o mock é substituído pelo login
  real e some da interface** — o único "Entrar" no ar é o real.
- O conteúdo é placeholder (a comunidade paga ainda não lançou), mas a
  arquitetura já está correta para quando o valor existir.

## Pendências

- Substituir `src/lib/planos.ts`/`src/lib/membros.ts` pelo CMS quando os planos
  reais forem definidos (a página `/planos` ainda usa o catálogo local).
- `conteudos.video_url` expõe a URL a qualquer membro logado; restringir por
  plano exige verificação de assinatura no servidor (Pricing Plans).
- Documentar o app OAuth e as URIs de redirect (ver `docs/AUTH.md`).
