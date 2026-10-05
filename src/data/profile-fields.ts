import { POSITION_LABEL, POSITIONS, type Player, type Position } from "./types";

export const PROFILE_FIELDS = [
  { key: "removal", label: "掲載削除", input: "url" },
  { key: "position", label: "ポジション", input: "position" },
  { key: "heightCm", label: "身長", input: "height" },
  { key: "weightKg", label: "体重", input: "weight" },
  { key: "birthday", label: "生年月日", input: "birthday" },
  { key: "origin", label: "出身", input: "prefecture" },
  { key: "rugbySchool", label: "ラグビースクール", input: "text" },
  { key: "highSchool", label: "高校", input: "text" },
  { key: "university", label: "大学", input: "text" },
  { key: "previousTeam", label: "経歴", input: "text" },
  { key: "joined", label: "加入年", input: "year" },
  { key: "nickname", label: "ニックネーム", input: "text" },
  { key: "nameKana", label: "かな", input: "text" },
  { key: "status", label: "在籍", input: "status" },
] as const;

export type ProfileFieldKey = (typeof PROFILE_FIELDS)[number]["key"];

export const PROFILE_FIELD_LABEL: Record<ProfileFieldKey, string> = Object.fromEntries(
  PROFILE_FIELDS.map((field) => [field.key, field.label]),
) as Record<ProfileFieldKey, string>;

export const PREFECTURES = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
  "海外",
] as const;

export function isProfileFieldKey(value: string): value is ProfileFieldKey {
  return PROFILE_FIELDS.some((field) => field.key === value);
}

export function playerFieldValue(player: Player, key: ProfileFieldKey): string {
  switch (key) {
    case "removal":
      return "掲載中";
    case "position":
      return `${player.position} ${POSITION_LABEL[player.position]}`;
    case "heightCm":
      return player.heightCm ? `${player.heightCm}` : "";
    case "weightKg":
      return player.weightKg ? `${player.weightKg}` : "";
    case "birthday":
      return player.birthday ?? "";
    case "origin":
      return player.origin ?? "";
    case "rugbySchool":
      return player.rugbySchool ?? "";
    case "highSchool":
      return player.highSchool ?? "";
    case "university":
      return player.university ?? "";
    case "previousTeam":
      return player.previousTeam ?? "";
    case "joined":
      return player.joined ?? "";
    case "nickname":
      return player.nickname ?? "";
    case "nameKana":
      return player.nameKana ?? "";
    case "status":
      return player.status === "former" ? "過去所属" : "在籍";
  }
}

export function formatProposed(key: ProfileFieldKey, value: string): string {
  if (key === "position") {
    const pos = value as Position;
    return POSITION_LABEL[pos] ? `${pos} ${POSITION_LABEL[pos]}` : value;
  }
  if (key === "heightCm") return value ? `${value} cm` : value;
  if (key === "weightKg") return value ? `${value} kg` : value;
  if (key === "joined") return value ? `${value}年` : value;
  return value;
}

export function patchPlayerField(player: Player, key: string, value: string): Player {
  if (!isProfileFieldKey(key)) return player;
  const next = { ...player };
  switch (key) {
    case "removal":
      break;
    case "position":
      if ((POSITIONS as readonly string[]).includes(value)) next.position = value as Position;
      break;
    case "heightCm": {
      const n = Number(value);
      if (Number.isFinite(n)) next.heightCm = n;
      break;
    }
    case "weightKg": {
      const n = Number(value);
      if (Number.isFinite(n)) next.weightKg = n;
      break;
    }
    case "birthday":
      next.birthday = value;
      break;
    case "origin":
      next.origin = value;
      break;
    case "rugbySchool":
      next.rugbySchool = value;
      break;
    case "highSchool":
      next.highSchool = value;
      break;
    case "university":
      next.university = value;
      break;
    case "previousTeam":
      next.previousTeam = value;
      break;
    case "joined":
      next.joined = value;
      break;
    case "nickname":
      next.nickname = value;
      break;
    case "nameKana":
      next.nameKana = value;
      break;
    case "status":
      next.status = value === "former" || value === "過去所属" ? "former" : "current";
      break;
  }
  return next;
}

export type PlayerOverride = {
  playerSlug: string;
  fieldKey: string;
  value: string;
};

export function applyPlayerOverrides(players: Player[], overrides: PlayerOverride[]): Player[] {
  if (overrides.length === 0) return players;
  const grouped = new Map<string, PlayerOverride[]>();
  for (const item of overrides) {
    const list = grouped.get(item.playerSlug) ?? [];
    list.push(item);
    grouped.set(item.playerSlug, list);
  }
  return players.map((player) => {
    const list = grouped.get(player.slug);
    if (!list) return player;
    return list.reduce((acc, item) => patchPlayerField(acc, item.fieldKey, item.value), player);
  });
}

export const SELECT_CLASS =
  "h-11 w-full rounded-[var(--radius-sm)] bg-card px-3 text-sm text-foreground shadow-[var(--shadow-border)] outline-none transition-[box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-ring";
