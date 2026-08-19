"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

const IN = [
  { label: "Record income", href: "/revenues/new" },
  { label: "Recurring income", href: "/revenues?tab=recurring" },
  { label: "Deposit", href: "/revenues/new?category=Deposit" },
  { label: "Credits", href: "/revenues/new?category=Credits" },
];
const OUT = [
  { label: "Record expense", href: "/expenses/new" },
  { label: "Recurring expense", href: "/expenses/new?recurring=1" },
  { label: "Return deposit", href: "/expenses/new?category=Deposit" },
  { label: "Apply deposit", href: "/revenues/new?category=Deposit" },
];

function Dropdown({ label, items, primary }: { label: string; items: { label: string; href: string }[]; primary?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className={cn("flex items-center gap-1", primary ? "btn-primary" : "btn-secondary")}>
        {label} {Icons.chevronDown({ className: "h-4 w-4" })}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg">
          {items.map((it) => (
            <Link key={it.label} href={it.href} onClick={() => setOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-brand-50 hover:text-brand-700">{it.label}</Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function MoneyMenu() {
  return (
    <div className="flex gap-2">
      <Dropdown label="Money out" items={OUT} />
      <Dropdown label="Money in" items={IN} primary />
    </div>
  );
}
