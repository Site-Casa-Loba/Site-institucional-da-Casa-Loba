> **Nota:** este documento descreve a conta de demonstração, que funciona só em `npm run dev` (seletor DEV no canto da área de membros). No build de produção o login é o real do site e o módulo de demonstração não entra no bundle. Veja `docs/AUTH.md` e `docs/CMS.md`.

# Conta de demonstração

## Usuárias de teste

Não há senha. Na página `/entrar.html`, o bloco "Conta de demonstração (DEV)"
cria a sessão com um clique; dentro da área de membros, o seletor flutuante
"Trocar plano (DEV)" troca a conta logada. Em produção nada disso aparece.

| E-mail | Plano |
|---|---|
| `lobaessencial@teste.com` | Loba Essencial|
| `lobaativa@teste.com` | Loba Ativa |
| `lobarede@teste.com` | Loba Rede |

Sessão, troca de conta e alterações de perfil ficam no `localStorage` deste navegador.

## Rotas

No host do Wix Headless, as páginas são servidas como arquivos `.html`; use o sufixo nos links.

- `/entrar.html` — login e retorno ao destino solicitado por `?redirect=`
- `/membros.html` — conteúdos liberados e conteúdos de outros planos
- `/membros/[slug].html` — conteúdo ou tela de bloqueio conforme o plano
- `/membros/perfil.html` — edição de nome e URL da foto, plano e saída

## Mock e próximos passos para produção

`src/lib/auth/index.ts` já combina o login real do Wix com o mock local
(só em `npm run dev`): a sessão real tem precedência, o mock cai em
segundo lugar; o seletor de plano aparece apenas em desenvolvimento.
A lista de planos vem de `src/lib/planos.ts`; os conteúdos vêm do CMS
(`src/lib/membrosCms.ts`).

Antes de produção (estado atual): o login real do Wix está no ar (ver
`docs/AUTH.md`); o mock só existe em `npm run dev`. Restam como
pendências: planos de assinatura publicados no Wix (Pricing Plans, com
o helper `src/lib/planoAssinatura.ts` já pronto), e-mails reais de
recuperação, upload de foto e — se um dia houver conteúdo pago de
verdade — servir conteúdo só pelo servidor (`../middleware-ssr`). A
guarda atual é client-side porque o deploy é estático; não usar a
senha de demonstração como autenticação em produção.

## Para futura implementação: Videos de referencia que eu usei:

https://www.youtube.com/watch?v=jPNF_ICJ5uw

https://www.youtube.com/watch?v=vcacdiAPZ8g

## Documentação

https://support.wix.com/pt/article/fazendo-a-estrutura-do-banco-de-dados-funcionar-para-voc%C3%AA

https://support.wix.com/pt/article/cms-antigo-gerenciador-de-dados-trabalhar-com-cole%C3%A7%C3%B5es-de-aplicativos-wix

