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

`src/lib/auth/index.ts` é o ponto único para trocar o serviço de autenticação. Hoje a sessão, contas de teste, perfil e recuperação são simulados no navegador; o seletor de plano aparece apenas em desenvolvimento. A lista de planos e os conteúdos vêm de `src/lib/membros.ts`.

Antes de produção, integrar Wix Members e Pricing Plans, enviar e-mails reais de recuperação, implementar upload de foto e servir conteúdo somente pelo servidor depois de validar o plano. A guarda atual é client-side porque o mock usa `localStorage`; a proteção de rotas e conteúdo também precisa ser server-side/middleware na versão Wix. Não use dados locais ou a senha de demonstração como autenticação real.

## Para futura implementação: Videos de referencia que eu usei:

https://www.youtube.com/watch?v=jPNF_ICJ5uw

https://www.youtube.com/watch?v=vcacdiAPZ8g

## Documentação

https://support.wix.com/pt/article/fazendo-a-estrutura-do-banco-de-dados-funcionar-para-voc%C3%AA

https://support.wix.com/pt/article/cms-antigo-gerenciador-de-dados-trabalhar-com-cole%C3%A7%C3%B5es-de-aplicativos-wix

