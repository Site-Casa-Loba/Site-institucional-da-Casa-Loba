/**
 * Publica o build do site no Wix Headless como "Wix Astro build"
 * (server-rendered): páginas pré-renderizadas + rotas on-demand
 * (src/pages/api, ex.: /api/webhooks/ticto) rodando no worker do Wix.
 *
 * Por que este script existe: nem o drop estático nem o `wix release` do CLI
 * servem — ambos publicam só arquivos e derrubam o worker (o webhook volta a
 * 404). O release correto passa pela ferramenta UploadHeadlessWebsiteFiles do
 * Wix MCP (https://mcp.wix.com/mcp), autenticado com a chave de API da conta —
 * o que este script faz, para rodar no GitHub Actions ou na sua máquina.
 *
 * Pré-requisitos: `npm run build` rodado antes (dist/ + .wix/build-metadata.json).
 *
 * Variáveis de ambiente:
 *   WIX_API_KEY    — chave de API da conta Wix (aceita WIX_API_TOKEN também;
 *                    obrigatória; nunca versionar)
 *   WIX_ACCOUNT_ID — id da conta Wix (obrigatório)
 *   WIX_SITE_ID    — metaSiteId do site (padrão: o site da Casa Loba)
 *
 * Run: node scripts/wix-release.mjs
 */
import { execSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const MCP_URL = "https://mcp.wix.com/mcp";
const SITE_ID =
  process.env.WIX_SITE_ID ?? "5542fcdd-bc0a-4731-aa1b-6fa3c00f8082";
const API_KEY = process.env.WIX_API_KEY ?? process.env.WIX_API_TOKEN;
const ACCOUNT_ID = process.env.WIX_ACCOUNT_ID;
const NOTES =
  process.env.WIX_RELEASE_NOTES ?? `release ${process.env.GITHUB_SHA ?? "local"}`;

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const ZIP_PATH = "/tmp/casaloba-wix-release.zip";

// A Cloudflare na frente do MCP bloqueia user-agents de biblioteca; manda um
// user-agent próprio.
const HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json, text/event-stream",
  "User-Agent": "casaloba-ci/1.0 (+github-actions)",
};

function falha(mensagem) {
  console.error(`wix-release: ${mensagem}`);
  process.exit(1);
}

if (!API_KEY || !ACCOUNT_ID) {
  falha(
    "defina WIX_API_KEY e WIX_ACCOUNT_ID no ambiente (no CI, via secrets).",
  );
}

for (const caminho of ["dist/index.html", "dist/_wix/app-manifest.json", ".wix/build-metadata.json"]) {
  if (!existsSync(join(ROOT, caminho))) {
    falha(`${caminho} não existe — rode \`npm run build\` antes.`);
  }
}

// Zipa só o que o release consome: dist/ (sem source maps — o worker não usa)
// e .wix/build-metadata.json. Menos de ~1 MB sobe com folga.
execSync(
  `rm -f ${ZIP_PATH} && cd ${JSON.stringify(ROOT)} && zip -qr ${ZIP_PATH} dist .wix -x "*.map"`,
  { stdio: "inherit" },
);
const size = statSync(ZIP_PATH).size;
console.log(`wix-release: bundle ${ZIP_PATH} (${size} bytes)`);

let sessionId = null;
let rpcId = 0;

async function rpc(method, params, timeoutMs = 300_000) {
  const id = ++rpcId;
  const resposta = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      ...HEADERS,
      Authorization: API_KEY,
      "wix-account-id": ACCOUNT_ID,
      ...(sessionId ? { "mcp-session-id": sessionId } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const sid = resposta.headers.get("mcp-session-id");
  if (sid) sessionId = sid;
  const texto = await resposta.text();
  if (!resposta.ok) {
    falha(`MCP ${method} respondeu HTTP ${resposta.status}: ${texto.slice(0, 300)}`);
  }
  // O servidor responde SSE (linhas "data: {...}"); pegue o último evento.
  let mensagem = null;
  for (const linha of texto.split("\n")) {
    if (linha.startsWith("data:")) mensagem = JSON.parse(linha.slice(5).trim());
  }
  if (!mensagem) mensagem = JSON.parse(texto);
  if (mensagem.error) {
    falha(`MCP ${method} erro: ${JSON.stringify(mensagem.error).slice(0, 300)}`);
  }
  return mensagem.result;
}

// Notificações JSON-RPC não têm id nem resposta.
async function notify(method, params = {}) {
  await fetch(MCP_URL, {
    method: "POST",
    headers: {
      ...HEADERS,
      Authorization: API_KEY,
      "wix-account-id": ACCOUNT_ID,
      ...(sessionId ? { "mcp-session-id": sessionId } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", method, params }),
    signal: AbortSignal.timeout(30_000),
  }).catch(() => {});
}

async function tool(nome, args, timeoutMs) {
  const result = await rpc(
    "tools/call",
    { name: nome, arguments: args },
    timeoutMs,
  );
  return (result.content ?? []).map((c) => c.text ?? "").join("\n");
}

// 1. Sessão MCP
const init = await rpc("initialize", {
  protocolVersion: "2025-03-26",
  capabilities: {},
  clientInfo: { name: "casaloba-ci", version: "1.0" },
});
console.log(`wix-release: MCP ${init.serverInfo?.name ?? "wix"} ok`);
await notify("notifications/initialized");

// 2. Prepare — devolve a URL assinada de upload e o uploadKey
const prepare = await tool("UploadHeadlessWebsiteFiles", {
  siteId: SITE_ID,
  prepare: true,
  size,
  agentIdentity: "casaloba GitHub Actions CI (wix-release.mjs)",
  reason: `Release server-rendered do site Casa Loba (${NOTES}).`,
});
if (!prepare.includes("Upload URLs ready")) {
  falha(`prepare recusado: ${prepare.slice(0, 300)}`);
}
const uploadUrl = prepare.match(/"(https:\/\/s3-buckets-headless-templates[^"]+)"/)?.[1];
const uploadKey = prepare.match(/"uploadKey":"([^"]+)"/)?.[1]
  ?? prepare.match(/\{"siteId":"[^"]+","uploadKey":"([^"]+)"\}/)?.[1];
if (!uploadUrl || !uploadKey) {
  falha(`não achei URL/uploadKey no prepare: ${prepare.slice(0, 400)}`);
}

// 3. Upload do bundle no S3
const bundle = await import("node:fs/promises").then((fs) => fs.readFile(ZIP_PATH));
const put = await fetch(uploadUrl, {
  method: "PUT",
  headers: { "Content-Type": "application/zip", "Content-Length": String(size) },
  body: bundle,
  signal: AbortSignal.timeout(300_000),
});
if (!put.ok) {
  falha(`upload S3 respondeu HTTP ${put.status}: ${(await put.text()).slice(0, 300)}`);
}
console.log("wix-release: bundle enviado");

// 4. Release
const release = await tool(
  "UploadHeadlessWebsiteFiles",
  {
    siteId: SITE_ID,
    uploadKey,
    agentIdentity: "casaloba GitHub Actions CI (wix-release.mjs)",
    reason: `Release server-rendered do site Casa Loba (${NOTES}).`,
  },
  600_000,
);
if (!/Released|live/i.test(release)) {
  falha(`release recusado: ${release.slice(0, 400)}`);
}
console.log(release.split("\n").slice(0, 4).join("\n"));
console.log("wix-release: site publicado.");
