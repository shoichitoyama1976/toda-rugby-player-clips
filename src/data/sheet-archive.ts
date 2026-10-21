import clipsCsv from "./clips.csv?raw";
import eventsCsv from "./events.csv?raw";
import lineupsCsv from "./lineups.csv?raw";
import matchesCsv from "./matches.csv?raw";
import playersCsv from "./players.csv?raw";
import teamsCsv from "./teams.csv?raw";

/** 選手、記事、試合、出場メンバー、チーム名、イベント。表示のたびにスプレッドシートは読まない。 */
export const CLIPS_CSV = clipsCsv;
export const PLAYERS_CSV = playersCsv;
export const MATCHES_CSV = matchesCsv;
export const LINEUPS_CSV = lineupsCsv;
export const TEAMS_CSV = teamsCsv;
export const EVENTS_CSV = eventsCsv;
