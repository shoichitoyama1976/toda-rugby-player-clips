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
          だから、「新加入」のように名前があるだけの告知は入れていません。本人の声や、その人の輪郭が残っているものだけを選んでいます。選手のXも、レビンズやラグビーに触れているものだけを載せています。個人の生活の投稿は、なるべく拾いません。いちばんの目的は、レビンズの選手のことを、もっと知ってもらうことです。
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
        <p>
          選手やクラブから、この記事やXを外してほしいと連絡があれば外します。窓口は
          <Link to="/corrections" className="mx-1 text-accent hover:text-foreground">
            修正依頼
          </Link>
          です。
        </p>
      </section>

      <section className="max-w-2xl space-y-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-display text-xl tracking-tight text-foreground">このサイトでできること</h2>
        <p>
          新聞、公式、note、自治体など、選手が登場した記事のありかを一覧にしています。本文は転載しません。タイトルと出典を示して、元の記事へ案内します。
        </p>
        <p>
          選手プロフィールは、公開情報の控えです。誤りがあれば
          <Link to="/corrections" className="mx-1 text-accent hover:text-foreground">
            修正依頼
          </Link>
          から知らせてください。運営者が確認し、名簿を直すまで数字は変わりません。依頼を受けたことは選手ページに出します。
        </p>
      </section>

      <section className="max-w-2xl space-y-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-display text-xl tracking-tight text-foreground">作り方</h2>
        <p>
          掲載記事と選手名簿の元データは Google スプレッドシートです。行を足すと、サイトがその内容を読んで一覧にします。記事本文は保存していません。
        </p>
        <p>
          画面の設計と実装には Grok（Grok Build）を使っています。サーバーを別に契約してはいません。公開後のURLも Grok 側のものです。
        </p>
        <p>
          列の型やシートのつなぎ方は
          <Link to="/source" className="mx-1 text-accent hover:text-foreground">
            使い方
          </Link>
          にあります。
        </p>
      </section>
      <section className="max-w-2xl space-y-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-display text-xl tracking-tight text-foreground">アクセスについて</h2>
        <p>
          どのページが開かれたかを知るために、Google アナリティクスを使っています。運営の参考にするだけで、広告のための追跡ではありません。
        </p>
      </section>

      <section className="max-w-2xl space-y-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-display text-xl tracking-tight text-foreground">運営者について</h2>
        <p>
          サイトの運営者は
          <a href="https://x.com/touchan" target="_blank" rel="noreferrer" className="mx-1 text-accent hover:text-foreground">
            X の @touchan
          </a>
          です。
        </p>
        <p>
          ラグビーの部活経験も、選手としての経験もありません。観戦を始めたのは、2022年のジャパンラグビーリーグワン開幕あたりからです。それまでは、飲み屋で流れていたら見る程度でした。
        </p>
        <p>
          いまは埼玉ワイルドナイツとレビンズ戸田を中心に観ています。15人制の日本代表（男子・女子）も見ます。観戦の前後に食事とクラフトビールを楽しむのが、いつもの流れです。
        </p>
      </section>
    </div>
  );
}
