import { createFileRoute } from "@tanstack/react-router";
import { requestOrigin } from "@/lib/seo";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = requestOrigin(request);
        const body = `User-agent: *
Allow: /
Disallow: /inbox
Disallow: /saved

Sitemap: ${origin}/sitemap.xml
`;
        return new Response(body, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "public, max-age=300",
          },
        });
      },
    },
  },
});
