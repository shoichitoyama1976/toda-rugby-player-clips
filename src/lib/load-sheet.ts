import { createServerFn } from "@tanstack/react-start";
import { ARTICLE_TAB_NAMES, PLAYER_TAB_NAMES } from "@/data/types";
import { PUBLIC_SHEET_URL, SHEET_CACHE_MS } from "@/data/sheet-config";
import { classifyCsv } from "./catalog";
import { scheduleNameCheck } from "./name-check";
import {
  csvExportByGid,
  gidsFromUrl,
  gvizCsvUrl,
  isAllowedSheetUrl,
  spreadsheetIdFromUrl,
  toCsvExportUrl,
} from "./sheet-url";

export type SheetLoadResult =
  | { ok: true; csv: string; playersCsv: string | null; configured: true; fetchedAt: number }
  | { ok: false; configured: false; error: string }
  | { ok: false; configured: true; error: string; fetchedAt?: number };

type CacheEntry = { at: number; result: SheetLoadResult };
let cache: CacheEntry | null = null;

function isCsvLike(text: string): boolean {
  if (!text.trim()) return false;
  if (text.length > 1_500_000) return false;
  if (/<!doctype html|<html/i.test(text)) return false;
  if (/google\.visualization\.Query\.setResponse/i.test(text)) return false;
  return true;
}

async function fetchText(url: string, bust: boolean, csvOnly = true): Promise<string | null> {
  if (!isAllowedSheetUrl(url)) return null;
  const target = bust ? `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}` : url;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(target, {
      headers: { accept: csvOnly ? "text/csv,text/plain,*/*" : "text/html,text/csv,*/*" },
      redirect: "follow",
      cache: bust ? "no-store" : "default",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!csvOnly) return text;
    return isCsvLike(text) ? text : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function pickByKind(texts: string[], kind: "articles" | "players"): string | null {
  const matches = texts.filter((text) => classifyCsv(text) === kind);
  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.length - a.length)[0];
}

async function discoverGids(id: string, fromUrl: string, bust: boolean): Promise<string[]> {
  const found = new Set(gidsFromUrl(fromUrl));
  const html = await fetchText(`https://docs.google.com/spreadsheets/d/${id}/htmlview`, bust, false);
  if (html) {
    for (const match of html.matchAll(/gid[":=\s]+(\d{5,})/g)) found.add(match[1]);
  }
  return [...found];
}

async function readPublicSheet(force: boolean): Promise<SheetLoadResult> {
  const url = PUBLIC_SHEET_URL.trim();
  if (!url) {
    return {
      ok: false,
      configured: false,
      error: "公開用シートはまだ接続されていません。",
    };
  }
  const csvUrl = toCsvExportUrl(url);
  if (!isAllowedSheetUrl(csvUrl)) {
    return {
      ok: false,
      configured: true,
      error: "Google スプレッドシートの URL だけ使えます。",
    };
  }
  const now = Date.now();
  if (!force && cache && now - cache.at < SHEET_CACHE_MS) {
    if (cache.result.ok) scheduleNameCheck(cache.result.csv, cache.result.playersCsv);
    return cache.result;
  }

  const id = spreadsheetIdFromUrl(url);
  const named = id
    ? [...ARTICLE_TAB_NAMES, ...PLAYER_TAB_NAMES].map((name) => gvizCsvUrl(id, name))
    : [];
  const gids = id ? await discoverGids(id, url, force) : [];
  const byGid = id ? gids.map((gid) => csvExportByGid(id, gid)) : [];
  const unique = [...new Set([csvUrl, ...named, ...byGid])];
  const texts = (await Promise.all(unique.map((target) => fetchText(target, force)))).filter(
    (text): text is string => Boolean(text),
  );

  const articlesCsv = pickByKind(texts, "articles");
  const playersCsv = pickByKind(texts, "players");
  const fetchedAt = Date.now();

  if (!articlesCsv && !playersCsv) {
    const result: SheetLoadResult = {
      ok: false,
      configured: true,
      fetchedAt,
      error:
        "記事一覧・選手一覧のどちらも読めませんでした。共有を「リンクを知っている全員 / 閲覧者」にしてください。",
    };
    cache = { at: fetchedAt, result };
    return result;
  }

  const result: SheetLoadResult = {
    ok: true,
    csv: articlesCsv ?? "",
    playersCsv,
    configured: true,
    fetchedAt,
  };
  cache = { at: fetchedAt, result };
  if (result.ok) scheduleNameCheck(result.csv, result.playersCsv);
  return result;
}

export const loadPublicSheet = createServerFn({ method: "GET" }).handler(async () =>
  readPublicSheet(false),
);

export const refreshPublicSheet = createServerFn({ method: "POST" }).handler(async () =>
  readPublicSheet(true),
);
