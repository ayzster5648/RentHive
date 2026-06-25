"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icons } from "./icons";

type Viewed = { id: string; name: string; sub: string };

export function RecentlyViewed() {
  const [items, setItems] = useState<Viewed[] | null>(null);

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem("rh_recent_properties") ?? "[]"));
    } catch {
      setItems([]);
    }
  }, []);

  if (items === null) return null; // not hydrated yet

  return (
    <div className="card p-5">
      <h2 className="mb-3 font-semibold text-gray-900">Recently viewed</h2>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">Open a property and it&apos;ll show up here for quick access.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {items.map((v) => (
            <Link key={v.id} href={`/portfolio/${v.id}`} className="flex items-center gap-3 rounded-lg border border-gray-100 p-2.5 hover:bg-gray-50">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50">{Icons.building({ className: "h-4 w-4 text-brand-400" })}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{v.name}</p>
                <p className="truncate text-xs text-gray-400">{v.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
