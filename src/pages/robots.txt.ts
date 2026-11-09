import type { APIRoute } from "astro";

// Gera /robots.txt no build. O endereço do sitemap vem de `site` em astro.config.mjs,
// então o domínio fica em um lugar só.
//
// As páginas que não devem aparecer no Google (membros, entrar, termos)
// usam <meta name="robots" content="noindex">. Elas NÃO são bloqueadas aqui de
// propósito: se o robô for impedido de abrir a página, ele não lê o noindex.
export const GET: APIRoute = ({ site }) => {
  if (!site) {
    throw new Error("Defina `site` em astro.config.mjs para gerar o robots.txt.");
  }

  const corpo = [
    "User-agent: *",
    "Allow: /",
    // Retorno técnico do login (OAuth). Não tem conteúdo para indexar.
    "Disallow: /auth/",
    "",
    `Sitemap: ${new URL("sitemap.xml", site).href}`,
    "",
  ].join("\n");

  return new Response(corpo, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};