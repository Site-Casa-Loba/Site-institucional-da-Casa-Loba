import { defineConfig } from "astro/config";

export default defineConfig({
  // O host do Wix Headless serve os arquivos literalmente e não resolve
  // `pasta/index.html` em `/pasta`. Geramos `pagina.html` e linkamos para
  // esse caminho, que funciona em qualquer host estático.
  build: {
    format: "file",
  },
});
