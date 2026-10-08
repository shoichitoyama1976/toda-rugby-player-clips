export type LineupUnit = "FW" | "BK" | "R";

export type LineupSlot = {
  unit: LineupUnit;
  /** 先発はポジション番号。リザーブは着番号。 */
  number: number;
  name: string;
  /** 先発の着番号。括弧内の数字。 */
  shirt?: number;
};

export type Lineup = {
  id: string;
  date: string;
  kickoff: string;
  opponent: string;
  venue: string;
  label: string;
  postUrl: string;
  slots: LineupSlot[];
};

/** 公式アカウントの画像投稿を読み取った出場メンバー。追加するときは投稿の表記のまま書く。 */
export const LINEUPS: Lineup[] = [
  {
    id: "20261010-rugguts",
    date: "2026-10-10",
    kickoff: "13:00",
    opponent: "川越狭山セコムラガッツ",
    venue: "ヤクルト戸田総合グラウンド",
    label: "プレシーズンゲーム #2",
    postUrl: "https://x.com/yakultlevins/status/2108045125842772084",
    slots: [
      { unit: "FW", number: 1, name: "江木畠 悠加", shirt: 24 },
      { unit: "FW", number: 2, name: "上片 風馬", shirt: 37 },
      { unit: "FW", number: 3, name: "渡辺 明志", shirt: 30 },
      { unit: "FW", number: 4, name: "小川 正志", shirt: 23 },
      { unit: "FW", number: 5, name: "岡 大翔", shirt: 54 },
      { unit: "FW", number: 6, name: "半田 巧", shirt: 8 },
      { unit: "FW", number: 7, name: "パトリック・マクカラン", shirt: 49 },
      { unit: "FW", number: 8, name: "ローカン・マクローリン", shirt: 39 },
      { unit: "BK", number: 9, name: "伏見 永城", shirt: 6 },
      { unit: "BK", number: 10, name: "ジェイソン・ロバートソン", shirt: 9 },
      { unit: "BK", number: 11, name: "蕪木 慎太郎", shirt: 51 },
      { unit: "BK", number: 12, name: "齋藤 聡汰", shirt: 67 },
      { unit: "BK", number: 13, name: "アントニオ・ミカエリトゥ", shirt: 33 },
      { unit: "BK", number: 14, name: "高橋 拓行", shirt: 31 },
      { unit: "BK", number: 15, name: "太田 景親", shirt: 14 },
      { unit: "R", number: 11, name: "野崎 伊織" },
      { unit: "R", number: 3, name: "伊藤 光希" },
      { unit: "R", number: 18, name: "長島 幸汰" },
      { unit: "R", number: 5, name: "二浦 瑞樹" },
      { unit: "R", number: 48, name: "林 琉輝" },
      { unit: "R", number: 43, name: "泉谷 尚輝" },
      { unit: "R", number: 52, name: "河野 大地" },
      { unit: "R", number: 69, name: "鈴木 龍" },
      { unit: "R", number: 19, name: "古屋 篤史" },
      { unit: "R", number: 21, name: "青柳 龍之介" },
      { unit: "R", number: 50, name: "臼田 湧人" },
      { unit: "R", number: 25, name: "古川 拓実" },
      { unit: "R", number: 2, name: "須藤 拓真" },
      { unit: "R", number: 42, name: "高田 賢臣" },
      { unit: "R", number: 70, name: "占部 航典" },
      { unit: "R", number: 53, name: "横山 大輔" },
      { unit: "R", number: 26, name: "牧野 真也" },
    ],
  },
];

export function lineupsNewestFirst(): Lineup[] {
  return [...LINEUPS].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

export function lineupById(id: string): Lineup | undefined {
  return LINEUPS.find((lineup) => lineup.id === id);
}
