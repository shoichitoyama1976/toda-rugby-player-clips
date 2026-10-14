/** 404 または 410 だけを入れる。到達できないだけのサイトは入れない。2026-10-14 の確認では該当なし。 */
export const BROKEN_ARTICLE_URLS: string[] = [];

function linkKey(url: string): string {
  try {
    const parsed = new URL(url.trim());
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url.trim();
  }
}

const BROKEN = new Set(BROKEN_ARTICLE_URLS.map(linkKey));

export function isBrokenArticleUrl(url: string): boolean {
  return BROKEN.has(linkKey(url));
}
