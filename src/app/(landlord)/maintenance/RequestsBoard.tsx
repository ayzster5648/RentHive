"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setMaintenanceStatus, setMaintenanceAssignee } from "../actions";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

export type BoardCard = {
  id: string;
  title: string;
  priority: string;
  category: string;
  unitLabel: string;
  propertyName: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  assigneeId: string | null;
  assigneeName: string | null;
};
type Pro = { id: string; name: string };

const COLUMNS: { key: BoardCard["status"]; label: string; color: string }[] = [
  { key: "OPEN", label: "New", color: "border-t-blue-400" },
  { key: "IN_PROGRESS", label: "In Progress", color: "border-t-amber-400" },
  { key: "RESOLVED", label: "Resolved", color: "border-t-green-400" },
];

export function RequestsBoard({ cards, pros }: { cards: BoardCard[]; pros: Pro[] }) {
  const [items, setItems] = useState(cards);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const router = useRouter();

  async function drop(status: BoardCard["status"]) {
    setOverCol(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const card = items.find((c) => c.id === id);
    if (!card || card.status === status) return;
    // Optimistic update, then persist.
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    await setMaintenanceStatus(id, status);
    router.refresh();
  }

  async function assign(id: string, assigneeId: string) {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, assigneeId: assigneeId || null, assigneeName: pros.find((p) => p.id === assigneeId)?.name ?? null } : c)));
    await setMaintenanceAssignee(id, assigneeId || null);
    router.refresh();
  }

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">Drag a card between columns to update its status, and assign a service pro on any card.</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const colCards = items.filter((c) => c.status === col.key);
          return (
            <div
              key={col.key}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col.key); }}
              onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
              onDrop={() => drop(col.key)}
              className={cn("rounded-xl border border-t-4 bg-gray-50 p-3 transition-colors", col.color, overCol === col.key ? "bg-brand-50 ring-2 ring-brand-200" : "")}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-500">{colCards.length}</span>
              </div>
              <div className="space-y-2">
                {colCards.map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => setDragId(c.id)}
                    onDragEnd={() => setDragId(null)}
                    className={cn("cursor-grab rounded-lg border border-gray-200 bg-white p-3 shadow-sm active:cursor-grabbing", dragId === c.id && "opacity-50")}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{c.title}</p>
                      <Badge status={c.priority} />
                    </div>
                    <p className="mt-1 text-xs text-gray-400">{c.propertyName} · {c.unitLabel} · {c.category}</p>
                    <select
                      value={c.assigneeId ?? ""}
                      onChange={(e) => assign(c.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 w-full rounded border border-gray-200 px-2 py-1 text-xs text-gray-600"
                    >
                      <option value="">Unassigned</option>
                      {pros.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                ))}
                {colCards.length === 0 && <p className="px-1 py-6 text-center text-xs text-gray-400">Drop cards here</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
