"use client";

import { useState, useRef, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { addBankAccount, setLineStatus, addLineNote, refreshFeed, deleteReconciliation } from "./actions";
import { Icons } from "@/components/icons";

export function AddBankAccountButton() {
  return (
    <Modal trigger={{ label: "Connect bank feed", icon: true }} title="Add a bank account">
      {(close) => (
        <form action={async (fd) => { await addBankAccount(fd); close(); }} className="space-y-3">
          <div>
            <label className="label">Bank name</label>
            <input name="bankName" className="input" placeholder="Bank of America" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nickname</label>
              <input name="nickname" className="input" placeholder="Operating" />
            </div>
            <div>
              <label className="label">Last 4 digits</label>
              <input name="mask" className="input" placeholder="2227" maxLength={4} />
            </div>
          </div>
          <p className="text-xs text-gray-400">No live bank connection is wired up, so this adds the account manually.</p>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={close} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add account</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function RefreshFeedButton({ id }: { id: string }) {
  return (
    <form action={refreshFeed}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="btn-secondary">Refresh feed</button>
    </form>
  );
}

export function LineMenu({ lineId, ignored }: { lineId: string; ignored: boolean }) {
  const [open, setOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="rounded p-1 text-gray-400 hover:bg-gray-100" aria-label="More">⋯</button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-36 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg">
          <form action={setLineStatus}>
            <input type="hidden" name="lineId" value={lineId} />
            <input type="hidden" name="status" value={ignored ? "TO_REVIEW" : "IGNORED"} />
            <button type="submit" onClick={() => setOpen(false)} className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50">{ignored ? "Un-ignore" : "Ignore"}</button>
          </form>
          <button onClick={() => { setNoteOpen(true); setOpen(false); }} className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50">Add note</button>
        </div>
      )}
      {noteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setNoteOpen(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 font-semibold text-gray-900">Add a note</h3>
            <form action={async (fd) => { await addLineNote(fd); setNoteOpen(false); }} className="space-y-3">
              <input type="hidden" name="lineId" value={lineId} />
              <textarea name="note" rows={3} className="input" placeholder="Note to distinguish this record…" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setNoteOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save note</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReconActionsMenu({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="btn-secondary flex items-center gap-1">Actions {Icons.chevronDown({ className: "h-4 w-4" })}</button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg">
          <a href={`/reconciliation/${id}#settings`} onClick={() => setOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50">Configure settings</a>
          <form action={deleteReconciliation}><input type="hidden" name="id" value={id} /><button type="submit" onClick={(e) => { if (!confirm("Delete this reconciliation?")) e.preventDefault(); }} className="block w-full border-t border-gray-100 px-4 py-2 text-left text-red-600 hover:bg-red-50">Delete report</button></form>
        </div>
      )}
    </div>
  );
}
