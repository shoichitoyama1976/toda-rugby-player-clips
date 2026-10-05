import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatProposed, PROFILE_FIELD_LABEL } from "@/data/profile-fields";
import { correctionMarkdown } from "@/lib/correction-log";
import { formatDateTime } from "@/lib/format";
import {
  listProfileRequests,
  publishProfileRequest,
  reviewProfileRequest,
  type ProfileRequest,
} from "@/lib/profile-requests";

export const Route = createFileRoute("/inbox")({ component: InboxPage });

function InboxPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [requests, setRequests] = useState<ProfileRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function unlock(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await listProfileRequests({ data: { pin } });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setRequests(result.requests);
  }

  async function refresh() {
    const next = await listProfileRequests({ data: { pin } });
    if (next.ok) setRequests(next.requests);
  }

  async function act(id: string, action: "approve" | "reject") {
    setBusy(true);
    setError(null);
    const result = await reviewProfileRequest({ data: { pin, id, action } });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await refresh();
    if (action === "approve") await router.invalidate();
  }

  async function markPublished(id: string) {
    setBusy(true);
    setError(null);
    const result = await publishProfileRequest({ data: { pin, id } });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDraft(result.draft);
    setCopied(false);
    await refresh();
    await router.invalidate();
  }

  function downloadMarkdown(rows: ProfileRequest[]) {
    const blob = new Blob([correctionMarkdown(rows)], { type: "text/markdown;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "修正依頼一覧.md";
    a.click();
    URL.revokeObjectURL(href);
  }

  if (!requests) {
    return (
      <div className="max-w-md space-y-6">
        <h1 className="font-display text-3xl tracking-tight">運営者</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          修正依頼の承認ページです。合い言葉は公開しません。承認しても名簿は自動では変わりません。
        </p>
        <form onSubmit={(event) => void unlock(event)} className="space-y-4">
          <Input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="合い言葉"
            autoComplete="off"
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={busy || !pin}>
            {busy ? "確認中" : "開く"}
          </Button>
        </form>
      </div>
    );
  }

  const pending = requests.filter((item) => item.status === "checked");
  const waiting = requests.filter((item) => item.status === "approved");
  const others = requests.filter((item) => item.status !== "checked" && item.status !== "approved");

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="font-display text-3xl tracking-tight">修正依頼</h1>
        <p className="text-sm text-muted-foreground">
          承認すると選手ページに案内が出ます。スプレッドシートを直したあと、「シートを更新した」を押すと、案内が更新済みに変わり、Xの下書きができます。
        </p>
        <Button variant="outline" onClick={() => downloadMarkdown(requests)}>
          一覧をmdで保存
        </Button>
      </header>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {draft ? (
        <section className="space-y-3 rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-xl tracking-tight">Xの下書き</h2>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed">{draft}</pre>
          <Button
            variant="outline"
            onClick={() => {
              void navigator.clipboard.writeText(draft).then(() => setCopied(true));
            }}
          >
            {copied ? "コピーしました" : "コピーする"}
          </Button>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-xl tracking-tight">未処理 {pending.length}</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">未処理はありません。</p>
        ) : (
          pending.map((item) => (
            <RequestCard
              key={item.id}
              item={item}
              busy={busy}
              onApprove={() => void act(item.id, "approve")}
              onReject={() => void act(item.id, "reject")}
            />
          ))
        )}
      </section>

      {waiting.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-xl tracking-tight">シート待ち {waiting.length}</h2>
          {waiting.map((item) => (
            <RequestCard
              key={item.id}
              item={item}
              busy={busy}
              onPublish={() => void markPublished(item.id)}
            />
          ))}
        </section>
      ) : null}

      {others.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-xl tracking-tight">処理済み</h2>
          {others.map((item) => (
            <RequestCard key={item.id} item={item} busy />
          ))}
        </section>
      ) : null}
    </div>
  );
}

function RequestCard({
  item,
  busy,
  onApprove,
  onReject,
  onPublish,
}: {
  item: ProfileRequest;
  busy: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onPublish?: () => void;
}) {
  const field = PROFILE_FIELD_LABEL[item.fieldKey] ?? item.fieldKey;
  const proposed = formatProposed(item.fieldKey, item.proposedValue);
  return (
    <article className="space-y-3 rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg tracking-tight">
          {item.playerName} · {field}
        </h3>
        <p className="text-[11px] text-muted-foreground">
          {item.createdAt ? formatDateTime(Date.parse(item.createdAt)) : ""}
        </p>
      </div>
      <p className="text-sm">
        {item.currentValue || "（空）"} → {proposed}
      </p>
      {item.note ? <p className="text-xs text-muted-foreground">根拠: {item.note}</p> : null}
      <p className="text-xs leading-relaxed text-muted-foreground">{item.checkSummary}</p>
      {item.checkSources.length > 0 ? (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {item.checkSources.map((source) => (
            <li key={source.url}>
              <a href={source.url} className="text-accent hover:text-foreground" target="_blank" rel="noreferrer">
                {source.label}
              </a>
              {source.found ? " · 値あり" : " · 未検出"}
            </li>
          ))}
        </ul>
      ) : null}
      {item.status === "approved" ? (
        <p className="text-xs text-accent">
          承認済み。選手一覧タブ「{item.playerName}」の「{field}」を {proposed} に直してください。
        </p>
      ) : null}
      {item.status === "published" ? <p className="text-xs text-accent">名簿を更新済み</p> : null}
      {item.status === "rejected" ? <p className="text-xs text-muted-foreground">見送り</p> : null}
      {onApprove && onReject ? (
        <div className="flex flex-wrap gap-2">
          <Button onClick={onApprove} disabled={busy}>
            承認する
          </Button>
          <Button variant="outline" onClick={onReject} disabled={busy}>
            見送り
          </Button>
        </div>
      ) : null}
      {onPublish ? (
        <Button onClick={onPublish} disabled={busy}>
          シートを更新した
        </Button>
      ) : null}
    </article>
  );
}
