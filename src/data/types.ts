export const POSITIONS = [
  "PR",
  "HO",
  "LO",
  "FL",
  "NO8",
  "SH",
  "SO",
  "CTB",
  "WTB",
  "FB",
] as const;

export type Position = (typeof POSITIONS)[number];

export const POSITION_LABEL: Record<Position, string> = {
  PR: "プロップ",
  HO: "フッカー",
  LO: "ロック",
  FL: "フランカー",
  NO8: "ナンバーエイト",
  SH: "スクラムハーフ",
  SO: "スタンドオフ",
  CTB: "センター",
  WTB: "ウイング",
  FB: "フルバック",
};

export const POSITION_UNIT: Record<Position, "FW" | "BK"> = {
  PR: "FW",
  HO: "FW",
  LO: "FW",
  FL: "FW",
  NO8: "FW",
  SH: "BK",
  SO: "BK",
  CTB: "BK",
  WTB: "BK",
  FB: "BK",
};

export type PlayerStatus = "current" | "former";

export const PERSON_CATEGORIES = ["選手", "スタッフ", "ホームタウン", "ホストシティ"] as const;
export type PersonCategory = (typeof PERSON_CATEGORIES)[number];

export type PlayerFact = {
  label: string;
  value: string;
};

export type Player = {
  slug: string;
  name: string;
  nameKana: string;
  aliases: string[];
  position: Position;
  heightCm?: number;
  weightKg?: number;
  birthday?: string;
  joined?: string;
  left?: string;
  status: PlayerStatus;
  captain?: boolean;
  origin?: string;
  school?: string;
  rugbySchool?: string;
  highSchool?: string;
  university?: string;
  previousTeam?: string;
  nickname?: string;
  profileUrl?: string;
  unlisted?: boolean;
  related?: boolean;
  role?: string;
  category?: PersonCategory;
  extras?: PlayerFact[];
  fromSheet?: boolean;
  sheetId?: string;
};

export const ARTICLE_KINDS = [
  "interview",
  "match",
  "notice",
  "feature",
  "community",
] as const;

export type ArticleKind = (typeof ARTICLE_KINDS)[number];

export const KIND_LABEL: Record<ArticleKind, string> = {
  interview: "インタビュー",
  match: "試合レポート",
  notice: "お知らせ",
  feature: "特集",
  community: "地域",
};

export const KIND_ALIASES: Record<string, ArticleKind> = {
  インタビュー: "interview",
  interview: "interview",
  選手インタビュー: "interview",
  試合: "match",
  試合レポート: "match",
  レポート: "match",
  match: "match",
  お知らせ: "notice",
  発表: "notice",
  notice: "notice",
  特集: "feature",
  読み物: "feature",
  feature: "feature",
  地域: "community",
  行政: "community",
  community: "community",
};

export const SOURCE_KEYS = [
  "official",
  "note",
  "league-one",
  "spottama",
  "toda",
  "other",
] as const;

export type SourceKey = (typeof SOURCE_KEYS)[number];

export const SOURCE_LABEL: Record<SourceKey, string> = {
  official: "公式HP",
  note: "note",
  "league-one": "リーグワン",
  spottama: "すぽったま",
  toda: "戸田市",
  other: "その他",
};

export const SOURCE_ALIASES: Record<string, SourceKey> = {
  公式: "official",
  公式hp: "official",
  official: "official",
  yakult: "official",
  note: "note",
  リーグワン: "league-one",
  リーグワン公式: "league-one",
  リーグワン公式サイト: "league-one",
  leagueone: "league-one",
  "league-one": "league-one",
  すぽったま: "spottama",
  spottama: "spottama",
  戸田市: "toda",
  toda: "toda",
  その他: "other",
  other: "other",
};

export type Article = {
  id: string;
  date: string;
  title: string;
  url: string;
  source: SourceKey;
  sourceLabel: string;
  kind: ArticleKind;
  excerpt: string;
  season?: string;
  playerSlugs: string[];
  playerNames: string[];
  fromSheet?: boolean;
};

export const SHEET_COLUMNS = [
  { key: "playerId", headers: ["ID", "id", "選手ID", "player_id"], required: true, example: "12" },
  { key: "date", headers: ["掲載年月日", "年月日", "日付", "date", "掲載日", "公開日"], required: true, example: "2026-02-06" },
  { key: "source", headers: ["掲載媒体", "媒体", "ソース", "source", "掲載元"], required: true, example: "note" },
  { key: "title", headers: ["タイトル", "title", "見出し", "記事タイトル", "記事名"], required: true, example: "独占インタビュー（前編）" },
  { key: "url", headers: ["URL", "url", "リンク", "link", "リンク先", "記事url"], required: true, example: "https://..." },
] as const;

export const SHEET_NAME_HEADERS = ["選手", "選手名", "players", "player", "登場選手", "対象選手", "名前"] as const;
export const SHEET_KIND_HEADERS = ["種別", "種類", "type", "カテゴリ"] as const;
export const SHEET_EXCERPT_HEADERS = ["抜粋", "メモ", "概要", "要約", "excerpt"] as const;
export const SHEET_SEASON_HEADERS = ["シーズン", "season"] as const;

export const SHEET_TEMPLATE_CSV = [
  "ID,掲載年月日,掲載媒体,タイトル,URL",
  "12,2026-02-06,note,競技人生の分岐点とラグビーの醐醇味（前編）,https://note.com/example/n/abc",
].join("\n");

export const PLAYER_SHEET_COLUMNS = [
  { key: "sheetId", headers: ["ID", "id"], required: true, example: "1" },
  { key: "name", headers: ["名前", "氏名", "選手名", "name"], required: true, example: "（例）" },
  { key: "category", headers: ["属性", "区分"], required: false, example: "選手" },
  { key: "nameKana", headers: ["ふりがな", "かな", "カナ", "フリガナ", "読み", "よみがな"], required: false, example: "" },
  { key: "nickname", headers: ["ニックネーム", "愛称"], required: false, example: "" },
  { key: "position", headers: ["ポジション", "position", "ポジ"], required: false, example: "PR" },
  { key: "heightCm", headers: ["身長", "height"], required: false, example: "180" },
  { key: "weightKg", headers: ["体重", "weight"], required: false, example: "100" },
  { key: "origin", headers: ["出身地", "出身", "出身県"], required: false, example: "" },
  {
    key: "rugbySchool",
    headers: ["ラグビースクール", "所属ラグビースクール", "ジュニア"],
    required: false,
    example: "",
  },
  { key: "highSchool", headers: ["高校", "出身高校", "高等学校"], required: false, example: "" },
  { key: "university", headers: ["大学", "出身大学"], required: false, example: "" },
  { key: "previousTeam", headers: ["経歴", "前所属", "前所属チーム", "前所属クラブ"], required: false, example: "" },
  { key: "birthday", headers: ["生年月日", "誕生日", "birthday"], required: false, example: "1990-01-01" },
  { key: "joined", headers: ["加入年度", "加入", "加入年", "入団"], required: false, example: "2020" },
  { key: "school", headers: ["学歴", "学校"], required: false, example: "○○高校→△△大学" },
  { key: "status", headers: ["在籍", "所属", "状態", "ステータス"], required: false, example: "在籍" },
  { key: "captain", headers: ["主将", "キャプテン"], required: false, example: "" },
  { key: "aliases", headers: ["別名", "旧名", "英語名"], required: false, example: "" },
] as const;

export const PLAYER_SHEET_TEMPLATE_CSV = [
  "ID,名前,属性,ふりがな,ニックネーム,ポジション,身長,体重,国,出身地,ラグビースクール,高校,大学,経歴,生年月日,加入年度,退団年度",
  ",（例）,,,,,,,,,,,,,,",
].join("\n");

export const ARTICLE_TAB_NAMES = ["掲載記事一覧", "記事一覧", "記事", "Articles", "articles", "Clips", "clips"] as const;
export const PLAYER_TAB_NAMES = ["選手一覧", "選手", "名簿", "Players", "players", "roster"] as const;
