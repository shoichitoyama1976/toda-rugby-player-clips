export const GA_MEASUREMENT_ID = "G-TSMFQDLSNW";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackReadOriginal(url: string, title = "") {
  if (typeof window === "undefined" || !window.gtag) return;
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    host = "";
  }
  window.gtag("event", "read_original", {
    link_url: url,
    link_domain: host,
    article_title: title.slice(0, 100),
    outbound: true,
  });
}
