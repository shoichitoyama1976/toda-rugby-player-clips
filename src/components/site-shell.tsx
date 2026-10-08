import { Link, useRouterState } from "@tanstack/react-router";
import { Bookmark, Menu, Newspaper, Users, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useClipStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/players", label: "選手" },
  { to: "/matches", label: "メンバー" },
  { to: "/articles", label: "記事" },
  { to: "/", label: "ホーム" },
  { to: "/corrections", label: "修正依頼" },
  { to: "/about", label: "このサイト" },
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const finish = () => useClipStore.getState().setHydrated();
    const unsub = useClipStore.persist.onFinishHydration(finish);
    if (useClipStore.persist.hasHydrated()) finish();
    return unsub;
  }, []);

  return (
    <div className="relative min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex min-w-0 flex-col justify-center leading-tight">
            <span className="font-display text-lg font-medium tracking-tight text-foreground">
              戸田ラグビー選手記事帖
            </span>
            <span className="truncate text-[10px] tracking-wide text-muted-foreground">
              Lovins Clips Connect With Levins
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname === item.to || pathname.startsWith(`${item.to}/`);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex h-11 items-center px-3 text-sm transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              to="/saved"
              className="flex size-11 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label="保存した記事"
            >
              <Bookmark className="size-4" />
            </Link>
          </nav>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={open ? "メニューを閉じる" : "メニューを開く"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
        {open ? (
          <div className="border-t border-border bg-background px-4 py-3 md:hidden">
            <div className="grid gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex h-11 items-center text-sm text-foreground"
                >
                  {item.label}
                </Link>
              ))}
              <Link to="/saved" className="flex h-11 items-center text-sm text-foreground">
                保存した記事
              </Link>
            </div>
          </div>
        ) : null}
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-8">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-xs leading-relaxed text-muted-foreground">
          <p className="flex items-center gap-2">
            <Newspaper className="size-3.5" />
            個人が作った非公式のサイトです。記事の本文は、各媒体のページで読めます。
          </p>
          <p className="flex items-center gap-2">
            <Users className="size-3.5" />
            クラブの公式発表ではありません。
            <Link to="/about" className="text-accent hover:text-foreground">
              このサイトについて
            </Link>
            <Link to="/source" className="text-accent hover:text-foreground">
              使い方
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
