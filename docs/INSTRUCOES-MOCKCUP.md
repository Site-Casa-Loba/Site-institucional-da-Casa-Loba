> **Nota (04/11/2026):** este documento descreve o mock local, que funciona só em `npm run dev`. No build de produção o login é o real do site — veja `docs/AUTH.md` e `docs/CMS.md`. As contas `*@teste.com` não entram no ar.

# Mock da área de membros

## Usuárias de teste

Todas usam a senha fixa de demonstração `casaloba123`:

| E-mail | Plano |
|---|---|
| `loba@teste.com` | Loba |
| `matilha@teste.com` | Matilha |
| `alcateia@teste.com` | Alcateia |

O mock não guarda senhas. Sessão, cadastro e alterações de perfil ficam no `localStorage` do navegador. Cadastros novos começam no plano Loba.

## Rotas

No host do Wix Headless, as páginas são servidas como arquivos `.html`; use o sufixo nos links.

- `/cadastro.html` — cadastro local
- `/entrar.html` — login e retorno ao destino solicitado por `?redirect=`
- `/recuperar-senha.html` — confirmação genérica de recuperação
- `/redefinir-senha.html?token=demo` — formulário demonstrativo de redefinição
- `/membros.html` — conteúdos liberados e conteúdos de outros planos
- `/membros/[slug].html` — conteúdo ou tela de bloqueio conforme o plano
- `/membros/perfil.html` — edição de nome e URL da foto, plano e saída

## Mock e próximos passos para produção

`src/lib/auth/index.ts` já combina o login real do Wix com o mock local
(só em `npm run dev`): a sessão real tem precedência, o mock cai em
segundo lugar; o seletor de plano aparece apenas em desenvolvimento.
A lista de planos vem de `src/lib/membros.ts`; os conteúdos vêm do CMS
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

