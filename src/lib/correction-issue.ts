const REPO = "shoichitoyama1976/toda-rugby-player-clips";
const ASSIGNEE = "shoichitoyama1976";

export type CorrectionIssueInput = {
  id: string;
  playerName: string;
  playerSlug: string;
  fieldLabel: string;
  currentValue: string;
  proposedValue: string;
  note: string;
  checkSummary: string;
  pageUrl: string;
};

export async function openCorrectionIssue(input: CorrectionIssueInput): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim();
  if (!token) return false;

  const title = `修正依頼: ${input.playerName} / ${input.fieldLabel}`.slice(0, 120);
  const lines = [
    "選手プロフィールの修正依頼です。担当は當山です。",
    "",
    `- 選手: ${input.playerName}`,
    `- ページ: ${input.pageUrl || `（slug: ${input.playerSlug}）`}`,
    `- 項目: ${input.fieldLabel}`,
    `- 現在: ${input.currentValue || "（空欄）"}`,
    `- 修正案: ${input.proposedValue}`,
    `- メモ: ${input.note || "（なし）"}`,
    `- 照合: ${input.checkSummary || "（なし）"}`,
    `- 依頼ID: ${input.id}`,
  ];

  try {
    const response = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/vnd.github+json",
        "content-type": "application/json",
        "user-agent": "toda-rugby-player-clips",
        "x-github-api-version": "2022-11-28",
      },
      body: JSON.stringify({
        title,
        body: lines.join("\n"),
        assignees: [ASSIGNEE],
      }),
    });
    if (!response.ok) {
      console.error("[correction-issue]", response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[correction-issue]", error instanceof Error ? error.message : "failed");
    return false;
  }
}
