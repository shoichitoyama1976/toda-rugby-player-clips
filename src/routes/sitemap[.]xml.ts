import { createFileRoute } from "@tanstack/react-router";
import { loadPublicSheet } from "@/lib/load-sheet";
import { catalogFromSheetData, escapeXml, requestOrigin } from "@/lib/seo";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = requestOrigin(request);
        const sheet = await loadPublicSheet();
        const { players } = catalogFromSheetData({ sheet });
        const urls = [
          `${origin}/`,
          `${origin}/players`,
          ...players.filter((player) => !player.unlisted).map((player) => `${origin}/players/${player.slug}`),
        ];
        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (loc) => `  <url>
    <loc>${escapeXml(loc)}</loc>
    <changefreq>weekly</changefreq>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
        return new Response(body, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=300",
          },
        });
      },
    },
  },
});
