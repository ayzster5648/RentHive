"use client";

import { useState } from "react";
import { saveDashboardWidgets } from "../actions";

const WIDGETS: { key: string; label: string }[] = [
  { key: "calendar", label: "Calendar" },
  { key: "recentlyViewed", label: "Recently viewed" },
  { key: "leaseFunnel", label: "Lease funnel" },
  { key: "accounting", label: "Accounting" },
  { key: "screenings", label: "Screenings" },
  { key: "applications", label: "Applications" },
  { key: "onlinePayments", label: "Online payments" },
  { key: "maintenance", label: "Maintenance" },
  { key: "tasks", label: "Tasks" },
  { key: "expiringLeases", label: "Expiring leases" },
  { key: "propertiesUnits", label: "Properties & units" },
  { key: "depositsHeld", label: "Deposits held" },
  { key: "overdueInvoices", label: "Overdue invoices" },
  { key: "rent", label: "Rent" },
];

export function CustomizeDashboard({ selected }: { selected: string[] }) {
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<Set<string>>(new Set(selected));

  const toggle = (k: string) => setChosen((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-sm font-medium text-brand-600 hover:underline">Customise dashboard</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="font-semibold text-gray-900">Dashboard widgets</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form action={saveDashboardWidgets}>
              <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
                <p className="mb-3 text-sm text-gray-500">Select the widgets you want displayed on your dashboard.</p>
                <div className="space-y-1">
                  {WIDGETS.map((w) => (
                    <label key={w.key} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50">
                      <input type="checkbox" name="widgets" value={w.key} checked={chosen.has(w.key)} onChange={() => toggle(w.key)} className="h-5 w-5 accent-brand-600" />
                      <span className="text-sm text-gray-800">{w.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" onClick={() => setOpen(false)}>Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
