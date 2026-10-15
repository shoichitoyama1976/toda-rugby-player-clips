import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format";
import { LINEUP_SCHEDULE } from "@/data/schedule-status";
import { refreshPublicSheet } from "@/lib/load-sheet";
import {
  PREVIEW_BRIDGE_CHANNEL,
  PREVIEW_BRIDGE_VERSION,
  resolveCurrentEmbedderOrigin,
} from "@/lib/preview-host-bridge";
import { commitPreview } from "@/lib/save-snapshot";
import { listOpenIssues, type OpenIssue } from "@/lib/open-issues";
import { useCatalog } from "@/lib/use-catalog";
import { cn } from "@/lib/utils";

const PUBLIC_URL = "https://toda-rugby-player-clips.grok.me";

const MODES = [
  {
    id: "ask",
    label: "質問",
    detail: "サイトは変わりません。プレビューも、公開サイトも、そのままです。",
    copy: "質問だけです。プレビューも公開サイトも変えないでください。\n\n",
  },
  {
    id: "preview",
    label: "プレビューを更新",
    detail: "この画面だけ変わります。公開サイトには、まだ出ません。",
    copy: "プレビューだけ更新してください。公開サイトは変えないでください。\n\n",
  },
  {
    id: "publish",
    label: "公開サイトを更新",
    detail: "公開したURLが変わります。プレビューで確認したあと、Grokの公開が必要です。",
    copy: "公開サイトを更新してください。プレビューではなく、公開URLに反映してください。\n\n",
  },
] as const;

const LAST_COMMIT = {
  sha: "489dc9c",
  url: "https://github.com/shoichitoyama1976/toda-rugby-player-clips/commit/489dc9ce06a5eef9eb6f818ce5189fc208c2da48",
  title: "READMEを現在の仕様に合わせる",
};

type ModeId = (typeof MODES)[number]["id"];

function inPreview(): boolean {
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return true;
  return window.parent !== window;
}

function lineupClock(now: number) {
  const created = Date.parse(LINEUP_SCHEDULE.createdAt);
  const expires = Date.parse(LINEUP_SCHEDULE.expiresAt);
  let next = created + LINEUP_SCHEDULE.intervalMs;
  while (next <= now) next += LINEUP_SCHEDULE.intervalMs;
  const expired = now >= expires;
  const willRun = !expired && next <= expires;
  const weekday = new Intl.DateTimeFormat("ja-JP", {
    weekday: "short",
    timeZone: "Asia/Tokyo",
  }).format(next);
  return {
    next: willRun ? next : null,
    expires,
    expired,
    showContinue: expired || expires - now <= 24 * 60 * 60 * 1000,
    works: weekday === "木" || weekday === "金",
  };
}

export function PreviewStatus() {
  const router = useRouter();
  const { configured, usingSheet, sheetError, fetchedAt, cacheMs, sheetRows } = useCatalog();
  const [shown, setShown] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<ModeId>("preview");
  const [copied, setCopied] = useState(false);
  const [publishNote, setPublishNote] = useState<string | null>(null);
  const [continued, setContinued] = useState(false);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [commit, setCommit] = useState(LAST_COMMIT);
  const [issues, setIssues] = useState<OpenIssue[] | null>(null);
  const [issueNote, setIssueNote] = useState<string | null>(null);

  useEffect(() => {
    const preview = inPreview();
    setShown(preview);
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    if (preview) {
      void listOpenIssues().then((result) => {
        if (result.ok) setIssues(result.issues);
        else setIssueNote(result.error);
      });
    }
    return () => window.clearInterval(timer);
  }, []);

  if (!shown) return null;

  const current = MODES.find((item) => item.id === mode) ?? MODES[1];
  const remain = fetchedAt ? Math.max(0, fetchedAt + cacheMs - now) : 0;
  const minutes = Math.ceil(remain / 60_000);
  const next =
    !configured || !fetchedAt
      ? null
      : minutes <= 0
        ? "次に開いたとき読み直します"
        : `次の自動読み込みは約${minutes}分後`;

  async function choose(nextMode: ModeId) {
    setMode(nextMode);
    setCopied(false);
    setPublishNote(null);
    const item = MODES.find((entry) => entry.id === nextMode);
    if (!item) return;
    if (nextMode === "publish") {
      const origin = resolveCurrentEmbedderOrigin();
      if (origin) {
        window.parent.postMessage(
          {
            channel: PREVIEW_BRIDGE_CHANNEL,
            version: PREVIEW_BRIDGE_VERSION,
            type: "request-publish",
            url: PUBLIC_URL,
          },
          origin,
        );
      }
      setPublishNote(
        "この画面からは公開サイトを書き換えられません。コピーした一文を会話に貼り、Grokの公開を押すと URL が更新されます。",
      );
    }
    try {
      await navigator.clipboard.writeText(item.copy);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const schedule = lineupClock(now);

  async function requestSave() {
    setSaving(true);
    setSaveNote(null);
    const result = await commitPreview();
    setSaving(false);
    if (!result.ok) {
      setSaveNote(result.error);
      return;
    }
    if (result.unchanged) {
      setSaveNote("変更はありません。名簿、記事の行、合い言葉、鍵は対象外です。");
      return;
    }
    setCommit({
      sha: result.sha.slice(0, 7),
      url: result.url,
      title: result.message,
    });
    setSaveNote(`残しました。${result.files} ファイル。名簿、記事の行、合い言葉、鍵は入れていません。`);
  }

  async function continueSchedule() {
    setContinued(false);
    try {
      await navigator.clipboard.writeText(
        `試合メンバーの定期実行を、同じ内容で7日続けてください。予約IDは ${LINEUP_SCHEDULE.id} です。\nMatchesの日付は yyyy/MM/dd、キックオフは hh:mm:ss で入れてください。\n\n`,
      );
      setContinued(true);
    } catch {
      setContinued(false);
    }
  }

  return (
    <div className="border-b border-border bg-muted">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-2 text-[11px] leading-relaxed text-muted-foreground">
        <div
          className="grid grid-cols-3 overflow-hidden rounded-full border border-border bg-background"
          role="group"
          aria-label="この送信ですること"
        >
          {MODES.map((item) => {
            const selected = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => void choose(item.id)}
                className={cn(
                  "h-9 px-2 text-[11px] sm:text-xs",
                  selected
                    ? "bg-primary font-medium text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <p>
          <span className="text-foreground">{current.detail}</span>
          {copied ? " 送る一文をコピーしました。会話の先頭に貼ってください。" : ""}
        </p>
        <p>
          いま見ているのはプレビューです。公開サイトは {PUBLIC_URL}
          。検索はサイト側で許可しています。出すか出さないかは、Grokの公開設定です。
        </p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {configured && usingSheet ? (
            <span>
              記事 {sheetRows.clips} · 名簿 {sheetRows.players} · 試合 {sheetRows.matches} · メンバー{" "}
              {sheetRows.lineups}
              {fetchedAt ? ` · 最終取得 ${formatDateTime(fetchedAt)}` : ""}
              {next ? ` · ${next}` : ""}
            </span>
          ) : (
            <span>{sheetError ?? "シートはまだ接続されていません。"}</span>
          )}
          <button
            type="button"
            disabled={busy || !configured}
            onClick={() => {
              setBusy(true);
              void refreshPublicSheet()
                .then(() => router.invalidate())
                .finally(() => setBusy(false));
            }}
            className="text-accent hover:text-foreground disabled:opacity-50"
          >
            {busy ? "読み込み中" : "いま読み直す"}
          </button>
        </p>
        {publishNote ? <p className="text-foreground">{publishNote}</p> : null}
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>
            定期実行 · 公式Xのメンバー
            {schedule.expired ? (
              " · 期限が切れています"
            ) : schedule.next ? (
              <>
                {" · 次 "}
                {formatDateTime(schedule.next)}
                {schedule.works ? "（この回は取得します）" : "（この回は木曜・金曜ではないので取りません）"}
              </>
            ) : (
              " · 次の実行はありません"
            )}
            {" · 前回 "}
            {LINEUP_SCHEDULE.lastResultUrl ? (
              <a href={LINEUP_SCHEDULE.lastResultUrl} className="text-accent hover:text-foreground">
                スプレッドシート
              </a>
            ) : (
              LINEUP_SCHEDULE.lastResultNote
            )}
            {" · 期限 "}
            {formatDateTime(schedule.expires)}
          </span>
          {schedule.showContinue ? (
            <button
              type="button"
              onClick={() => void continueSchedule()}
              className="h-8 rounded-full bg-primary px-3 text-primary-foreground"
            >
              続ける
            </button>
          ) : null}
        </p>
        {continued ? (
          <p className="text-foreground">続ける一文をコピーしました。会話の先頭に貼ってください。</p>
        ) : null}
        <div>
          <p className="text-foreground">オープン Issue</p>
          {issueNote ? <p>{issueNote}</p> : null}
          {issues && issues.length === 0 ? <p>開いている Issue はありません。</p> : null}
          {issues && issues.length > 0 ? (
            <ul className="mt-1 space-y-1">
              {issues.map((issue) => (
                <li key={issue.number}>
                  <a href={issue.url} className="text-accent hover:text-foreground">
                    #{issue.number} {issue.title}
                  </a>
                  <span> · {issue.assignee}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>
            最後に残した{" "}
            <a href={commit.url} className="text-accent hover:text-foreground">
              {commit.sha}
            </a>
            {" · "}
            {commit.title}
          </span>
          <button
            type="button"
            disabled={saving}
            onClick={() => void requestSave()}
            className="h-8 rounded-full bg-primary px-3 text-primary-foreground disabled:opacity-50"
          >
            {saving ? "残しています" : "コミット"}
          </button>
        </p>
        {saveNote ? <p className="text-foreground">{saveNote}</p> : null}
      </div>
    </div>
  );
}
