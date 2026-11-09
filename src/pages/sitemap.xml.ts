import type { APIRoute } from "astro";

// Páginas públicas que devem aparecer no Google. Ao criar uma página nova para
// ser encontrada na busca, adicione o caminho aqui (e não use `noindex` nela).
//
// Ficam de fora de propósito: /entrar.html, /membros/*, termos de uso e política 
// de privacidade (minutas, com noindex), /pre-inscricao.html
const PAGINAS = ["/", "/planos.html"];

export const GET: APIRoute = ({ site }) => {
  if (!site) {
    throw new Error("Defina `site` em astro.config.mjs para gerar o sitemap.xml.");
  }

  const urls = PAGINAS.map(
    (caminho) => `  <url>\n    <loc>${new URL(caminho, site).href}</loc>\n  </url>`,
  ).join("\n");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};