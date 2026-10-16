import lineupsCsv from "./lineups.csv?raw";
import matchesCsv from "./matches.csv?raw";

/** 試合と出場メンバー。表示のたびにスプレッドシートは読まない。 */
export const MATCHES_CSV = matchesCsv;
export const LINEUPS_CSV = lineupsCsv;
