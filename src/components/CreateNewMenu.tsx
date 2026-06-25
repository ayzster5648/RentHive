"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Icons } from "./icons";

const actions = [
  { label: "List a unit", href: "/listings" },
  { label: "Invite to apply", href: "/listings?tab=applications" },
  { label: "Screen a tenant", href: "/listings?tab=screenings" },
  { label: "Create new property", href: "/portfolio?new=property" },
  { label: "Record income", href: "/revenues" },
  { label: "Record expense", href: "/expenses?new=1" },
  { label: "Record a request", href: "/maintenance?new=1" },
];

export function CreateNewMenu() {
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
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Create New {Icons.plus({ className: "h-4 w-4" })}
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {actions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700"
            >
              {a.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
