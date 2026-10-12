import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { createServerFn } from "@tanstack/react-start";
import { env } from "@/lib/env.server";

const OWNER = "shoichitoyama1976";
const REPO = "toda-rugby-player-clips";
const ROOT = "/workspace";
const SKIP = new Set([
  "src/data/players.ts",
  "src/data/articles.ts",
  "src/data/lineups.ts",
]);

type SaveResult =
  | { ok: true; unchanged: true }
  | { ok: true; unchanged: false; sha: string; url: string; message: string; files: number }
  | { ok: false; error: string };

function githubToken(): string | null {
  const fromEnv = process.env.GITHUB_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  try {
    const file = readFileSync("/tmp/grok/connectors/github.token", "utf8").trim();
    return file || null;
  } catch {
    return null;
  }
}

function blobSha(body: Buffer): string {
  return createHash("sha1").update(`blob ${body.length}\0`).update(body).digest("hex");
}

function skipped(path: string): boolean {
  if (path.startsWith("public/__grok/")) return true;
  const name = path.toLowerCase();
  return (
    name.includes(".env") ||
    name.includes("token") ||
    name.includes("secret") ||
    name.endsWith(".pem") ||
    name.includes("node_modules/")
  );
}

function localFiles(): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const abs = join(dir, entry);
      const rel = relative(ROOT, abs).replaceAll("\\", "/");
      if (skipped(rel)) continue;
      const stat = statSync(abs);
      if (stat.isDirectory()) {
        if (entry === "node_modules" || entry.startsWith(".")) continue;
        walk(abs);
        continue;
      }
      if (stat.size > 1_500_000) continue;
      found.push(rel);
    }
  };
  walk(join(ROOT, "src"));
  walk(join(ROOT, "public"));
  for (const extra of ["README.md", "package.json"]) {
    if (!skipped(extra)) found.push(extra);
  }
  return found;
}

async function github(token: string, path: string, init?: RequestInit) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "user-agent": "toda-clips",
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub ${res.status}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

async function saveSnapshot(): Promise<SaveResult> {
  if (env("GROK_PROJECT_ID")) {
    return { ok: false, error: "公開サイトからは残せません。プレビューで押してください。" };
  }
  const token = githubToken();
  if (!token) {
    return { ok: false, error: "GitHubの鍵がありません。この画面からは残せません。" };
  }
  try {
    const ref = await github(token, `/repos/${OWNER}/${REPO}/git/ref/heads/main`);
    const parent = (ref.object as { sha: string }).sha;
    const commit = await github(token, `/repos/${OWNER}/${REPO}/git/commits/${parent}`);
    const treeSha = (commit.tree as { sha: string }).sha;
    const tree = await github(token, `/repos/${OWNER}/${REPO}/git/trees/${treeSha}?recursive=1`);
    const remote = new Map<string, string>();
    for (const item of tree.tree as { path: string; type: string; sha: string }[]) {
      if (item.type === "blob") remote.set(item.path, item.sha);
    }

    const changed: { path: string; sha: string }[] = [];
    for (const path of localFiles()) {
      const body = readFileSync(join(ROOT, path));
      const sha = blobSha(body);
      if (remote.get(path) === sha) continue;
      const blob = await github(token, `/repos/${OWNER}/${REPO}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({ content: body.toString("base64"), encoding: "base64" }),
      });
      changed.push({ path, sha: String(blob.sha) });
    }
    if (changed.length === 0) return { ok: true, unchanged: true };

    const message = "プレビューからこの時点を残す";
    const nextTree = await github(token, `/repos/${OWNER}/${REPO}/git/trees`, {
      method: "POST",
      body: JSON.stringify({
        base_tree: treeSha,
        tree: changed.map((item) => ({
          path: item.path,
          mode: "100644",
          type: "blob",
          sha: item.sha,
        })),
      }),
    });
    const next = await github(token, `/repos/${OWNER}/${REPO}/git/commits`, {
      method: "POST",
      body: JSON.stringify({
        message,
        tree: nextTree.sha,
        parents: [parent],
      }),
    });
    const sha = String(next.sha);
    await github(token, `/repos/${OWNER}/${REPO}/git/refs/heads/main`, {
      method: "PATCH",
      body: JSON.stringify({ sha }),
    });
    return {
      ok: true,
      unchanged: false,
      sha,
      url: `https://github.com/${OWNER}/${REPO}/commit/${sha}`,
      message,
      files: changed.length,
    };
  } catch {
    return { ok: false, error: "GitHubに残せませんでした。しばらくしてから、もう一度押してください。" };
  }
}

export const commitPreview = createServerFn({ method: "POST" }).handler(async () => saveSnapshot());
