import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Newspaper, Users, X } from "lucide-react";
import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useClipStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "ホーム" },
  { to: "/matches", label: "試合" },
  { to: "/players", label: "選手" },
  { to: "/articles", label: "記事" },
  { to: "/saved", label: "保存した記事" },
  { to: "/about", label: "このサイトについて" },
  { to: "/corrections", label: "修正依頼" },
] as const;

function navActive(pathname: string, to: string): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

const OUTDOOR_KEY = "outdoor-display";

function applyOutdoor(on: boolean) {
  document.documentElement.setAttribute("data-outdoor", on ? "1" : "0");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", on ? "#f4f1e8" : "#0c1018");
}

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [outdoor, setOutdoor] = useState(false);

  useLayoutEffect(() => {
    const on = localStorage.getItem(OUTDOOR_KEY) === "1";
    setOutdoor(on);
    applyOutdoor(on);
  }, []);

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
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active = navActive(pathname, item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-11 items-center px-2 text-sm transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            aria-pressed={outdoor}
            aria-label={outdoor ? "通常の表示に戻す" : "屋外向けの明るい表示にする"}
            onClick={() => {
              const next = !outdoor;
              setOutdoor(next);
              localStorage.setItem(OUTDOOR_KEY, next ? "1" : "0");
              applyOutdoor(next);
            }}
            className="flex h-11 shrink-0 items-center px-2 text-sm text-foreground"
          >
            {outdoor ? "通常" : "屋外"}
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={open ? "メニューを閉じる" : "メニューを開く"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
        {open ? (
          <div className="border-t border-border bg-background px-4 py-3 lg:hidden">
            <div className="grid gap-1">
              {NAV.map((item) => {
                const active = navActive(pathname, item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-11 items-center text-sm",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
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
