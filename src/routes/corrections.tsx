import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatProposed,
  playerFieldValue,
  PREFECTURES,
  PROFILE_FIELDS,
  SELECT_CLASS,
  type ProfileFieldKey,
} from "@/data/profile-fields";
import { POSITION_LABEL, POSITIONS } from "@/data/types";
import { submitProfileRequest } from "@/lib/profile-requests";
import { useCatalog } from "@/lib/use-catalog";

type Search = { slug?: string };

export const Route = createFileRoute("/corrections")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    slug: typeof search.slug === "string" ? search.slug : undefined,
  }),
  component: CorrectionsPage,
});

const HEIGHTS = Array.from({ length: 56 }, (_, i) => 160 + i);
const WEIGHTS = Array.from({ length: 81 }, (_, i) => 70 + i);
const YEARS = Array.from({ length: 18 }, (_, i) => 2010 + i);

function CorrectionsPage() {
  const { slug: preset } = Route.useSearch();
  const { players } = useCatalog();
  const roster = useMemo(
    () => players.filter((player) => !player.unlisted).sort((a, b) => a.name.localeCompare(b.name, "ja")),
    [players],
  );

  const [slug, setSlug] = useState(preset ?? "");
  const [fieldKey, setFieldKey] = useState<ProfileFieldKey>("position");
  const [proposed, setProposed] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{
    id: string;
    summary: string;
    verdict: string;
    current: string;
    proposed: string;
    filed: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const player = roster.find((item) => item.slug === slug);
  const field = PROFILE_FIELDS.find((item) => item.key === fieldKey) ?? PROFILE_FIELDS[0];
  const current = player ? playerFieldValue(player, fieldKey) : "";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const result = await submitProfileRequest({
      data: { playerSlug: slug, fieldKey, proposedValue: proposed, note },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone({
      id: result.id,
      summary: result.check.summary,
      verdict: result.check.verdict,
      current: result.current,
      proposed: result.proposed,
      filed: result.filed,
    });
  }

  if (done) {
    return (
      <div className="max-w-xl space-y-6">
        <h1 className="font-display text-3xl tracking-tight">依頼を受け付けました</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          公開情報と照らし合わせたうえで、運営者が承認すると選手ページに案内が出ます。名簿の内容は、運営者がシートを直してから変わります。
          {done.filed ? " 同じ内容を GitHub の Issue に記録し、當山が担当します。" : ""}
        </p>
        <div className="space-y-3 rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
          <p className="text-xs text-accent">
            {done.verdict === "supports" ? "公開情報に近い記述がありました" : "自動では確定できませんでした"}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">{done.summary}</p>
          <p className="text-sm">
            {done.current || "（空欄）"} → {done.proposed}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setDone(null);
              setProposed("");
              setNote("");
            }}
          >
            別の項目を送る
          </Button>
          <Button asChild variant="ghost">
            <Link to="/players">選手一覧へ</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="text-[11px] tracking-[0.22em] text-accent">CORRECTION</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight">選手プロフィール修正依頼</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          ポジションや身長などの誤り、掲載してほしくない記事やXを知らせるページです。個人の連絡先や非公開の情報は書かないでください。送った内容は公開情報と照らし、運営者が確認します。名簿への反映は手作業です。
        </p>
      </header>

      <form onSubmit={(event) => void onSubmit(event)} className="max-w-xl space-y-5">
        <Field label="選手">
          <select
            className={SELECT_CLASS}
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setProposed("");
            }}
            required
          >
            <option value="">選手を選ぶ</option>
            {roster.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}（{item.position}）
              </option>
            ))}
          </select>
        </Field>

        <Field label="項目">
          <select
            className={SELECT_CLASS}
            value={fieldKey}
            onChange={(e) => {
              setFieldKey(e.target.value as ProfileFieldKey);
              setProposed("");
            }}
          >
            {PROFILE_FIELDS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>

        {player ? (
          <p className="text-xs text-muted-foreground">
            現在の表示: {current || "（空欄）"}
          </p>
        ) : null}

        <Field label={fieldKey === "removal" ? "外してほしいURL" : "正しい内容"}>
          <ValueInput kind={field.input} value={proposed} onChange={setProposed} />
        </Field>

        <Field label="根拠になるページ（任意）">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="https://..."
            maxLength={200}
          />
        </Field>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" disabled={busy || !slug || !proposed}>
          {busy ? "確認しています" : "送信する"}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function ValueInput({
  kind,
  value,
  onChange,
}: {
  kind: (typeof PROFILE_FIELDS)[number]["input"];
  value: string;
  onChange: (value: string) => void;
}) {
  if (kind === "position") {
    return (
      <select className={SELECT_CLASS} value={value} onChange={(e) => onChange(e.target.value)} required>
        <option value="">選ぶ</option>
        {POSITIONS.map((pos) => (
          <option key={pos} value={pos}>
            {pos} {POSITION_LABEL[pos]}
          </option>
        ))}
      </select>
    );
  }
  if (kind === "height") {
    return (
      <select className={SELECT_CLASS} value={value} onChange={(e) => onChange(e.target.value)} required>
        <option value="">選ぶ</option>
        {HEIGHTS.map((n) => (
          <option key={n} value={String(n)}>
            {n} cm
          </option>
        ))}
      </select>
    );
  }
  if (kind === "weight") {
    return (
      <select className={SELECT_CLASS} value={value} onChange={(e) => onChange(e.target.value)} required>
        <option value="">選ぶ</option>
        {WEIGHTS.map((n) => (
          <option key={n} value={String(n)}>
            {n} kg
          </option>
        ))}
      </select>
    );
  }
  if (kind === "prefecture") {
    return (
      <select className={SELECT_CLASS} value={value} onChange={(e) => onChange(e.target.value)} required>
        <option value="">選ぶ</option>
        {PREFECTURES.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    );
  }
  if (kind === "year") {
    return (
      <select className={SELECT_CLASS} value={value} onChange={(e) => onChange(e.target.value)} required>
        <option value="">選ぶ</option>
        {YEARS.map((n) => (
          <option key={n} value={String(n)}>
            {n}年
          </option>
        ))}
      </select>
    );
  }
  if (kind === "status") {
    return (
      <select className={SELECT_CLASS} value={value} onChange={(e) => onChange(e.target.value)} required>
        <option value="">選ぶ</option>
        <option value="current">在籍</option>
        <option value="former">過去所属</option>
      </select>
    );
  }
  if (kind === "birthday") {
    return (
      <input
        type="date"
        className={SELECT_CLASS}
        value={value}
        min="1985-01-01"
        max="2010-12-31"
        onChange={(e) => onChange(e.target.value)}
        required
      />
    );
  }
  if (kind === "url") {
    return (
      <Input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={200}
        required
        placeholder="https://..."
      />
    );
  }
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={80}
      required
      placeholder=""
    />
  );
}
