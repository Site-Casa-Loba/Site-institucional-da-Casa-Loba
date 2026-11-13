import { defineConfig } from "astro/config";
import wix from "@wix/astro";
import wixHostingAdapter from "@wix/astro-wix-hosting-adapter";

// Build híbrido publicado no Wix Headless como "Wix Astro build" (server-
// rendered): as páginas continuam pré-renderizadas como antes, e rotas com
// `prerender = false` (ex.: o webhook da Ticto) rodam no servidor do Wix.
// A integração @wix/astro gera os metadados exigidos pelo release
// (.wix/build-metadata.json + dist/_wix/app-manifest.json). O deploy deixa
// de ser drop estático — ver docs/AUTH.md e o workflow.
// O host serve os arquivos literalmente e não resolve `pasta/index.html`
// em `/pasta`: por isso geramos `pagina.html` e linkamos para esse caminho.
export default defineConfig({
  site: "https://www.casaloba.com.br",
  output: "static",
  integrations: [wix()],
  adapter: wixHostingAdapter(),
  build: {
    format: "file",
    // Saída híbrida com o client na raiz de dist/ (index.html em dist/) —
    // caminhos relativos ao outDir; o bundle server fica em dist/server.
    client: ".",
    server: "./server",
  },
});
