import { useLoaderData } from "@tanstack/react-router";
import { useMemo } from "react";
import { LINEUPS } from "@/data/lineups";
import { SHEET_CACHE_MS } from "@/data/sheet-config";
import { articlesForPlayer, buildSheetLineups, matchSheet, resolveCatalog } from "./catalog";

function dataRows(csv: string | null | undefined): number {
  if (!csv?.trim()) return 0;
  const lines = csv.split(/\r?\n/).filter((line) => line.trim());
  return Math.max(0, lines.length - 1);
}

export function useCatalog() {
  const data = useLoaderData({ from: "__root__" });
  const sheet = data.sheet;

  return useMemo(() => {
    const csv = sheet.ok ? sheet.csv : null;
    const playersCsv = sheet.ok ? sheet.playersCsv : null;
    const catalog = resolveCatalog(csv, playersCsv);
    const matches = matchSheet(sheet.ok ? sheet.matchesCsv : null);
    const lineups = buildSheetLineups(
      sheet.ok ? sheet.lineupsCsv : null,
      sheet.ok ? sheet.matchesCsv : null,
    );
    const players = catalog.players;
    const countBySlug = new Map<string, number>();
    for (const player of players) {
      countBySlug.set(
        player.slug,
        articlesForPlayer(catalog.articles, player.slug, player).length,
      );
    }
    return {
      ...catalog,
      players,
      countBySlug,
      notices: data.notices ?? [],
      matchSheet: matches,
      lineups: lineups.length > 0 ? lineups : LINEUPS,
      configured: sheet.configured,
      sheetError: sheet.ok ? null : sheet.error,
      fetchedAt: "fetchedAt" in sheet ? (sheet.fetchedAt ?? null) : null,
      cacheMs: SHEET_CACHE_MS,
      sheetRows: {
        clips: sheet.ok ? dataRows(sheet.csv) : 0,
        players: sheet.ok ? dataRows(sheet.playersCsv) : 0,
        matches: sheet.ok ? dataRows(sheet.matchesCsv) : 0,
        lineups: sheet.ok ? dataRows(sheet.lineupsCsv) : 0,
      },
      origin: data.origin ?? "",
    };
  }, [data, sheet]);
}