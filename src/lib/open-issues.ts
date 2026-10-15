import { readFileSync } from "node:fs";
import { createServerFn } from "@tanstack/react-start";

const REPO = "shoichitoyama1976/toda-rugby-player-clips";

export type OpenIssue = {
  number: number;
  title: string;
  url: string;
  assignee: string;
};

function githubToken(): string | null {
  const fromEnv = process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  try {
    const file = readFileSync("/tmp/grok/connectors/github.token", "utf8").trim();
    return file || null;
  } catch {
    return null;
  }
}

function assigneeLabel(login: string | undefined): string {
  if (!login) return "未担当";
  if (login === "shoichitoyama1976") return "當山";
  return login;
}

export const listOpenIssues = createServerFn({ method: "GET" }).handler(async (): Promise<
  { ok: true; issues: OpenIssue[] } | { ok: false; error: string }
> => {
  const token = githubToken();
  if (!token) return { ok: false, error: "GitHubに接続できません。" };
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO}/issues?state=open&per_page=30`,
      {
        headers: {
          authorization: `Bearer ${token}`,
          accept: "application/vnd.github+json",
          "user-agent": "toda-rugby-player-clips",
          "x-github-api-version": "2022-11-28",
        },
      },
    );
    if (!response.ok) return { ok: false, error: "Issueを読めませんでした。" };
    const rows = (await response.json()) as Array<{
      number?: number;
      title?: string;
      html_url?: string;
      pull_request?: unknown;
      assignees?: Array<{ login?: string }>;
    }>;
    const issues = rows
      .filter((row) => !row.pull_request && row.number && row.title && row.html_url)
      .map((row) => ({
        number: row.number as number,
        title: row.title as string,
        url: row.html_url as string,
        assignee: assigneeLabel(row.assignees?.[0]?.login),
      }));
    return { ok: true, issues };
  } catch {
    return { ok: false, error: "Issueを読めませんでした。" };
  }
});
