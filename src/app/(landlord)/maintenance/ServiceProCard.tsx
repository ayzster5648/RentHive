"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { initials } from "@/lib/utils";
import { archiveServicePro, deleteServicePro } from "../actions";

type Pro = {
  id: string;
  name: string;
  phone: string | null;
  category: string;
  company: string | null;
  archived: boolean;
  assignedCount: number;
};

export function ServiceProCard({ pro }: { pro: Pro }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const payHref = `/expenses/new?payee=${encodeURIComponent(pro.company ?? pro.name)}`;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="card p-5 text-center">
      {/* top row: chat + menu */}
      <div className="mb-1 flex items-center justify-between">
        <span className="text-gray-300">{Icons.renters({ className: "h-5 w-5" })}</span>
        <div className="flex items-center gap-2" ref={ref}>
          <span className="text-gray-300">{Icons.chat({ className: "h-4 w-4" })}</span>
          <div className="relative">
            <button onClick={() => setOpen((o) => !o)} className="rounded px-1 text-gray-400 hover:bg-gray-100" aria-label="More">
              <span className="text-lg leading-none">⋯</span>
            </button>
            {open && (
              <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 text-left shadow-lg">
                <Link href={`/maintenance/pros/${pro.id}/edit`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Edit</Link>
                <Link href={payHref} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Send payment</Link>
                <form action={archiveServicePro}>
                  <input type="hidden" name="id" value={pro.id} />
                  <button type="submit" className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">{pro.archived ? "Unarchive" : "Archive"}</button>
                </form>
                <form action={deleteServicePro} onSubmit={(e) => { if (!confirm(`Delete ${pro.name}?`)) e.preventDefault(); }}>
                  <input type="hidden" name="id" value={pro.id} />
                  <button type="submit" className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">Delete</button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      <Link href={`/maintenance/pros/${pro.id}`}>
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-brand-400 text-xl font-semibold text-white">{initials(pro.name)}</div>
        <p className="font-semibold text-gray-900 hover:text-brand-700">{pro.name}</p>
      </Link>
      {pro.phone && <p className="text-sm text-brand-600 underline">{pro.phone}</p>}
      <p className="mt-3 text-sm text-gray-500">{pro.category}</p>
      {pro.archived && <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Archived</span>}
      <Link href={`/maintenance/pros/${pro.id}`} className="mt-3 block border-t border-gray-100 pt-3 text-sm font-medium text-brand-600 hover:underline">View profile</Link>
    </div>
  );
}
