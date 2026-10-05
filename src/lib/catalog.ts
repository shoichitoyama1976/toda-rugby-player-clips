import { SEED_ARTICLES } from "@/data/articles";
import { OFFICIAL_PROFILES } from "@/data/official-profiles";
import { PLAYERS, PLAYER_BY_SLUG } from "@/data/players";
import {
  KIND_ALIASES,
  KIND_LABEL,
  PLAYER_SHEET_COLUMNS,
  PERSON_CATEGORIES,
  POSITIONS,
  SOURCE_ALIASES,
  SOURCE_LABEL,
  SHEET_COLUMNS,
  SHEET_EXCERPT_HEADERS,
  SHEET_KIND_HEADERS,
  SHEET_NAME_HEADERS,
  SHEET_SEASON_HEADERS,
  type Article,
  type ArticleKind,
  type PersonCategory,
  type Player,
  type PlayerFact,
  type PlayerStatus,
  type Position,
  type SourceKey,
} from "@/data/types";
import { headerIndex, parseDelimited, pick, normalizeHeader } from "./csv";

export function foldName(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[ 　・･.]/g, "")
    .replace(/將/g, "将")
    .replace(/髙/g, "高")
    .replace(/﨑/g, "崎")
    .replace(/栁/g, "柳")
    .replace(/齋/g, "斉")
    .replace(/斎/g, "斉")
    .toLowerCase();
}

type NameIndex = Array<{ key: string; slug: string }>;

function buildNameIndex(players: Player[]): NameIndex {
  return players.flatMap((p) =>
    [p.name, ...p.aliases].map((alias) => ({ key: foldName(alias), slug: p.slug })),
  );
}

export function matchPlayerSlug(name: string, players: Player[] = PLAYERS): string | undefined {
  return matchFromIndex(name, buildNameIndex(players));
}

function matchFromIndex(name: string, index: NameIndex): string | undefined {
  const key = foldName(name);
  if (key.length < 2) return undefined;
  const exact = index.filter((entry) => entry.key === key);
  if (exact.length > 0) return exact[0].slug;
  const contains = index
    .filter(
      (entry) =>
        entry.key.length >= 2 &&
        key.length >= 2 &&
        (entry.key.includes(key) || key.includes(entry.key)),
    )
    .sort((a, b) => b.key.length - a.key.length);
  return contains[0]?.slug;
}

export function splitPlayerNames(value: string): string[] {
  return value
    .split(/[、,／/&＋+;；]+/)
    .map((part) => part.replace(/選手$/g, "").trim())
    .filter(Boolean);
}

function officialProfile(name: string): string | undefined {
  return OFFICIAL_PROFILES[foldName(name)];
}

function hashId(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return "s" + (h >>> 0).toString(36);
}

function cleanSheetUrl(raw: string): string {
  let url = raw.trim();
  url = url.replace(/https:\/\/note\.com\s+ヤクルトレビンズ戸田\.com/gi, "https://note.com");
  url = url.replace(/https:\/\/note\.com\.com/gi, "https://note.com");
  if (!url || /\s/.test(url)) return "";
  if (!/^https:\/\//i.test(url)) return "";
  try {
    return new URL(url).href;
  } catch {
    return "";
  }
}

export function parseXUrl(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const asUrl = /^https:\/\//i.test(trimmed)
    ? cleanSheetUrl(trimmed)
    : cleanSheetUrl(`https://x.com/${trimmed.replace(/^@/, "")}`);
  if (!asUrl) return undefined;
  try {
    const parsed = new URL(asUrl);
    if (!/(^|\.)(x\.com|twitter\.com)$/i.test(parsed.hostname)) return undefined;
    const handle = parsed.pathname.split("/").filter(Boolean)[0];
    if (!handle || /^(home|i|intent|share|search)$/i.test(handle)) return undefined;
    return `https://x.com/${handle.replace(/^@/, "")}`;
  } catch {
    return undefined;
  }
}

export function xHandle(url: string): string | undefined {
  try {
    const handle = new URL(url).pathname.split("/").filter(Boolean)[0];
    return handle ? handle.replace(/^@/, "") : undefined;
  } catch {
    return undefined;
  }
}

export function parseInstagramUrl(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const asUrl = /^https:\/\//i.test(trimmed)
    ? cleanSheetUrl(trimmed)
    : cleanSheetUrl(`https://www.instagram.com/${trimmed.replace(/^@/, "")}/`);
  if (!asUrl) return undefined;
  try {
    const parsed = new URL(asUrl);
    if (!/(^|\.)instagram\.com$/i.test(parsed.hostname)) return undefined;
    const handle = parsed.pathname.split("/").filter(Boolean)[0];
    if (!handle || /^(p|reel|reels|stories|explore|accounts)$/i.test(handle)) return undefined;
    return `https://www.instagram.com/${handle.replace(/^@/, "")}/`;
  } catch {
    return undefined;
  }
}

export function instagramHandle(url: string): string | undefined {
  try {
    const handle = new URL(url).pathname.split("/").filter(Boolean)[0];
    return handle ? handle.replace(/^@/, "") : undefined;
  } catch {
    return undefined;
  }
}

export function parseNoteUrl(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const asUrl = /^https:\/\//i.test(trimmed)
    ? cleanSheetUrl(trimmed)
    : cleanSheetUrl(`https://note.com/${trimmed.replace(/^@/, "")}`);
  if (!asUrl) return undefined;
  try {
    const parsed = new URL(asUrl);
    if (!/(^|\.)note\.com$/i.test(parsed.hostname)) return undefined;
    if (!parsed.pathname || parsed.pathname === "/") return undefined;
    return parsed.href;
  } catch {
    return undefined;
  }
}

export function noteHandle(url: string): string | undefined {
  try {
    const handle = new URL(url).pathname.split("/").filter(Boolean)[0];
    return handle ? handle.replace(/^@/, "") : undefined;
  } catch {
    return undefined;
  }
}

function guessSource(url: string, raw: string): { key: SourceKey; label: string } {
  const trimmed = raw.trim();
  const folded = foldName(raw);
  let key: SourceKey | undefined;
  for (const [alias, mapped] of Object.entries(SOURCE_ALIASES)) {
    if (folded === foldName(alias)) {
      key = mapped;
      break;
    }
  }
  if (!key) {
    if (url.includes("yakult.co.jp")) key = "official";
    else if (url.includes("note.com") || folded.startsWith("note")) key = "note";
    else if (url.includes("league-one.jp")) key = "league-one";
    else if (url.includes("spottama")) key = "spottama";
    else if (url.includes("city.toda")) key = "toda";
    else key = "other";
  }
  return { key, label: trimmed || SOURCE_LABEL[key] };
}

function guessKind(raw: string, title: string): ArticleKind {
  const folded = foldName(raw);
  for (const [alias, key] of Object.entries(KIND_ALIASES)) {
    if (folded === foldName(alias)) return key;
  }
  if (/インタビュー|interview/i.test(title)) return "interview";
  if (/レポート|試合結果|第\d+節/.test(title)) return "match";
  if (/新加入|退団|キャプテン|お知らせ/.test(title)) return "notice";
  if (/MVP|市長|戸田市/.test(title)) return "community";
  return "feature";
}

function parseDate(value: string): string | null {
  const trimmed = value.trim();
  const iso = trimmed.match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  if (iso) {
    const y = iso[1];
    const m = iso[2].padStart(2, "0");
    const d = iso[3].padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const serial = Number(trimmed);
  if (Number.isInteger(serial) && serial > 20000 && serial < 80000) {
    const utc = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
    return utc.toISOString().slice(0, 10);
  }
  return null;
}

const POSITION_PARSE: Array<{ key: string; position: Position }> = [
  { key: "no8", position: "NO8" },
  { key: "ナンバーエイト", position: "NO8" },
  { key: "number8", position: "NO8" },
  { key: "8", position: "NO8" },
  { key: "pr", position: "PR" },
  { key: "プロップ", position: "PR" },
  { key: "prop", position: "PR" },
  { key: "ho", position: "HO" },
  { key: "フッカー", position: "HO" },
  { key: "hooker", position: "HO" },
  { key: "lo", position: "LO" },
  { key: "ロック", position: "LO" },
  { key: "lock", position: "LO" },
  { key: "fl", position: "FL" },
  { key: "フランカー", position: "FL" },
  { key: "flanker", position: "FL" },
  { key: "sh", position: "SH" },
  { key: "スクラムハーフ", position: "SH" },
  { key: "scrumhalf", position: "SH" },
  { key: "so", position: "SO" },
  { key: "スタンドオフ", position: "SO" },
  { key: "flyhalf", position: "SO" },
  { key: "ctb", position: "CTB" },
  { key: "センター", position: "CTB" },
  { key: "centre", position: "CTB" },
  { key: "center", position: "CTB" },
  { key: "wtb", position: "WTB" },
  { key: "ウイング", position: "WTB" },
  { key: "wing", position: "WTB" },
  { key: "fb", position: "FB" },
  { key: "フルバック", position: "FB" },
  { key: "fullback", position: "FB" },
];

function parsePosition(raw: string): Position | undefined {
  const token = foldName(raw.split(/[/／,、]/)[0] ?? "");
  if (!token) return undefined;
  if ((POSITIONS as readonly string[]).includes(raw.trim().toUpperCase())) {
    return raw.trim().toUpperCase() as Position;
  }
  const hit = POSITION_PARSE.find((entry) => token === foldName(entry.key) || token.includes(foldName(entry.key)));
  return hit?.position;
}

function parseNumber(raw: string): number | undefined {
  const match = raw.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (!match) return undefined;
  const value = Number(match[1]);
  return Number.isFinite(value) ? Math.round(value) : undefined;
}

function parseYear(raw: string): string | undefined {
  const match = raw.match(/(19|20)\d{2}/);
  return match?.[0];
}

function parseCategory(raw: string): PersonCategory | undefined {
  const value = raw.normalize("NFKC").trim();
  if (!value) return undefined;
  if ((PERSON_CATEGORIES as readonly string[]).includes(value)) return value as PersonCategory;
  return undefined;
}

function parseStatus(raw: string): PlayerStatus | undefined {
  const folded = foldName(raw);
  if (!folded) return undefined;
  if (/退団|過去|former|ob|卒業|移籍/.test(folded)) return "former";
  if (/在籍|現役|current|所属/.test(folded)) return "current";
  return undefined;
}

function parseCaptain(raw: string): boolean | undefined {
  const folded = foldName(raw);
  if (!folded) return undefined;
  if (/主将|共同|キャプテン|yes|true|○|◯|1/.test(folded)) return true;
  if (/no|false|0|無/.test(folded)) return false;
  return undefined;
}

const KNOWN_PLAYER_HEADERS = new Set(
  PLAYER_SHEET_COLUMNS.flatMap((col) => col.headers.map((header) => normalizeHeader(header))),
);
const HIDDEN_PLAYER_HEADERS = new Set(
  ["no.", "no", "番号", "年齢", "在籍年数", "退団年度", "退団"].map((header) => normalizeHeader(header)),
);

function col(key: (typeof PLAYER_SHEET_COLUMNS)[number]["key"]): readonly string[] {
  return PLAYER_SHEET_COLUMNS.find((item) => item.key === key)?.headers ?? [];
}

function clipCol(key: (typeof SHEET_COLUMNS)[number]["key"]): readonly string[] {
  return SHEET_COLUMNS.find((item) => item.key === key)?.headers ?? [];
}

function normId(value: string): string {
  return value.normalize("NFKC").trim();
}

export type CsvKind = "articles" | "players" | "unknown";

export function classifyCsv(csv: string): CsvKind {
  const rows = parseDelimited(csv);
  const headers = (rows[0] ?? []).map((h) => normalizeHeader(h));
  const has = (aliases: readonly string[]) =>
    aliases.some((alias) => headers.includes(normalizeHeader(alias)));
  if (has(["ポジション", "身長", "ふりがな"])) return "players";
  if (has(["掲載年月日", "年月日", "掲載媒体"]) || (has(clipCol("title")) && has(clipCol("url")))) return "articles";
  if (has(col("name")) && !has(clipCol("title"))) return "players";
  return "unknown";
}

export type SheetParse = {
  articles: Article[];
  unmatched: string[];
  skipped: number;
  headers: string[];
  missingRequired: string[];
};

export function parseSheet(csv: string, roster: Player[] = PLAYERS): SheetParse {
  const rows = parseDelimited(csv);
  if (rows.length < 2) {
    return { articles: [], unmatched: [], skipped: 0, headers: rows[0] ?? [], missingRequired: [] };
  }
  const headers = rows[0];
  const index = headerIndex(headers);
  const nameIndex = buildNameIndex(roster);
  const bySheetId = new Map<string, Player>();
  for (const player of roster) {
    if (player.sheetId) bySheetId.set(normId(player.sheetId), player);
  }
  const missingRequired = SHEET_COLUMNS.filter((item) => item.required)
    .filter((item) => !item.headers.some((header) => index[normalizeHeader(header)] !== undefined))
    .map((item) => item.headers[0]);

  const articles: Article[] = [];
  const unmatchedSet = new Set<string>();
  let skipped = 0;

  for (const row of rows.slice(1)) {
    const url = cleanSheetUrl(pick(row, index, clipCol("url")));
    if (!url) {
      skipped += 1;
      continue;
    }
    const dateRaw = pick(row, index, clipCol("date"));
    const sourceRaw = pick(row, index, clipCol("source"));
    const title = pick(row, index, clipCol("title")) || sourceRaw;
    if (!title && !dateRaw) {
      skipped += 1;
      continue;
    }
    const date = parseDate(dateRaw) ?? dateRaw;
    const playerId = pick(row, index, clipCol("playerId"));
    const names: string[] = [];
    const slugs: string[] = [];
    if (playerId) {
      const linked = bySheetId.get(normId(playerId));
      if (linked) {
        names.push(linked.name);
        slugs.push(linked.slug);
      } else {
        unmatchedSet.add(`ID ${playerId}`);
      }
    }
    if (names.length === 0) {
      for (const name of splitPlayerNames(pick(row, index, SHEET_NAME_HEADERS))) {
        names.push(name);
        const slug = matchFromIndex(name, nameIndex);
        if (slug) slugs.push(slug);
        else unmatchedSet.add(name);
      }
    }
    const source = guessSource(url, sourceRaw);
    const kind = guessKind(pick(row, index, SHEET_KIND_HEADERS), title);
    const articleId = hashId(url);
    const existing = articles.find((item) => item.id === articleId);
    if (existing) {
      for (const name of names) {
        if (!existing.playerNames.includes(name)) existing.playerNames.push(name);
      }
      for (const slug of slugs) {
        if (!existing.playerSlugs.includes(slug)) existing.playerSlugs.push(slug);
      }
      if (!existing.excerpt) existing.excerpt = pick(row, index, SHEET_EXCERPT_HEADERS);
      if (!existing.title && title) existing.title = title;
      continue;
    }
    articles.push({
      id: articleId,
      date,
      title: title || source.label,
      url,
      source: source.key,
      sourceLabel: source.label,
      kind,
      excerpt: pick(row, index, SHEET_EXCERPT_HEADERS),
      season: pick(row, index, SHEET_SEASON_HEADERS) || undefined,
      playerSlugs: [...new Set(slugs)],
      playerNames: names,
      fromSheet: true,
    });
  }

  return {
    articles: articles.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    unmatched: [...unmatchedSet],
    skipped,
    headers,
    missingRequired,
  };
}

export type SheetPlayerRow = {
  sheetId?: string;
  name: string;
  nameKana: string;
  aliases: string[];
  position?: Position;
  heightCm?: number;
  weightKg?: number;
  birthday?: string;
  origin?: string;
  school?: string;
  rugbySchool?: string;
  highSchool?: string;
  university?: string;
  previousTeam?: string;
  joined?: string;
  left?: string;
  nickname?: string;
  sutoCall?: string;
  xUrl?: string;
  instagramUrl?: string;
  noteUrl?: string;
  status?: PlayerStatus;
  captain?: boolean;
  profileUrl?: string;
  role?: string;
  category?: PersonCategory;
  extras: PlayerFact[];
};

export type PlayerSheetParse = {
  rows: SheetPlayerRow[];
  skipped: number;
  headers: string[];
};

export function parsePlayersSheet(csv: string): PlayerSheetParse {
  const table = parseDelimited(csv);
  if (table.length < 2) return { rows: [], skipped: 0, headers: table[0] ?? [] };
  const headers = table[0];
  const index = headerIndex(headers);
  const rows: SheetPlayerRow[] = [];
  let skipped = 0;

  for (const row of table.slice(1)) {
    const sheetId =
      pick(row, index, col("sheetId")) || pick(row, index, ["No.", "No", "番号"]) || undefined;
    const name = pick(row, index, col("name"));
    if (!name) {
      skipped += 1;
      continue;
    }
    const highSchool = pick(row, index, ["高校", "出身高校", "高等学校"]) || undefined;
    const university = pick(row, index, ["大学", "出身大学"]) || undefined;
    const previousTeam = pick(row, index, col("previousTeam")) || undefined;
    const rugbySchool = pick(row, index, col("rugbySchool")) || undefined;
    const school =
      pick(row, index, col("school")) ||
      [highSchool, university].filter(Boolean).join("→") ||
      undefined;
    const leftRaw = pick(row, index, ["退団年度", "退団"]);
    const left = parseYear(leftRaw);
    const positionRaw = pick(row, index, col("position"));
    const position = parsePosition(positionRaw);
    const role = position || !positionRaw ? undefined : positionRaw;
    const category = parseCategory(pick(row, index, col("category")));
    const extras: PlayerFact[] = [];
    headers.forEach((header, i) => {
      const key = normalizeHeader(header);
      if (!key || KNOWN_PLAYER_HEADERS.has(key) || HIDDEN_PLAYER_HEADERS.has(key)) return;
      const value = (row[i] ?? "").trim();
      if (value) extras.push({ label: header.trim(), value });
    });
    rows.push({
      sheetId,
      name,
      nameKana: pick(row, index, col("nameKana")),
      aliases: splitPlayerNames(pick(row, index, col("aliases"))),
      position,
      role,
      category,
      heightCm: parseNumber(pick(row, index, col("heightCm"))),
      weightKg: parseNumber(pick(row, index, col("weightKg"))),
      birthday: parseDate(pick(row, index, col("birthday"))) ?? undefined,
      origin: pick(row, index, col("origin")) || undefined,
      school,
      rugbySchool,
      highSchool,
      university,
      previousTeam,
      joined: parseYear(pick(row, index, col("joined"))),
      left,
      nickname: pick(row, index, col("nickname")) || undefined,
      sutoCall: pick(row, index, col("sutoCall")) || undefined,
      xUrl: parseXUrl(pick(row, index, col("xUrl"))),
      instagramUrl: parseInstagramUrl(pick(row, index, col("instagramUrl"))),
      noteUrl: parseNoteUrl(pick(row, index, col("noteUrl"))),
      status: left ? "former" : parseStatus(pick(row, index, col("status"))),
      captain: parseCaptain(pick(row, index, col("captain"))),
      extras,
    });
  }
  return { rows, skipped, headers };
}

function overlayPlayer(base: Player, row: SheetPlayerRow): Player {
  const aliases = [...new Set([...base.aliases, ...row.aliases, base.name, row.name].filter(Boolean))];
  return {
    ...base,
    name: row.name || base.name,
    nameKana: row.nameKana || base.nameKana,
    aliases,
    position: row.position ?? base.position,
    heightCm: row.heightCm ?? base.heightCm,
    weightKg: row.weightKg ?? base.weightKg,
    birthday: row.birthday ?? base.birthday,
    origin: row.origin ?? base.origin,
    school: row.school ?? base.school,
    rugbySchool: row.rugbySchool ?? base.rugbySchool,
    highSchool: row.highSchool ?? base.highSchool,
    university: row.university ?? base.university,
    previousTeam: row.previousTeam ?? base.previousTeam,
    joined: row.joined ?? base.joined,
    left: row.left ?? base.left,
    nickname: row.nickname ?? base.nickname,
    sutoCall: row.sutoCall ?? base.sutoCall,
    xUrl: row.xUrl ?? base.xUrl,
    instagramUrl: row.instagramUrl ?? base.instagramUrl,
    noteUrl: row.noteUrl ?? base.noteUrl,
    profileUrl: officialProfile(row.name) ?? officialProfile(base.name),
    status: row.status ?? base.status,
    captain: row.captain ?? base.captain,
    extras: row.extras.length > 0 ? row.extras : base.extras,
    fromSheet: true,
    sheetId: row.sheetId ?? base.sheetId,
    category: row.category ?? base.category,
    related: (row.category ?? base.category) ? (row.category ?? base.category) !== "選手" : !row.position,
    role: row.position ? undefined : row.role ?? base.role,
    unlisted: false,
  };
}

function playerFromRow(row: SheetPlayerRow): Player {
  return {
    slug: row.sheetId ? `p-${normId(row.sheetId)}` : `x-${hashId(foldName(row.name))}`,
    name: row.name,
    nameKana: row.nameKana,
    aliases: [...new Set([row.name, ...row.aliases])],
    position: row.position ?? "WTB",
    heightCm: row.heightCm,
    weightKg: row.weightKg,
    birthday: row.birthday,
    origin: row.origin,
    school: row.school,
    rugbySchool: row.rugbySchool,
    highSchool: row.highSchool,
    university: row.university,
    previousTeam: row.previousTeam,
    joined: row.joined,
    left: row.left,
    nickname: row.nickname,
    sutoCall: row.sutoCall,
    xUrl: row.xUrl,
    instagramUrl: row.instagramUrl,
    noteUrl: row.noteUrl,
    profileUrl: officialProfile(row.name),
    status: row.status ?? "current",
    captain: row.captain,
    unlisted: false,
    related: row.category ? row.category !== "選手" : !row.position,
    role: row.role,
    category: row.category,
    extras: row.extras.length > 0 ? row.extras : undefined,
    fromSheet: true,
    sheetId: row.sheetId,
  };
}

export function mergeSheetPlayers(seed: Player[], rows: SheetPlayerRow[]): Player[] {
  if (rows.length === 0) return seed;
  const merged = seed.map((player) => ({ ...player }));
  const unused = [...rows];

  for (const player of merged) {
    const index = unused.findIndex((row) => {
      if (row.sheetId && player.sheetId && normId(row.sheetId) === normId(player.sheetId)) return true;
      return (
        matchFromIndex(row.name, buildNameIndex([player])) === player.slug ||
        foldName(row.name) === foldName(player.name)
      );
    });
    if (index < 0) continue;
    const row = unused.splice(index, 1)[0];
    Object.assign(player, overlayPlayer(player, row));
  }

  for (const row of unused) {
    merged.push(playerFromRow(row));
  }
  return merged;
}

export function extraPlayersFromArticles(articles: Article[], roster: Player[]): Player[] {
  const extra: Player[] = [];
  const index = buildNameIndex(roster);
  const known = new Set(index.map((entry) => entry.key));
  for (const article of articles) {
    for (const name of article.playerNames) {
      const folded = foldName(name);
      if (!folded || known.has(folded) || matchFromIndex(name, index)) continue;
      known.add(folded);
      extra.push({
        slug: `x-${hashId(folded)}`,
        name,
        nameKana: "",
        aliases: [name],
        position: "WTB",
        status: "former",
        unlisted: true,
      });
    }
  }
  return extra;
}

export function resolveCatalog(
  sheetCsv: string | null,
  playersCsv: string | null = null,
): {
  articles: Article[];
  players: Player[];
  usingSheet: boolean;
  unmatched: string[];
  playerSheetCount: number;
} {
  const playerParsed = playersCsv?.trim() ? parsePlayersSheet(playersCsv) : { rows: [], skipped: 0, headers: [] };
  const merged = mergeSheetPlayers(PLAYERS, playerParsed.rows);
  const articleParsed = sheetCsv?.trim() ? parseSheet(sheetCsv, merged) : null;
  const sheetArticles = articleParsed?.articles ?? [];
  const usingSheet = sheetArticles.length > 0 || playerParsed.rows.length > 0;
  const articles = sheetArticles.length > 0 ? sheetArticles : SEED_ARTICLES;
  const used = new Set(articles.flatMap((a) => a.playerSlugs));
  const extras = extraPlayersFromArticles(articles, merged);
  const players = [
    ...merged.filter(
      (player) => player.fromSheet || player.status === "current" || used.has(player.slug),
    ),
    ...extras,
  ];
  return {
    articles,
    players,
    usingSheet,
    unmatched: articleParsed?.unmatched ?? [],
    playerSheetCount: playerParsed.rows.length,
  };
}

export function articlesForPlayer(articles: Article[], slug: string, player: Player): Article[] {
  const keys = new Set([foldName(player.name), ...player.aliases.map(foldName)]);
  return articles.filter(
    (article) =>
      article.playerSlugs.includes(slug) ||
      article.playerNames.some((name) => keys.has(foldName(name))),
  );
}

export function searchArticles(articles: Article[], query: string): Article[] {
  const q = foldName(query);
  if (!q) return articles;
  return articles.filter((article) => {
    const hay = foldName(
      [
        article.title,
        article.excerpt,
        article.sourceLabel,
        KIND_LABEL[article.kind],
        article.playerNames.join(""),
        article.season ?? "",
      ].join(""),
    );
    return hay.includes(q);
  });
}

export function searchPlayers(players: Player[], query: string): Player[] {
  const q = foldName(query);
  if (!q) return players;
  return players.filter((player) =>
    foldName(
      [
        player.name,
        player.nameKana,
        player.nickname ?? "",
        player.sutoCall ?? "",
        player.xUrl ?? "",
        player.instagramUrl ?? "",
        player.noteUrl ?? "",
        player.origin ?? "",
        player.school ?? "",
        player.rugbySchool ?? "",
        player.highSchool ?? "",
        player.university ?? "",
        player.previousTeam ?? "",
        ...(player.extras ?? []).map((fact) => fact.value),
      ].join(""),
    ).includes(q),
  );
}

export function playerCareer(player: Player): {
  rugbySchool?: string;
  highSchool?: string;
  university?: string;
  previousTeam?: string;
} {
  const parts = (player.school ?? "")
    .split(/[→>／]/)
    .map((part) => part.trim())
    .filter(Boolean);
  let fallbackHigh: string | undefined;
  let fallbackUni: string | undefined;
  if (parts.length === 1) {
    if (/大学/.test(parts[0]) && !/高校|高等学校/.test(parts[0])) fallbackUni = parts[0];
    else fallbackHigh = parts[0];
  } else if (parts.length > 1) {
    fallbackHigh = parts[0];
    fallbackUni = parts[parts.length - 1];
  }
  return {
    rugbySchool: player.rugbySchool,
    highSchool: player.highSchool || fallbackHigh,
    university: player.university || fallbackUni,
    previousTeam: player.previousTeam,
  };
}

export function playerBySlug(slug: string): Player | undefined {
  return PLAYER_BY_SLUG[slug];
}
