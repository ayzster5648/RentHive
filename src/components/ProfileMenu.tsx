"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Icons } from "./icons";
import { initials } from "@/lib/utils";

export function ProfileMenu({ name, email }: { name: string; email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full border border-gray-200 py-1 pl-3 pr-1 hover:bg-gray-50">
        <span className="hidden max-w-[120px] truncate text-sm font-medium text-gray-700 sm:block">{name}</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-400 text-xs font-semibold text-white">{initials(name)}</span>
        {Icons.chevronDown({ className: "h-4 w-4 text-gray-400" })}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {/* Clicking the name/header goes to account settings */}
          <Link href="/settings" onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-gray-50">
            <p className="text-xs font-medium text-gray-400">Landlord</p>
            <div className="mt-1 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">{initials(name)}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
                <p className="truncate text-xs text-gray-400">{email}</p>
              </div>
            </div>
          </Link>

          <div className="border-t border-gray-100 px-3 py-2">
            <Link href="/settings" onClick={() => setOpen(false)} className="flex w-full items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Settings
            </Link>
          </div>

          <div className="border-t border-gray-100 py-1">
            <form action="/api/logout" method="post">
              <button type="submit" className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                {Icons.logout({ className: "h-4 w-4 text-gray-400" })} Log out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
