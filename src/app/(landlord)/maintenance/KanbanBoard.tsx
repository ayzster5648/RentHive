"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateMaintenanceStatus, assignServicePro } from "../actions";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

type Card = {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  unitLabel: string;
  propertyName: string;
  assigneeId: string | null;
};
type Pro = { id: string; name: string };

const COLUMNS = [
  { key: "OPEN", label: "New", accent: "border-t-red-400" },
  { key: "IN_PROGRESS", label: "In Progress", accent: "border-t-amber-400" },
  { key: "IN_REVIEW", label: "In review", accent: "border-t-yellow-400" },
  { key: "RESOLVED", label: "Resolved", accent: "border-t-green-400" },
  { key: "CANCELLED", label: "Cancelled", accent: "border-t-gray-400" },
];

export function KanbanBoard({ initial, pros }: { initial: Card[]; pros: Pro[] }) {
  const [cards, setCards] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function moveCard(id: string, status: string) {
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, status } : c)));
    const fd = new FormData();
    fd.set("id", id);
    fd.set("status", status);
    startTransition(async () => {
      await updateMaintenanceStatus(fd);
      router.refresh();
    });
  }

  function assign(id: string, assigneeId: string) {
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, assigneeId: assigneeId || null } : c)));
    const fd = new FormData();
    fd.set("id", id);
    fd.set("assigneeId", assigneeId);
    startTransition(async () => { await assignServicePro(fd); router.refresh(); });
  }

  return (
    <div>
      <div className="mb-4 rounded-lg border border-brand-100 bg-brand-50/60 p-3 text-sm text-brand-800">
        <strong>Drag cards between columns</strong> to update status, and assign a service pro on each card.
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {COLUMNS.map((col) => {
          const items = cards.filter((c) => c.status === col.key);
          return (
            <div
              key={col.key}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col.key); }}
              onDragLeave={() => setOverCol((v) => (v === col.key ? null : v))}
              onDrop={() => { if (dragId) moveCard(dragId, col.key); setDragId(null); setOverCol(null); }}
              className={cn("rounded-xl border border-t-4 bg-gray-50 p-3 transition-colors", col.accent, overCol === col.key ? "bg-brand-50 ring-2 ring-brand-200" : "border-gray-200")}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-500">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => setDragId(c.id)}
                    onDragEnd={() => setDragId(null)}
                    className={cn("cursor-grab rounded-lg border border-gray-200 bg-white p-3 shadow-sm active:cursor-grabbing", dragId === c.id && "opacity-50")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">{c.title}</p>
                      <Badge status={c.priority} />
                    </div>
                    <p className="mt-1 text-xs text-gray-400">{c.propertyName} · {c.unitLabel}</p>
                    <p className="text-xs text-gray-400">{c.category}</p>
                    <select
                      value={c.assigneeId ?? ""}
                      onChange={(e) => assign(c.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 w-full rounded border border-gray-200 px-2 py-1 text-xs text-gray-600"
                    >
                      <option value="">Unassigned</option>
                      {pros.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <Link href={`/maintenance/requests/${c.id}`} onClick={(e) => e.stopPropagation()} className="mt-2 block text-right text-xs font-medium text-brand-600 hover:underline">View →</Link>
                  </div>
                ))}
                {items.length === 0 && <p className="px-1 py-6 text-center text-xs text-gray-400">Drop cards here</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
