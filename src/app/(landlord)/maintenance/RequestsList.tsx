"use client";

import { useState, useMemo, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { StatusPill, PriorityPill, STATUS_META, STATUS_ORDER } from "./pills";
import { bulkUpdateMaintenanceStatus, bulkAssignMaintenance, bulkDeleteMaintenance } from "../actions";

export type Row = {
  id: string;
  refNumber: number;
  status: string;
  category: string;
  propertyId: string;
  propertyName: string;
  unitLabel: string | null;
  priority: string;
  assigneeName: string | null;
};
type Pro = { id: string; name: string };

const GROUP_LIMIT = 4;

export function RequestsList({ rows, pros, addHref }: { rows: Row[]; pros: Pro[]; addHref: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showMore, setShowMore] = useState<Set<string>>(new Set());
  const [changeOpen, setChangeOpen] = useState(false);
  const [statusPopOpen, setStatusPopOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter.length && !statusFilter.includes(r.status)) return false;
      if (!q) return true;
      return [r.category, r.propertyName, r.unitLabel, r.assigneeName, String(r.refNumber)]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, query, statusFilter]);

  // Group by property, preserving first-seen order.
  const groups = useMemo(() => {
    const map = new Map<string, { name: string; rows: Row[] }>();
    for (const r of filtered) {
      if (!map.has(r.propertyId)) map.set(r.propertyId, { name: r.propertyName, rows: [] });
      map.get(r.propertyId)!.rows.push(r);
    }
    return [...map.entries()].map(([id, g]) => ({ id, ...g }));
  }, [filtered]);

  function toggle(id: string) {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleGroup(rows: Row[], on: boolean) {
    setSelected((s) => { const n = new Set(s); rows.forEach((r) => on ? n.add(r.id) : n.delete(r.id)); return n; });
  }

  function runBulk(fn: (fd: FormData) => Promise<void>, extra: Record<string, string> = {}) {
    const fd = new FormData();
    fd.set("ids", [...selected].join(","));
    Object.entries(extra).forEach(([k, v]) => fd.set(k, v));
    startTransition(async () => {
      await fn(fd);
      setSelected(new Set()); setChangeOpen(false); setAssignOpen(false);
      router.refresh();
    });
  }

  const selCount = selected.size;

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{Icons.search({ className: "h-4 w-4" })}</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search here..." className="input w-64 pl-9" />
        </div>
        <div className="relative">
          <button onClick={() => setStatusPopOpen((o) => !o)} className={`chip ${statusFilter.length ? "chip-active" : ""}`}>+ Status{statusFilter.length ? ` (${statusFilter.length})` : ""}</button>
          {statusPopOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
              <p className="mb-2 text-sm font-semibold text-gray-700">Status</p>
              <div className="space-y-1">
                {STATUS_ORDER.map((s) => (
                  <label key={s} className="flex items-center gap-2 rounded px-1 py-1 text-sm text-gray-700 hover:bg-gray-50">
                    <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={statusFilter.includes(s)}
                      onChange={(e) => setStatusFilter((f) => e.target.checked ? [...f, s] : f.filter((x) => x !== s))} />
                    {STATUS_META[s].label}
                  </label>
                ))}
              </div>
              <button onClick={() => setStatusPopOpen(false)} className="btn-primary mt-3 w-full py-1.5 text-sm">Apply</button>
            </div>
          )}
        </div>
        <button className="chip" disabled>+ Property &amp; Units</button>
        <button className="chip" disabled>+ Assignee</button>
        <button className="chip" disabled>+ Client</button>
        <button className="chip" disabled>••• More filters</button>
        <div className="ml-auto flex items-center gap-2">
          <Link href={addHref} className="btn-primary">{Icons.plus({ className: "h-4 w-4" })}Add request</Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center text-gray-400">
          <p className="font-medium text-gray-500">No results found</p>
          <p className="text-sm">Please modify your search criteria and try again.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((g) => {
            const expanded = showMore.has(g.id);
            const visible = expanded ? g.rows : g.rows.slice(0, GROUP_LIMIT);
            const allSel = g.rows.every((r) => selected.has(r.id));
            return (
              <div key={g.id}>
                <div className="mb-2 flex items-center gap-2 text-gray-700">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
                  <h3 className="text-lg font-semibold text-gray-900">{g.name}</h3>
                  <span className="text-sm text-gray-400">({g.rows.length} Request{g.rows.length !== 1 ? "s" : ""})</span>
                </div>
                <div className="card overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                        <th className="w-10 px-4 py-3"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={allSel} onChange={(e) => toggleGroup(g.rows, e.target.checked)} /></th>
                        <th className="px-2 py-3">Status</th>
                        <th className="px-2 py-3">ID ↑</th>
                        <th className="px-2 py-3">Category</th>
                        <th className="px-2 py-3">Property</th>
                        <th className="px-2 py-3">Priority</th>
                        <th className="px-2 py-3">Assignee</th>
                        <th className="w-10 px-2 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((r) => (
                        <tr key={r.id} className="group border-b border-gray-50 last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={selected.has(r.id)} onChange={() => toggle(r.id)} /></td>
                          <td className="px-2 py-3"><Link href={`/maintenance/requests/${r.id}`} className="block"><StatusPill status={r.status} /></Link></td>
                          <td className="px-2 py-3 text-gray-500"><Link href={`/maintenance/requests/${r.id}`} className="block">{r.refNumber}</Link></td>
                          <td className="px-2 py-3"><Link href={`/maintenance/requests/${r.id}`} className="block font-medium text-gray-800">{r.category}</Link></td>
                          <td className="px-2 py-3 text-gray-600">{r.propertyName}{r.unitLabel ? `, ${r.unitLabel}` : ""}</td>
                          <td className="px-2 py-3"><PriorityPill priority={r.priority} /></td>
                          <td className="px-2 py-3 text-gray-600">{r.assigneeName ?? "—"}</td>
                          <td className="px-2 py-3 text-right">
                            <Link href={`/maintenance/requests/${r.id}`} className="text-gray-300 hover:text-gray-500">⋯</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {g.rows.length > GROUP_LIMIT && (
                  <p className="mt-2 text-sm text-gray-500">
                    Showing 1 - {visible.length} of {g.rows.length} results{" "}
                    <button onClick={() => setShowMore((s) => { const n = new Set(s); expanded ? n.delete(g.id) : n.add(g.id); return n; })} className="font-medium text-brand-600 hover:underline">
                      {expanded ? "Show less" : "Show next"}
                    </button>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Floating bulk action bar */}
      {selCount > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div className="flex items-center gap-6 rounded-xl bg-gray-900 px-5 py-3 text-sm text-white shadow-2xl">
            <button onClick={() => setSelected(new Set())} className="flex items-center gap-2 text-gray-300 hover:text-white">✕ Selected <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">{selCount}</span></button>
            <button onClick={() => setChangeOpen(true)} className="flex items-center gap-1.5 hover:text-brand-300">↻ Change status</button>
            <div className="relative">
              <button onClick={() => setAssignOpen((o) => !o)} className="flex items-center gap-1.5 hover:text-brand-300">+ Assign</button>
              {assignOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-48 rounded-lg border border-gray-200 bg-white py-1 text-gray-700 shadow-xl">
                  <button onClick={() => runBulk(bulkAssignMaintenance, { assigneeId: "" })} className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50">Unassigned</button>
                  {pros.map((p) => <button key={p.id} onClick={() => runBulk(bulkAssignMaintenance, { assigneeId: p.id })} className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50">{p.name}</button>)}
                </div>
              )}
            </div>
            <button onClick={() => { if (confirm(`Delete ${selCount} request(s)?`)) runBulk(bulkDeleteMaintenance); }} className="flex items-center gap-1.5 text-gray-300 hover:text-red-400">🗑 Delete</button>
          </div>
        </div>
      )}

      {changeOpen && (
        <ChangeStatusModal count={selCount} onCancel={() => setChangeOpen(false)} onChange={(s) => runBulk(bulkUpdateMaintenanceStatus, { status: s })} />
      )}
    </div>
  );
}

function ChangeStatusModal({ count, onCancel, onChange }: { count: number; onCancel: () => void; onChange: (s: string) => void }) {
  const [status, setStatus] = useState("IN_PROGRESS");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { function esc(e: KeyboardEvent) { if (e.key === "Escape") onCancel(); } document.addEventListener("keydown", esc); return () => document.removeEventListener("keydown", esc); }, [onCancel]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div ref={ref} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold text-gray-900">Change status</h3><button onClick={onCancel} className="text-gray-400 hover:text-gray-600">✕</button></div>
        <p className="mb-4 text-sm text-gray-500">Here you can change the current status {count > 1 ? `of ${count} requests ` : ""}to another.</p>
        <label className="label">Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
          {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </select>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={() => onChange(status)} className="btn-primary">Change</button>
        </div>
      </div>
    </div>
  );
}
