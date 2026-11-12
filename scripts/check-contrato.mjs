/**
 * Impede divergência silenciosa entre src/lib/auth/contrato.ts e
 * public/auth/callback.html (que não pode importar do bundle).
 * Falha se qualquer literal do contrato mudar num lugar sem o outro.
 *
 * Run: node scripts/check-contrato.mjs   (também roda no `npm run check`)
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const contrato = readFileSync(
  fileURLToPath(new URL("../src/lib/auth/contrato.ts", import.meta.url)),
  "utf8",
);
const callback = readFileSync(
  fileURLToPath(new URL("../public/auth/callback.html", import.meta.url)),
  "utf8",
);

function extrair(fonte, nome) {
  const m = fonte.match(new RegExp(`${nome} = "([^"]+)"`));
  if (!m) throw new Error(`não achei ${nome} em src/lib/auth/contrato.ts`);
  return m[1];
}

const chaveSessao = extrair(contrato, "CHAVE_SESSAO_WIX");
const chaveOauth = extrair(contrato, "CHAVE_OAUTH");
const retornoPadrao = extrair(contrato, "RETORNO_PADRAO");
const caminhoCallback = extrair(contrato, "CAMINHO_CALLBACK");

let ok = true;

const idNoCallback = callback.match(/var CLIENT_ID = "([^"]+)"/)?.[1];
if (!idNoCallback) {
  console.error("contrato divergiu: callback.html não declara CLIENT_ID.");
  ok = false;
}
const idNoAmbiente = process.env.PUBLIC_WIX_CLIENT_ID;
if (idNoCallback && idNoAmbiente && idNoCallback !== idNoAmbiente) {
  console.error(
    `contrato divergiu: CLIENT_ID do callback (${idNoCallback}) difere do PUBLIC_WIX_CLIENT_ID do ambiente.`,
  );
  ok = false;
}

const regras = [
  [chaveSessao, "chave de sessão (`casaloba_session`)"],
  [chaveOauth, "chave do fluxo OAuth (`casaloba_oauth`)"],
  [retornoPadrao, "retorno padrão (`/membros.html`)"],
  [`CAMINHO_CALLBACK = "${caminhoCallback}"`, "caminho do callback (`/auth/callback.html`)"],
];

for (const [literal, rotulo] of regras) {
  if (!callback.includes(literal)) {
    console.error(`contrato divergiu: callback.html não contém ${rotulo}.`);
    ok = false;
  }
}
if (!callback.includes('charAt(1) !== "/"')) {
  console.error('contrato divergiu: callback.html perdeu a regra de destino seguro ("//" não vale).');
  ok = false;
}
if (!ok) process.exit(1);
console.log("contrato auth: contrato.ts e callback.html em sintonia.");
