"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "./icons";

type Hit = { type: string; label: string; sub: string; href: string };

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Open on click or Ctrl/Cmd+K.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Debounced search.
  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setHits(data.hits ?? []);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQ("");
      router.push(href);
    },
    [router]
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-50"
      >
        {Icons.search({ className: "h-4 w-4" })}
        <span className="hidden md:inline">Search…</span>
        <kbd className="ml-2 hidden rounded border border-gray-200 bg-gray-50 px-1.5 text-[10px] text-gray-400 md:inline">Ctrl K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 pt-24" onClick={() => setOpen(false)}>
          <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-gray-100 px-4">
              {Icons.search({ className: "h-5 w-5 text-gray-400" })}
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search properties, tenants, units, expenses…"
                className="w-full py-3.5 text-sm outline-none"
              />
            </div>
            <div className="max-h-80 overflow-y-auto">
              {loading && <p className="px-4 py-6 text-center text-sm text-gray-400">Searching…</p>}
              {!loading && q.trim().length >= 2 && hits.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-gray-400">No results for “{q}”.</p>
              )}
              {!loading && q.trim().length < 2 && (
                <p className="px-4 py-6 text-center text-sm text-gray-400">Type at least 2 characters to search.</p>
              )}
              {hits.map((h, i) => (
                <button key={i} onClick={() => go(h.href)} className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-brand-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{h.label}</p>
                    <p className="text-xs text-gray-400">{h.sub}</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">{h.type}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
