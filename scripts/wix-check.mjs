/**
 * Confere se o site publicado está igual ao build local.
 *
 * Compara, arquivo por arquivo, o `dist/` com o que está no ar no site Wix
 * Headless (o mesmo endereço que recebe o deploy do GitHub Actions).
 * Rode `npm run build` antes.
 *
 * Run with: npm run wix:check
 *
 * Variáveis (opcionais, vêm do .env): WIX_SITE_URL, CHECK_RETRIES.
 * Sai com código 1 se algum arquivo estiver diferente — é isso que o workflow
 * usa para falhar o deploy quando a publicação não chegou ao ar.
 */
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = (
  process.env.WIX_SITE_URL ??
  "https://headless-urlsttluzfw-arthursoares1234-1410.wix-site-host.com"
).replace(/\/+$/, "");

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const RETRIES = Number(process.env.CHECK_RETRIES ?? 5);

// O Wix injeta este script em todo HTML servido; ele não faz parte do build.
const WIX_INJECTED_SCRIPT =
  /<script id="wix-site-script"[^>]*><\/script>/g;

const sha256 = (data) => createHash("sha256").update(data).digest("hex");

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const full = join(dir, entry.name);
      return entry.isDirectory() ? listFiles(full) : [full];
    }),
  );
  return files.flat();
}

function normalize(path, body) {
  const text = body.toString("utf8");
  return path.endsWith(".html") ? text.replace(WIX_INJECTED_SCRIPT, "") : text;
}

async function fetchLive(path) {
  const response = await fetch(`${SITE_URL}/${path}?check=${Date.now()}`);
  if (!response.ok) return { ok: false, status: response.status };
  return { ok: true, body: Buffer.from(await response.arrayBuffer()) };
}

const files = await listFiles(DIST);

if (files.length === 0) {
  console.error("dist/ está vazio. Rode `npm run build` antes.");
  process.exit(1);
}

const results = [];

for (const file of files) {
  const path = relative(DIST, file).split(sep).join("/");

  // O Wix serve a própria página de 404 em /404.html, então o arquivo do
  // build nunca chega ao ar. Ele é o único que não deve ser comparado.
  if (path === "404.html") {
    results.push({ path, status: "ignorado (404 do Wix)", ok: true });
    continue;
  }

  const expected = normalize(path, await readFile(file));

  let live = await fetchLive(path);
  let attempts = 1;

  // O CDN pode levar alguns segundos para servir a versão recém-publicada.
  while (attempts < RETRIES && (!live.ok || normalize(path, live.body) !== expected)) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    live = await fetchLive(path);
    attempts += 1;
  }

  if (!live.ok) {
    results.push({ path, status: `HTTP ${live.status}`, ok: false });
    continue;
  }

  const matches = normalize(path, live.body) === expected;
  results.push({ path, status: matches ? "igual" : "diferente", ok: matches });
}

const mismatches = results.filter((r) => !r.ok);

console.log(`Site: ${SITE_URL}`);
console.log("");
for (const { path, status } of results) {
  console.log(`${status.padEnd(10)} ${path}`);
}
console.log("");

if (mismatches.length > 0) {
  console.error(
    `${mismatches.length} arquivo(s) fora de sincronia. O deploy não chegou ao ar.`,
  );
  process.exit(1);
}

console.log("Site publicado igual ao build local.");
