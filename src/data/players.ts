import type { Player } from "./types";

/** 選手名簿の正本は Google スプレッドシート。このリポジトリには載せません。 */
export const PLAYERS: Player[] = [];

export const PLAYER_BY_SLUG = Object.fromEntries(
  PLAYERS.map((p) => [p.slug, p]),
) as Record<string, Player>;
