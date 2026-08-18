"use client";

import { useState, useRef, useEffect } from "react";
import { sendBalanceNotice, applyCredit } from "../actions";

export function BalanceActions({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const [creditOpen, setCreditOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative flex items-center justify-end gap-2" ref={ref}>
      <form action={async (fd) => { await sendBalanceNotice(fd); setSent(true); setTimeout(() => setSent(false), 2500); }}>
        <input type="hidden" name="tenantId" value={tenantId} />
        <button type="submit" className="rounded-lg border border-brand-500 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50">{sent ? "Notice sent ✓" : "Send Notice"}</button>
      </form>
      <button onClick={() => setOpen((o) => !o)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="More">⋯</button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg">
          <button onClick={() => { setCreditOpen(true); setOpen(false); }} className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50">Apply credit</button>
        </div>
      )}

      {creditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setCreditOpen(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 font-semibold text-gray-900">Apply credit</h3>
            <form action={async (fd) => { await applyCredit(fd); setCreditOpen(false); }} className="space-y-3">
              <input type="hidden" name="tenantId" value={tenantId} />
              <div>
                <label className="label">Credit amount</label>
                <input name="amount" type="number" min="0" step="0.01" className="input" placeholder="0.00" required />
              </div>
              <p className="text-xs text-gray-400">Applied to the tenant&apos;s oldest open invoice.</p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setCreditOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Apply</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
