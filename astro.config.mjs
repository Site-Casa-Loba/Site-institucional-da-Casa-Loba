import { defineConfig } from "astro/config";

// Build 100% estático: o Wix Headless publica dist/ via drop
// (.github/workflows/deploy.yml). O middleware SSR (não usado no ar)
// foi movido para ../middleware-ssr — ver o README lá.
// O host serve os arquivos literalmente e não resolve `pasta/index.html`
// em `/pasta`: por isso geramos `pagina.html` e linkamos para esse caminho.
export default defineConfig({
  // o domínio fica só aqui, quando ganhar domínio próprio, trocar essa linha
  site: "https://headless-urlsttluzfw-arthursoares1234-1410.wix-site-host.com",
  build: {
    format: "file",
  },
});
