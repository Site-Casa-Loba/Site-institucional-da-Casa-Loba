# Identidade visual da Casa Loba

Sistema de design da marca. Os tokens abaixo ficam em `src/styles/` e devem ser usados no lugar de valores literais no código.

## Cores

| Variável | Hex | Uso |
|---|---|---|
| `--vermelho` | `#DA4D3F` | Cor principal, destaques, botão principal |
| `--rosa` | `#F5A9B8` | Selos, tags, seção "para quem é" |
| `--creme` | `#FDF1EA` | Fundo padrão das páginas |
| `--agua` | `#CAF5F7` | Fundo da seção de planos e detalhes |
| `--azul` | `#2B4FE8` | Plano em destaque, botão azul |
| `--ameixa` | `#2B1C2E` | Texto, seções escuras, rodapé |
| `--bordo` | `#470E31` | Fundo escuro da página de Planos |
| (branco) | `#FFFFFF` | Fundo de cards, texto sobre azul |

Regras:
- Texto padrão: `--ameixa` sobre `--creme`. Em seções com fundo `--ameixa`, texto em `--creme`.
- Fundo `--rosa`: não usar botão vermelho. Usar botão ameixa.
- Texto secundário: mesma cor do texto principal com opacidade entre 0.7 e 0.9. Não criar cor de cinza.

## Tipografia

| Função | Fonte | Pesos | Variável |
|---|---|---|---|
| Títulos, botões, menu, tags, preços | Outfit | 400, 600, 700, 800 | `--font-titulo` |
| Texto corrido | Nunito | 400, 600, 700 | `--font-corpo` |

Fontes via Google Fonts, com `sans-serif` como fallback.

- Corpo: 18px, `line-height: 1.6`.
- `h1`–`h3`: Outfit 800, `line-height: 1.1`, `letter-spacing: -0.02em`. Tamanho fluido com `clamp()`: `clamp(2rem, 4vw, 3rem)` em títulos de seção; `clamp(3rem, 7vw, 5.5rem)` no hero.
- Tags e selos: Outfit 600–700, `text-transform: lowercase`, `letter-spacing: 0.1em` a `0.12em`.
- Botões: Outfit 700, 1rem.
- Nomes de plano em minúsculas.

## Formas e espaçamento

| Variável | Valor | Uso |
|---|---|---|
| `--raio` | `32px` | Cards e planos |
| `--capsula` | `999px` | Botões, tags e selos |
| `--container` | `1120px` | Largura máxima do conteúdo |
| `--gap` | `32px` | Espaço entre cards e colunas |

- Padding vertical das seções: `120px`. Hero: `140px` acima, `100px` abaixo.
- Margem lateral do conteúdo: `24px`.
- Breakpoints: `860px` (tablet) e `560px` (celular). No celular, botões ocupam largura total.

## Componentes

- **Botões:** variantes `vermelho`, `azul`, `rosa`, `ameixa` e `ghost` (contorno ameixa, fundo transparente). Tamanhos: normal, pequeno e largura total. `padding: 14px 28px`; no hover, `translateY(-2px)`.
- **Tags:** cápsula com fundo rosa, ou contorno ameixa de `1.5px` com fundo transparente.
- **Cards:** fundo branco, `border-radius: 32px`, `padding: 40px 32px`; no hover, `translateY(-4px)`. Cada card inicia com um arco colorido de `80px` (vermelho, azul ou água).
- **Planos:** fundo creme, `border-radius: 32px`. Plano em destaque: fundo branco e contorno azul de `3px`. Selo em cápsula: rosa (inicial), azul (destaque), vermelho (maior).
- **Menu:** fixo no topo, transparente no início. Após `40px` de scroll: fundo creme e `border-bottom` de `1px`.

## Arcos decorativos

Semicírculos vermelhos, medidos em diâmetro:
- Hero: arco no canto inferior direito de `520px` e arco invertido no canto superior esquerdo de `400px`. Reduzir nos breakpoints de tablet e celular.
- Cards das frentes: arco pequeno no topo.
- Foto da seção "para quem é": moldura com topo em arco, raio de `180px`.
- Ornamento "Uivo": três arcos concêntricos em água e rosa, posicionados antes do manifesto.

## Logo

SVG da loba uivando em `#DA4D3F`, em `public/`. No menu, aparece entre as palavras **casa** e **loba**, em Outfit 800 minúsculo. Usar sempre o SVG original: não recolorir, não distorcer.

## Tom de voz

Frases curtas, em minúsculas nos títulos de destaque, com tratamento direto ("você"). Slogan provisório: **"rede de apoio é estrutura"**.
