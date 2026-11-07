# CMS no Wix — coleções da Casa Loba

Site: **Casa Loba | Headless** (`5542fcdd-bc0a-4731-aa1b-6fa3c00f8082`).
Criadas via API de Dados do Wix (Data Collections, `POST /wix-data/v2/collections`) em 04/11/2026.

## Por que não há coleção "Membros"

Dados de membro (cadastro, login, perfil privado) são responsabilidade do app
**Wix Members**, que mantém as coleções de sistema (`Members/PrivateMembersData`,
`Members/PublicData`, `Members/FullData`, `Members/Badges`) e a autenticação
OAuth. Criar uma coleção própria duplicaria essa fonte e criaria dois "donos"
dos mesmos dados (LGPD). O plano de assinatura de cada pessoa vem do **Wix Pricing Plans**
(ainda não há planos publicados). O helper `src/lib/planoAssinatura.ts`
já lê as assinaturas com o token de membro e cai no plano mínimo
(`PLANO_MINIMO`, Loba Essencial); a área logada usa essa função
(`wixAuth` → `auth.usuariaAtual()`).
Ver `docs/AUTH.md`.

## Coleções

| Coleção | displayName | Leitura | Escrita | Uso |
|---|---|---|---|---|
| `planos` | Planos | `ANYONE` | `ADMIN` | Catálogo público exibido em `/planos` |
| `conteudos` | Conteúdos | `SITE_MEMBER` | `ADMIN` | Conteúdos da área de membros (vídeo, texto) com plano mínimo |
| `depoimentos` | Depoimentos | `ANYONE` | `ADMIN` | Depoimentos aprovados para a landing |
| `inscricoes` | Inscrições | `ADMIN` | insert `ANYONE` | Pré-inscrições / lista de espera (contém e-mail — não público, LGPD) |

> `conteudos.read = SITE_MEMBER` de propósito: os dados trazem URLs de vídeo da
> área paga. Não devem ser legíveis por visitantes anônimos. A liberação por
> **plano** (e não apenas "está logada") é verificada pela aplicação:
> `src/lib/planoAssinatura.ts` (assinatura ativa, fallback `loba`) +
> `temAcessoAoConteudo` (`src/lib/planos.ts`). Quem ainda não deve ver o
> conteúdo simplesmente não deve saber as URLs — por isso a leitura
> exige login e as páginas de conteúdo bloqueado não expõem o `video_url`.

### `planos`

| Campo | Tipo | Observação |
|---|---|---|
| `slug` | TEXT | Tem de bater com os ids do catálogo em `src/lib/planos.ts`: `loba-essencial`, `loba-ativa`, `loba-rede`. Slug desconhecido é descartado e a página `/planos` cai no catálogo local (fallback) — se a coleção ainda tiver valores antigos (`loba`, `matilha`, `alcateia`), atualize-os lá. |
| `nome` | TEXT | Nome exibido ("Loba Essencial", "Loba Ativa", "Loba Rede") |
| `selo` | TEXT | Ex.: "para começar" |
| `cor` | TEXT | `rosa`, `azul`, `vermelho`, `ameixa` (vira .plano__selo--<cor>; ver identidade visual) |
| `preco_texto` | TEXT | Preço como texto, ex.: "R$ 19,90" (exibido antes de "/mês") |
| `beneficios` | TEXT | Um benefício por linha |
| `ordem` | NUMBER | Ordem de exibição |
| `destaque` | BOOLEAN | Plano em destaque (contorno azul) |
| `ativo` | BOOLEAN | Permite ocultar um plano sem apagar. O plano gratuito (Loba Livre) fica só no catálogo local — não é assinatura no Wix. |

### `conteudos`

| Campo | Tipo | Observação |
|---|---|---|
| `slug` | TEXT | URL da página |
| `titulo` | TEXT | |
| `categoria` | TEXT | Ex.: "Comece por aqui" |
| `resumo` | TEXT | Card |
| `plano` | TEXT | Plano mínimo: id do catálogo (`loba-essencial`, `loba-ativa` ou `loba-rede`), conferido por `temAcessoAoConteudo` (`src/lib/planos.ts`) |
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

`planos` e `conteudos` foram semeados com os dados provisórios que já
estavam no código (`src/lib/planos.ts` para planos) — nenhum dado novo
foi inventado. Os **textos/vídeos dos conteúdos vivem só no CMS**
(removidos do código em 04/11/2026); o catálogo dos planos (nomes,
preços, benefícios e níveis) vive em `src/lib/planos.ts`.
`depoimentos` e `inscricoes` estão **vazias** de propósito
(depoimentos reais virão de autorização da comunidade; inscrições são dados
pessoais). Preços e benefícios continuam no ar e no catálogo até as
sócias mudarem — mude no CMS e no catálogo juntos.

## Lendo o CMS pelo Astro

- **Catálogo público (planos):** `src/lib/planos.ts` chama
  `obterPlanosCms` de `src/lib/planoCms.ts` (tipo e leitura da coleção),
  sobre a query genérica de `src/lib/cms.ts`, usados por `/planos.html`
  e pela landing. O Astro lê no build; sem credenciais, usa token de
  visitante; no servidor, cai na chave de API (escopo elevado) como
  fallback.
- **Área de membros (conteudos):** `src/lib/membrosCms.ts` — o navegador
  lê com o **token de membro** da sessão Wix. O Wix recusa anônimos
  (`WDE0027`), então o conteúdo nunca chega ao bundle estático
  (`dist/`) e anônimos recebem HTTP 4xx do Wix. Verificado: as strings
  dos conteúdos e o ID do vídeo não aparecem em `dist`.

## Decisões de segurança (04/11/2026)

- O texto/vídeos dos conteúdos **não** são commitados nem entram no build.
- Em `npm run dev` existe a conta de demonstração (contas `*@teste.com`,
  trocadas pelo seletor DEV); **no build de produção esse módulo não entra
  no bundle**. O único "Entrar" no ar é o real.
- O conteúdo é placeholder (a comunidade paga ainda não lançou), mas a
  arquitetura já está correta para quando o valor existir.

## Pendências

- **Planos públicos**: feito. `/planos` já lê a coleção `planos` e só
  cai no catálogo local de `src/lib/planos.ts` quando o CMS falha ou
  está vazio.
  Falta alinhar os slugs da coleção com os ids do catálogo, se ainda
  houver valores antigos (`loba`, `matilha`, `alcateia`).
- **Plano do membro**: helper pronto (`src/lib/planoAssinatura.ts`), mas
  ainda sem planos publicados no Wix — todo membro real entra como
  `PLANO_MINIMO` (Loba Essencial) até lá
  (task "Configurar planos de assinatura no Wix").
- **Restrição de `video_url` por plano no servidor**: entrará junto com
  o deploy SSR (`../middleware-ssr`) ou com gate de URL no backend.
- OAuth e redirect URIs: prontos — ver `docs/AUTH.md`.
