"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { archiveTenant, deleteTenant } from "../actions";
import { Icons } from "@/components/icons";

export function TenantMenu({ id, archived, label = "dots", addInvoiceHref }: { id: string; archived: boolean; label?: "dots" | "button"; addInvoiceHref?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {label === "dots"
        ? <button onClick={() => setOpen((o) => !o)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Menu">⋯</button>
        : <button onClick={() => setOpen((o) => !o)} className="btn-secondary">Actions ▾</button>}

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg">
          <Link href={`/renters/${id}/edit`} onClick={() => setOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50">Edit</Link>
          <Link href={`/renters/move-in`} onClick={() => setOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50">Send Connection</Link>
          <Link href={addInvoiceHref ?? "/revenues/new"} onClick={() => setOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50">Add Invoice</Link>
          <Link href="/settings/integrations" onClick={() => setOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50">Add insurance</Link>
          <form action={archiveTenant}><input type="hidden" name="id" value={id} /><button type="submit" className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50">{archived ? "Unarchive" : "Archive"}</button></form>
          <form action={deleteTenant} onSubmit={(e) => { if (!confirm("Delete this tenant?")) e.preventDefault(); }}><input type="hidden" name="id" value={id} /><button type="submit" className="block w-full border-t border-gray-100 px-4 py-2 text-left text-red-600 hover:bg-red-50">Delete</button></form>
        </div>
      )}
    </div>
  );
}
