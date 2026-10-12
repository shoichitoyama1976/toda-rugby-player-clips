export type MediaKind = "x" | "instagram" | "youtube" | "note" | "web";

const LABEL: Record<MediaKind, string> = {
  x: "X",
  instagram: "Instagram",
  youtube: "YouTube",
  note: "note",
  web: "サイト",
};

export function mediaKindFromUrl(url: string): MediaKind {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (host === "x.com" || host === "twitter.com" || host.endsWith(".x.com")) return "x";
    if (host === "instagram.com" || host.endsWith(".instagram.com")) return "instagram";
    if (host === "youtube.com" || host === "youtu.be" || host.endsWith(".youtube.com")) return "youtube";
    if (host === "note.com" || host.endsWith(".note.com")) return "note";
  } catch {
    if (/youtu\.be|youtube\.com/i.test(url)) return "youtube";
  }
  return "web";
}

export function dominantMediaKind(urls: string[]): MediaKind {
  const counts = new Map<MediaKind, number>();
  for (const url of urls) {
    const kind = mediaKindFromUrl(url);
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked[0];
  if (!top || (ranked[1] && ranked[1][1] === top[1])) return "web";
  return top[0];
}

export function MediaMark({ kind }: { kind: MediaKind }) {
  return (
    <span title={LABEL[kind]} className="inline-flex size-4 shrink-0 items-center justify-center text-foreground">
      <span className="sr-only">{LABEL[kind]}</span>
      {kind === "x" ? <XLogo /> : null}
      {kind === "instagram" ? <InstagramLogo /> : null}
      {kind === "youtube" ? <YouTubeLogo /> : null}
      {kind === "note" ? <NoteLogo /> : null}
      {kind === "web" ? <WebLogo /> : null}
    </span>
  );
}

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 fill-current">
      <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
    </svg>
  );
}

function InstagramLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 fill-current">
      <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.422-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.85.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.849.079-3.2042.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 7.027 1.44 1.44 0 0 0 16.953 5.5864M12.012 7.0226c-2.7543 0-4.987 2.2317-4.987 4.9868 0 2.7548 2.2327 4.987 4.987 4.987 2.754 0 4.9868-2.2322 4.9868-4.987 0-2.7551-2.2328-4.9868-4.9868-4.9868m0 8.2218c-1.786 0-3.235-1.4486-3.235-3.235 0-1.7864 1.449-3.235 3.235-3.235 1.7862 0 3.2348 1.4486 3.2348 3.235 0 1.7864-1.4486 3.235-3.2348 3.235" />
    </svg>
  );
}

function YouTubeLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 fill-current">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8zM9.75 15.57V8.43L15.84 12l-6.09 3.57z" />
    </svg>
  );
}

function NoteLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 fill-current">
      <path d="M0 .279c4.623 0 10.953-.235 15.498-.117 6.099.156 8.39 2.813 8.468 9.374.077 3.71 0 14.335 0 14.335h-6.598c0-9.296.04-10.83 0-13.759-.078-2.578-.814-3.807-2.795-4.041-2.097-.235-7.975-.04-7.975-.04v17.84H0Z" />
    </svg>
  );
}

function WebLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 fill-none stroke-current">
      <circle cx="12" cy="12" r="9" strokeWidth="2" />
      <path d="M3 12h18M12 3c2.5 2.8 3.8 6 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-6-3.8-9S9.5 5.8 12 3z" strokeWidth="2" />
    </svg>
  );
}
