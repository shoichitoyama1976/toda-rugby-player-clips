import clipsCsv from "./clips.csv?raw";
import lineupsCsv from "./lineups.csv?raw";
import matchesCsv from "./matches.csv?raw";
import playersCsv from "./players.csv?raw";

/** 選手、記事、試合、出場メンバー。表示のたびにスプレッドシートは読まない。 */
export const CLIPS_CSV = clipsCsv;
export const PLAYERS_CSV = playersCsv;
export const MATCHES_CSV = matchesCsv;
export const LINEUPS_CSV = lineupsCsv;
