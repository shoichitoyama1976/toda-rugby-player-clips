import { createServerFn } from "@tanstack/react-start";
import { CLIPS_CSV, PLAYERS_CSV } from "@/data/sheet-archive";

export type SheetLoadResult =
  | { ok: true; csv: string; playersCsv: string | null; matchesCsv: string | null; lineupsCsv: string | null; configured: true; fetchedAt: number }
  | { ok: false; configured: false; error: string }
  | { ok: false; configured: true; error: string; fetchedAt?: number };

function archivedSheet(): SheetLoadResult {
  return {
    ok: true,
    csv: CLIPS_CSV,
    playersCsv: PLAYERS_CSV,
    matchesCsv: null,
    lineupsCsv: null,
    configured: true,
    fetchedAt: 0,
  };
}

export const loadPublicSheet = createServerFn({ method: "GET" }).handler(async () => archivedSheet());

export const refreshPublicSheet = createServerFn({ method: "POST" }).handler(async () => archivedSheet());
