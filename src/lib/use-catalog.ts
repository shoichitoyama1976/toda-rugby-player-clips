import { useLoaderData } from "@tanstack/react-router";
import { useMemo } from "react";
import { articlesForPlayer, resolveCatalog } from "./catalog";

export function useCatalog() {
  const data = useLoaderData({ from: "__root__" });
  const sheet = data.sheet;

  return useMemo(() => {
    const csv = sheet.ok ? sheet.csv : null;
    const playersCsv = sheet.ok ? sheet.playersCsv : null;
    const catalog = resolveCatalog(csv, playersCsv);
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
      configured: sheet.configured,
      sheetError: sheet.ok ? null : sheet.error,
      fetchedAt: "fetchedAt" in sheet ? (sheet.fetchedAt ?? null) : null,
      origin: data.origin ?? "",
    };
  }, [data, sheet]);
}
