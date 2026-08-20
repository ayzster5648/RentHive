"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { archiveProperty, deleteProperty } from "../../actions";

export function PropertyActions({ id, archived }: { id: string; archived: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="btn-secondary">Actions ▾</button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg">
          <Link href={`/portfolio/${id}/edit`} onClick={() => setOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50">Edit property</Link>
          <form action={archiveProperty}><input type="hidden" name="id" value={id} /><button type="submit" className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50">{archived ? "Unarchive property" : "Archive property"}</button></form>
          <form action={deleteProperty} onSubmit={(e) => { if (!confirm("Delete this property and all its units, leases and invoices? This cannot be undone.")) e.preventDefault(); }}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" className="block w-full border-t border-gray-100 px-4 py-2 text-left text-red-600 hover:bg-red-50">Delete property</button>
          </form>
        </div>
      )}
    </div>
  );
}
