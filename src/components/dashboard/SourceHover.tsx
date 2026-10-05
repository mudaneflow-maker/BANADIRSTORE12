import React, { useState } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export type SourceRow = { label: string; date?: string; amount: number };

const money = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(2)}`;

/** Shows where a dashboard number comes from — on mouse hover, or on tap/click, without leaving the page. */
export function SourceHover({
  title,
  rows,
  formula,
  children,
  hidden,
}: {
  title: string;
  rows: SourceRow[];
  formula?: string;
  children: React.ReactNode;
  hidden?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const sorted = [...rows].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          className="cursor-help underline decoration-dotted decoration-1 underline-offset-4"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setOpen((o) => !o);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen((o) => !o);
            }
          }}
        >
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-0" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-border p-3">
          <div className="text-sm font-semibold text-foreground">{title}</div>
          {formula && <p className="mt-0.5 text-[11px] text-muted-foreground">{formula}</p>}
        </div>
        {hidden ? (
          <p className="p-3 text-xs text-muted-foreground">
            Geli PIN si aad u aragto faahfaahinta.
          </p>
        ) : sorted.length === 0 ? (
          <p className="p-3 text-xs text-muted-foreground">Xog lama helin muddadan.</p>
        ) : (
          <ul className="max-h-64 divide-y divide-border overflow-y-auto text-xs">
            {sorted.slice(0, 60).map((r, i) => (
              <li key={i} className="flex items-start justify-between gap-2 px-3 py-1.5">
                <div className="min-w-0">
                  <div className="truncate font-medium text-foreground">{r.label}</div>
                  {r.date && <div className="text-[10px] text-muted-foreground">{r.date}</div>}
                </div>
                <strong
                  className={
                    r.amount < 0 ? "shrink-0 text-destructive" : "shrink-0 text-foreground"
                  }
                >
                  {money(r.amount)}
                </strong>
              </li>
            ))}
            {sorted.length > 60 && (
              <li className="px-3 py-1.5 text-muted-foreground">+{sorted.length - 60} kale…</li>
            )}
          </ul>
        )}
        {!hidden && (
          <div className="flex justify-between border-t border-border p-3 text-xs">
            <span className="text-muted-foreground">{rows.length} diiwaan · Wadar</span>
            <strong className="text-foreground">{money(total)}</strong>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
