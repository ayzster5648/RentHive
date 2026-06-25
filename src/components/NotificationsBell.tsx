"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Icons } from "./icons";
import { cn } from "@/lib/utils";

export type Notification = {
  kind: "overdue" | "application" | "inspection" | "maintenance" | "lease";
  text: string;
  href: string;
};

const dot: Record<string, string> = {
  overdue: "bg-red-500",
  application: "bg-blue-500",
  inspection: "bg-amber-500",
  maintenance: "bg-orange-500",
  lease: "bg-purple-500",
};

export function NotificationsBell({ notifications }: { notifications: Notification[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const count = notifications.length;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative text-gray-500 hover:text-gray-700" aria-label="Notifications">
        {Icons.bell({ className: "h-5 w-5" })}
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-4 py-2.5">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {count === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">You&apos;re all caught up 🎉</p>
            ) : (
              notifications.map((n, i) => (
                <Link key={i} href={n.href} onClick={() => setOpen(false)} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50">
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dot[n.kind])} />
                  <span className="text-sm text-gray-700">{n.text}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
