import { defineConfig } from "astro/config";
import node from "@astrojs/node";

/**
 * Build estático por padrão (o Wix Headless publica dist/client como
 * arquivos estáticos, via .github/workflows/deploy.yml).
 *
 * O adapter Node fica sempre configurado para que as rotas server-rendered
 * (/api/auth/*, prerender = false) compilem no build estático — elas ficam
 * em dist/server e NÃO são publicadas; só passam a responder quando o site
 * for servido por um servidor Node. Com ASTRO_OUTPUT=server, o build gera
 * o site inteiro em SSR (middleware de sessão ativo, dist/client + dist/server).
 */
const ssr = process.env.ASTRO_OUTPUT === "server";

export default defineConfig({
  // O host do Wix Headless serve os arquivos literalmente e não resolve
  // `pasta/index.html` em `/pasta`. Geramos `pagina.html` e linkamos para
  // esse caminho, que funciona em qualquer host estático.
  build: {
    format: "file",
  },
  output: ssr ? "server" : "static",
  adapter: node({ mode: "standalone" }),
});
