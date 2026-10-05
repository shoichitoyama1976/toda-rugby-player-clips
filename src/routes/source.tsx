import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SHEET_COLUMNS, SHEET_TEMPLATE_CSV, PLAYER_SHEET_COLUMNS } from "@/data/types";
import { formatDateTime } from "@/lib/format";
import { refreshPublicSheet } from "@/lib/load-sheet";
import { loadNameCheck, type NameCheckItem } from "@/lib/name-check";
import { useCatalog } from "@/lib/use-catalog";

export const Route = createFileRoute("/source")({
  loader: async () => ({ nameCheck: await loadNameCheck() }),
  component: SourcePage,
});

function SourcePage() {
  const router = useRouter();
  const loaded = Route.useLoaderData().nameCheck;
  const { usingSheet, configured, sheetError, unmatched, articles, fetchedAt, playerSheetCount } =
    useCatalog();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [nameCheck, setNameCheck] = useState(loaded);

  useEffect(() => {
    setNameCheck(loaded);
  }, [loaded]);

  useEffect(() => {
    if (nameCheck.status !== "running") return;
    const timer = window.setInterval(() => {
      void loadNameCheck().then(setNameCheck);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [nameCheck.status]);

  function downloadTemplate() {
    const blob = new Blob([SHEET_TEMPLATE_CSV], { type: "text/csv;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "toda-press-template.csv";
    a.click();
    URL.revokeObjectURL(href);
  }

  async function reloadSheet() {
    setBusy(true);
    setMessage(null);
    const result = await refreshPublicSheet();
    await router.invalidate();
    setBusy(false);
    if (!result.configured) {
      setMessage("シートURLがまだ固定されていません。この会話に共有リンクを貼ってください。");
      return;
    }
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setMessage("シートを取り直しました。内容が変わっていれば、氏名照合を始めます。");
  }

  return (
    <div className="space-y-10">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl tracking-tight">使い方</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          記事の元データは Google スプレッドシートです。このサイトは、それを見やすくした一覧です。訪問者のログインはありません。シートを「閲覧だけ」公開し、そのURLをサイトに固定します。
        </p>
      </header>

      <section className="space-y-4 rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl tracking-tight">シートのつなぎ方</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Google スプレッドシートを開く。</li>
          <li>右上の「共有」→ 一般的なアクセスを「リンクを知っている全員」→ 役割は「閲覧者」（編集者にしない）。</li>
          <li>「リンクをコピー」する。タブ名は「Clips」（記事）と「Players」（選手）でも、「掲載記事一覧」「選手一覧」でも読めます。</li>
          <li>そのURLを、このGrokの会話に貼る。こちらでサイト全体の正本として固定します。</li>
        </ol>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Googleアカウントでサイトにログインする方式ではありません。閲覧用リンクがあれば、訪問者全員が同じ一覧を見ます。選手の属性（ラグビースクールなど、公式にない列も）は選手一覧タブから載せます。未知の列名はそのまま選手ページに出ます。
        </p>
        {!configured ? (
          <p className="rounded-[var(--radius-md)] bg-muted px-3 py-3 text-xs leading-relaxed text-muted-foreground">
            まだ固定していません。サンプル記事を表示中です。共有リンクを会話へ貼ってください。
          </p>
        ) : usingSheet ? (
          <p className="text-xs text-accent">
            接続中 · 記事 {articles.length} 件
            {playerSheetCount > 0 ? ` · 名簿 ${playerSheetCount} 人` : ""}
            {fetchedAt ? ` · 最終取得 ${formatDateTime(fetchedAt)}` : ""}
          </p>
        ) : (
          <p className="rounded-[var(--radius-md)] bg-muted px-3 py-3 text-xs leading-relaxed text-muted-foreground">
            {sheetError}
          </p>
        )}
        <Button variant="outline" onClick={() => void reloadSheet()} disabled={busy || !configured}>
          {busy ? "読み込み中" : "再読み込み"}
        </Button>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        {unmatched.length > 0 ? (
          <div className="rounded-[var(--radius-md)] bg-muted px-3 py-3 text-xs leading-relaxed text-muted-foreground">
            名簿に無いID（記事には残します）: {unmatched.join("、")}
          </div>
        ) : null}
      </section>

      <NameCheckPanel items={nameCheck.items} status={nameCheck.status} checkedAt={nameCheck.checkedAt} />

      <section className="space-y-4 rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl tracking-tight">更新の確認</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          シートは保存した時点で Google 側は更新済みです。サイトは最大5分キャッシュします。すぐ確認するときは「再読み込み」です。
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>シートにテスト行を1行足す。タイトルは「反映テスト」など、一覧で見つけやすい文言にする。</li>
          <li>このページの「再読み込み」を押す。最終取得の時刻が今になれば、取り直しは成功。</li>
          <li>「記事」一覧の先頭付近に、そのタイトルが出れば反映できています。</li>
          <li>テスト行を消して、もう一度「再読み込み」。一覧から消えることを確認する。</li>
        </ol>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl tracking-tight">記事タブの列</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              タブ名は「Clips」。1行目は列名。1行が「選手ID × 記事」。同じURLを複数IDで書けば、カードは1枚にまとまり登場選手が並びます。カード見出しは「タイトル」列です。URLの無い行は読みません。
            </p>
          </div>
          <Button variant="outline" onClick={downloadTemplate}>
            テンプレートCSV
          </Button>
        </div>
        <div className="overflow-x-auto rounded-[var(--radius-lg)] bg-card shadow-[var(--shadow-border)]">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] text-muted-foreground">
                <th className="px-4 py-3 font-medium">列名</th>
                <th className="px-4 py-3 font-medium">必須</th>
                <th className="px-4 py-3 font-medium">例</th>
              </tr>
            </thead>
            <tbody>
              {SHEET_COLUMNS.map((col) => (
                <tr key={col.key} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">{col.headers[0]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{col.required ? "必須" : "任意"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{col.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          列の型やシートのつなぎ方は公開しています。修正依頼の承認は運営者ページからです。
        </p>
      </section>

      <section className="space-y-3 rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl tracking-tight">修正の流れ</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>訪問者が選手と項目を選んで依頼する。</li>
          <li>サイトが公式ページ・Wikipediaなど公開情報と照合する。</li>
          <li>運営者が承認すると、選手ページに「修正依頼が届いている」と出る。名簿の数字はまだ変えない。</li>
          <li>運営者がスプレッドシートを直したあと、運営者ページで「シートを更新した」とする。選手ページの案内が「項目を修正しました」に変わる。</li>
        </ol>
        <Link to="/inbox" className="inline-flex h-11 items-center text-sm text-accent">
          運営者ページ
        </Link>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-xl tracking-tight">選手タブの列</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            タブ名は「Players」。ID が Clips と紐づきます。氏名があれば足ります。年齢と在籍年数は、生年月日と加入年度（退団年度があればそれ）からサイト側で出します。シートの「年齢」「在籍年数」列は外して構いません。「経歴」にはクラブの前所属だけでなく、代表歴も書けます。
          </p>
        </div>
        <div className="overflow-x-auto rounded-[var(--radius-lg)] bg-card shadow-[var(--shadow-border)]">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] text-muted-foreground">
                <th className="px-4 py-3 font-medium">列名</th>
                <th className="px-4 py-3 font-medium">必須</th>
                <th className="px-4 py-3 font-medium">例</th>
              </tr>
            </thead>
            <tbody>
              {PLAYER_SHEET_COLUMNS.filter((col) =>
                [
                  "sheetId",
                  "name",
                  "category",
                  "nameKana",
                  "nickname",
                  "sutoCall",
                  "position",
                  "heightCm",
                  "weightKg",
                  "origin",
                  "rugbySchool",
                  "highSchool",
                  "university",
                  "previousTeam",
                  "birthday",
                  "joined",
                  "xUrl",
                  "instagramUrl",
                  "noteUrl",
                ].includes(col.key),
              ).map((col) => (
                <tr key={col.key} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">{col.headers[0]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{col.required ? "必須" : "任意"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{col.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function NameCheckPanel({
  items,
  status,
  checkedAt,
}: {
  items: NameCheckItem[];
  status: "idle" | "running" | "done";
  checkedAt: number | null;
}) {
  const counts = {
    all: items.filter((item) => item.result === "all").length,
    skip: items.filter((item) => item.result === "skip").length,
    miss: items.filter((item) => item.result === "none" || item.result === "partial").length,
    error: items.filter((item) => item.result === "error").length,
  };
  const problems = items.filter(
    (item) => item.result === "none" || item.result === "partial" || item.result === "error",
  );

  return (
    <section className="space-y-4 rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
      <h2 className="font-display text-xl tracking-tight">氏名の照合</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        シートの内容が変わると、リンク先のページに選手名があるかを取りにいきます。X や YouTube、Instagram
        は本文が取れないので対象外です。
      </p>
      <p className="text-xs text-accent">
        {status === "running"
          ? "照合しています…"
          : status === "done"
            ? `氏名あり ${counts.all} · 対象外 ${counts.skip} · 見つからない ${counts.miss} · 取得失敗 ${counts.error}`
            : "まだ照合していません。シートを読み込むと始まります。"}
        {checkedAt && status === "done" ? ` · ${formatDateTime(checkedAt)}` : ""}
      </p>
      {problems.length > 0 ? (
        <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          {problems.map((item) => (
            <li key={item.url} className="rounded-[var(--radius-md)] bg-muted px-3 py-3">
              <p className="text-foreground">{item.title || item.url}</p>
              <p className="mt-1 text-xs">
                {item.result === "error"
                  ? `取得できませんでした${item.error ? `（${item.error}）` : ""}`
                  : `本文に無い氏名: ${item.missing.join("、")}`}
              </p>
            </li>
          ))}
        </ul>
      ) : status === "done" ? (
        <p className="text-sm text-muted-foreground">ウェブ記事では、紐づけた氏名が見つかりました。</p>
      ) : null}
    </section>
  );
}
