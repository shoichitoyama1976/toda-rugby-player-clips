import { createFileRoute } from "@tanstack/react-router";
import { formatDate } from "@/lib/format";
import { SITE_NAME } from "@/lib/seo";
import { useCatalog } from "@/lib/use-catalog";

export const Route = createFileRoute("/events")({
  component: EventsPage,
  head: () => ({
    meta: [
      { title: `イベント｜${SITE_NAME}` },
      {
        name: "description",
        content: "試合以外のレビンズの予定です。練習見学会など、公式の告知へ案内します。",
      },
    ],
  }),
});

function EventsPage() {
  const { events } = useCatalog();

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl tracking-tight">イベント</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          試合のない週の予定です。公式の告知は、元の投稿を開いて確認してください。
        </p>
      </header>
      {events.length === 0 ? (
        <p className="rounded-[var(--radius-md)] bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
          まだありません。
        </p>
      ) : (
        <div className="grid gap-3">
          {events.map((event) => (
            <article
              key={event.id}
              className="rounded-[var(--radius-lg)] bg-card p-4 shadow-[var(--shadow-border)]"
            >
              <p className="text-[11px] tracking-wide text-accent">
                {formatDate(event.date)}（{weekday(event.date)}）
              </p>
              <h2 className="mt-2 font-display text-2xl leading-tight">{event.name}</h2>
              {event.summary ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{event.summary}</p>
              ) : null}
              {event.url ? (
                <p className="mt-4">
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center text-sm text-accent hover:text-foreground"
                  >
                    レビンズの公式Xの投稿を開く
                  </a>
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function weekday(iso: string): string {
  const date = new Date(`${iso}T00:00:00+09:00`);
  return new Intl.DateTimeFormat("ja-JP", { weekday: "short", timeZone: "Asia/Tokyo" }).format(date);
}
