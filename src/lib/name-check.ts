import { createServerFn } from "@tanstack/react-start";
import { foldName, resolveCatalog } from "./catalog";
import type { Article } from "@/data/types";

export type NameCheckStatus = "idle" | "running" | "done";
export type NameCheckResult = "all" | "partial" | "none" | "skip" | "error";

export type NameCheckItem = {
  url: string;
  title: string;
  names: string[];
  result: NameCheckResult;
  found: string[];
  missing: string[];
  error?: string;
};

export type NameCheckSnapshot = {
  status: NameCheckStatus;
  sheetHash: string;
  checkedAt: number | null;
  items: NameCheckItem[];
};

const SKIP_HOSTS = new Set([
  "x.com",
  "twitter.com",
  "www.twitter.com",
  "mobile.twitter.com",
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "instagram.com",
  "www.instagram.com",
  "facebook.com",
  "www.facebook.com",
]);

type NameCheckStore = {
  snapshot: NameCheckSnapshot;
  runningFor: string;
};

const store: NameCheckStore = ((globalThis as { __todaNameCheck?: NameCheckStore }).__todaNameCheck ??= {
  snapshot: {
    status: "idle",
    sheetHash: "",
    checkedAt: null,
    items: [],
  },
  runningFor: "",
});
(globalThis as { __todaNameCheck?: NameCheckStore }).__todaNameCheck = store;

const CHECK_VERSION = 2;

function sheetHash(csv: string, playersCsv: string | null): string {
  const source = `${csv}\0${playersCsv ?? ""}`;
  let hash = 2166136261;
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${CHECK_VERSION}:${(hash >>> 0).toString(16)}:${source.length}`;
}

function fingerprint(url: string, names: string[]): string {
  return `${url}\0${[...names].sort().join("\t")}`;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&/gi, "&")
    .replace(/</gi, "<")
    .replace(/>/gi, ">")
    .replace(/"/gi, '"')
    .replace(/&#39;/gi, "'");
}

async function fetchArticleText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: {
        accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return htmlToText(text);
  } finally {
    clearTimeout(timer);
  }
}

function matchNames(names: string[], text: string): { found: string[]; missing: string[] } {
  const body = foldName(text);
  const found: string[] = [];
  const missing: string[] = [];
  for (const name of names) {
    const key = foldName(name);
    if (!key) continue;
    if (body.includes(key)) found.push(name);
    else missing.push(name);
  }
  return { found, missing };
}

async function checkOne(article: Article, previous?: NameCheckItem): Promise<NameCheckItem> {
  const names = [...new Set(article.playerNames.filter(Boolean))];
  const base: NameCheckItem = {
    url: article.url,
    title: article.title,
    names,
    result: "skip",
    found: [],
    missing: [],
  };
  if (!/^https?:\/\//i.test(article.url) || names.length === 0) {
    return { ...base, result: "skip" };
  }
  if (previous && fingerprint(previous.url, previous.names) === fingerprint(article.url, names) && previous.result !== "error") {
    return { ...previous, title: article.title };
  }
  if (SKIP_HOSTS.has(hostOf(article.url))) {
    return { ...base, result: "skip" };
  }
  try {
    const text = `${await fetchArticleText(article.url)} ${article.title}`;
    const { found, missing } = matchNames(names, text);
    const result: NameCheckResult = missing.length === 0 ? "all" : found.length > 0 ? "partial" : "none";
    return { ...base, result, found, missing };
  } catch (error) {
    return {
      ...base,
      result: "error",
      error: error instanceof Error ? error.message : "取得できませんでした",
    };
  }
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      out[current] = await fn(items[current]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) || 0 }, () => worker()));
  return out;
}

async function runCheck(hash: string, csv: string, playersCsv: string | null) {
  const { articles } = resolveCatalog(csv, playersCsv);
  const previous = new Map(store.snapshot.items.map((item) => [fingerprint(item.url, item.names), item]));
  const items = await mapPool(articles, 4, (article) => {
    const names = [...new Set(article.playerNames.filter(Boolean))];
    return checkOne(article, previous.get(fingerprint(article.url, names)));
  });
  if (store.runningFor !== hash) return;
  store.snapshot = {
    status: "done",
    sheetHash: hash,
    checkedAt: Date.now(),
    items,
  };
  store.runningFor = "";
}

export function scheduleNameCheck(csv: string, playersCsv: string | null) {
  const hash = sheetHash(csv, playersCsv);
  if (!csv.trim()) return;
  if (store.snapshot.sheetHash === hash && (store.snapshot.status === "done" || store.snapshot.status === "running")) return;
  if (store.runningFor === hash) return;
  store.runningFor = hash;
  store.snapshot = {
    ...store.snapshot,
    status: "running",
    sheetHash: hash,
  };
  void runCheck(hash, csv, playersCsv);
}

export const loadNameCheck = createServerFn({ method: "GET" }).handler(async () => store.snapshot);
