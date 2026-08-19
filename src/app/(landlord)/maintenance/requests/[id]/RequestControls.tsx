"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMaintenanceStatus, assignServicePro, deleteMaintenanceRequest } from "../../../actions";
import { STATUS_META, STATUS_ORDER } from "../../pills";

type Pro = { id: string; name: string };

export function ChangeStatusButton({ id, status }: { id: string; status: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(status);
  const [, start] = useTransition();
  const router = useRouter();

  function submit() {
    const fd = new FormData();
    fd.set("id", id); fd.set("status", value);
    start(async () => { await updateMaintenanceStatus(fd); setOpen(false); router.refresh(); });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">Change status</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold text-gray-900">Change status</h3><button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button></div>
            <p className="mb-4 text-sm text-gray-500">Here you can change the current status to another.</p>
            <label className="label">Status</label>
            <select value={value} onChange={(e) => setValue(e.target.value)} className="input">
              {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
              <button onClick={submit} className="btn-primary">Change</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ActionsMenu({ id }: { id: string }) {
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
        <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg">
          <form action={deleteMaintenanceRequest} onSubmit={(e) => { if (!confirm("Delete this request?")) e.preventDefault(); }}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" className="block w-full px-4 py-2 text-left text-red-600 hover:bg-red-50">Delete request</button>
          </form>
        </div>
      )}
    </div>
  );
}

export function AssigneeControl({ id, assigneeId, pros }: { id: string; assigneeId: string | null; pros: Pro[] }) {
  const [, start] = useTransition();
  const router = useRouter();
  function change(v: string) {
    const fd = new FormData();
    fd.set("id", id); fd.set("assigneeId", v);
    start(async () => { await assignServicePro(fd); router.refresh(); });
  }
  return (
    <select defaultValue={assigneeId ?? ""} onChange={(e) => change(e.target.value)} className="input max-w-xs text-sm">
      <option value="">Unassigned</option>
      {pros.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
  );
}
