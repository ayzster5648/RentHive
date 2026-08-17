"use client";

import { useState } from "react";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui";

export type UnitRow = {
  id: string;
  label: string;
  kind: string;
  status: string;
  beds: number;
  baths: number;
  sqft: number | null;
  rent: number;
  tenant: string | null;
};
export type PropertyGroup = {
  id: string;
  name: string;
  address: string;
  imageUrl: string | null;
  units: UnitRow[];
};

export function PortfolioUnits({ groups }: { groups: PropertyGroup[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const filteredGroups = groups
    .map((g) => ({
      ...g,
      units: g.units.filter((u) => {
        if (q && !`${u.label} ${g.name} ${g.address}`.toLowerCase().includes(q.toLowerCase())) return false;
        if (status && u.status !== status) return false;
        return true;
      }),
    }))
    .filter((g) => g.units.length > 0);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5">
          {Icons.search({ className: "h-4 w-4 text-gray-400" })}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search here…" className="w-40 text-sm outline-none" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600">
          <option value="">Marketing status</option>
          <option value="VACANT">Vacant</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
        {(q || status) && <button onClick={() => { setQ(""); setStatus(""); }} className="text-sm font-medium text-brand-600 hover:underline">Clear all</button>}
      </div>

      {filteredGroups.length === 0 ? (
        <div className="card p-12 text-center text-sm text-gray-400">No units match your filters.</div>
      ) : (
        <div className="space-y-5">
          {filteredGroups.map((g) => (
            <div key={g.id} className="card overflow-hidden">
              <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                  {g.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : <div className="flex h-full w-full items-center justify-center">{Icons.building({ className: "h-5 w-5 text-brand-300" })}</div>}
                </div>
                <div>
                  <Link href={`/portfolio/${g.id}`} className="font-semibold text-gray-900 hover:text-brand-700">{g.name}</Link>
                  <p className="flex items-center gap-1 text-xs text-gray-400">{Icons.home({ className: "h-3 w-3" })} {g.address}</p>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {g.units.map((u) => (
                  <div key={u.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100">{Icons.home({ className: "h-6 w-6 text-gray-300" })}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{u.label}</p>
                          <Badge status={u.status} />
                        </div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">{u.kind}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          <span className="font-medium text-gray-700">{u.beds}</span> beds · <span className="font-medium text-gray-700">{u.baths}</span> baths · <span className="font-medium text-gray-700">{u.sqft ?? "—"}</span> sqft
                          {u.tenant ? ` · ${u.tenant}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {u.status === "VACANT" && (
                        <>
                          <Link href="/listings" className="rounded-lg border border-brand-500 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50">List</Link>
                          <Link href="/renters" className="rounded-lg border border-brand-500 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50">Move in</Link>
                        </>
                      )}
                      <span className="text-sm"><span className="font-semibold text-gray-900">{formatCurrency(u.rent)}</span> <span className="text-xs uppercase text-gray-400">market rent</span></span>
                      <Link href={`/portfolio/${g.id}`} className="btn-secondary px-3 py-1.5 text-sm">View unit</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
