import { defineConfig } from "astro/config";

// Build 100% estático: o Wix Headless publica dist/ via drop
// (.github/workflows/deploy.yml). O middleware SSR (não usado no ar)
// foi movido para ../middleware-ssr — ver o README lá.
// O host serve os arquivos literalmente e não resolve `pasta/index.html`
// em `/pasta`: por isso geramos `pagina.html` e linkamos para esse caminho.
export default defineConfig({
  site: "https://www.casaloba.com.br",
  build: {
    format: "file",
  },
});
