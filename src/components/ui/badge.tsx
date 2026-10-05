import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  className?: string;
  tone?: "muted" | "accent" | "solid";
};

export function Badge({ children, className, tone = "muted" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        tone === "muted" && "bg-muted text-muted-foreground",
        tone === "accent" && "bg-accent/15 text-accent",
        tone === "solid" && "bg-primary text-primary-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
