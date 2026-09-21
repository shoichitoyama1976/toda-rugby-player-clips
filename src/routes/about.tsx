import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({ component: AboutPage });

function AboutPage() {
  return (
    <div className="space-y-10">
      <header className="max-w-2xl">
        <p className="text-[11px] tracking-[0.22em] text-accent">ABOUT</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight">このサイトについて</h1>
      </header>

      <section id="purpose" className="max-w-2xl scroll-mt-20 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-display text-xl tracking-tight text-foreground">なぜ集めているか</h2>
        <p>
          レビンズのファンとして、試合会場までの道中や、キックオフまでの時間に「今日出る選手は、どんな人だろう」と開いてもらえたら、と思って始めました。
        </p>
        <p>
          退団した選手の記事も残しています。加入前、大学や高校のときの記事も集めます。YouTube
          で、たまたま名前が出ただけのものも載せることがあります。その人となりが伝わって、もっと選手のことが好きになってくれたら、という気持ちです。
        </p>
        <p>
          だから、「新加入」のように名前があるだけの告知は入れていません。本人の声や、その人の輪郭が残っているものだけを選んでいます。いちばんの目的は、レビンズの選手のことを、もっと知ってもらうことです。
        </p>
        <p className="text-foreground">
          ラビンズ（Lovins）である私が集めたクリップが、レビンズ（Levins）の選手とつながるサイトにしたいです。
        </p>
      </section>

      <section className="max-w-2xl space-y-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-display text-xl tracking-tight text-foreground">クラブとの関係</h2>
        <p>
          戸田ラグビー選手記事帖は、個人が趣味で運営している非公式のサイトです。ヤクルトレビンズ戸田、株式会社ヤクルト本社、ジャパンラグビーリーグワンの公式サイトではありません。クラブや選手、スポンサーの運営にも関わっていません。
        </p>
        <p>
          チーム名や選手名は、公開された記事をたどるために使っています。公式を装う意図はありません。発表、チケット、ファンクラブは、クラブとリーグの公式サイトをご覧ください。
        </p>
      </section>
    </div>
  );
}
