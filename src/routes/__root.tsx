import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { GoogleAnalytics } from "@/components/google-analytics";
import { SiteShell } from "@/components/site-shell";
import { loadPublicSheet } from "@/lib/load-sheet";
import { loadPlayerNotices } from "@/lib/profile-requests";
import { loadRequestOrigin } from "@/lib/seo";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";
import appCss from "../styles.css?url";

const APP_NAME = "戸田ラグビー選手記事帖";

export const Route = createRootRoute({
  loader: async () => {
    const [sheet, notices, origin] = await Promise.all([
      loadPublicSheet(),
      loadPlayerNotices().catch(() => []),
      loadRequestOrigin().catch(() => ""),
    ]);
    return {
      sheet,
      origin,
      notices,
    };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "戸田のラグビー選手が登場した記事を、選手や媒体ごとにたどる非公式の一覧です。本文は転載しません。",
      },
      { name: "theme-color", content: "#0c1018" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        async: true,
        src: `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`,
      },
      {
        children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`,
      },
    ],
  }),
  component: () => (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        <PreviewHostBridge />
        <GoogleAnalytics />
        <AuthProvider>
          <SiteShell>
            <Outlet />
          </SiteShell>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
