"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { archiveServicePro, deleteServicePro } from "../actions";
import { Icons } from "@/components/icons";

export function ProMenu({ id, archived, label = "dots" }: { id: string; archived: boolean; label?: "dots" | "button" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {label === "dots" ? (
        <button onClick={() => setOpen((o) => !o)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Menu">⋯</button>
      ) : (
        <button onClick={() => setOpen((o) => !o)} className="btn-secondary">Actions ▾</button>
      )}

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg">
          <Link href={`/maintenance/pros/${id}/edit`} onClick={() => setOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50">Edit</Link>
          <Link href={`/expenses/new`} onClick={() => setOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50">Send payment</Link>
          <form action={archiveServicePro}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50">{archived ? "Unarchive" : "Archive"}</button>
          </form>
          <form action={deleteServicePro} onSubmit={(e) => { if (!confirm("Delete this service pro?")) e.preventDefault(); }}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" className="block w-full border-t border-gray-100 px-4 py-2 text-left text-red-600 hover:bg-red-50">Delete</button>
          </form>
        </div>
      )}
    </div>
  );
}
