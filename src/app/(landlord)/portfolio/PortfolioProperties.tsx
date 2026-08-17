"use client";

import { useState } from "react";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { formatCurrency, cn } from "@/lib/utils";

export type PropertyCard = {
  id: string;
  name: string;
  address: string;
  imageUrl: string | null;
  type: string;
  unitType: string;
  unitsCount: number;
  occupiedCount: number;
  occupancyPct: number;
  balance: number;
};

export function PortfolioProperties({ properties }: { properties: PropertyCard[] }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [occ, setOcc] = useState(""); // "" | vacancy | full
  const types = Array.from(new Set(properties.map((p) => p.type)));

  const filtered = properties.filter((p) => {
    if (q && !`${p.name} ${p.address}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (type && p.type !== type) return false;
    if (occ === "vacancy" && p.occupancyPct >= 100) return false;
    if (occ === "full" && p.occupancyPct < 100) return false;
    return true;
  });

  const clearAll = () => { setQ(""); setType(""); setOcc(""); };

  return (
    <div>
      {/* Filter row */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5">
          {Icons.search({ className: "h-4 w-4 text-gray-400" })}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search here…" className="w-40 text-sm outline-none" />
        </div>
        <select value={occ} onChange={(e) => setOcc(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600">
          <option value="">Occupancy</option>
          <option value="vacancy">Has vacancy</option>
          <option value="full">Fully occupied</option>
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600">
          <option value="">Property type</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {(q || type || occ) && (
          <button onClick={clearAll} className="text-sm font-medium text-brand-600 hover:underline">Clear all</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-sm text-gray-400">No properties match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filtered.map((p) => (
            <div key={p.id} className="card overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                {/* Map / photo */}
                <Link href={`/portfolio/${p.id}`} className="relative h-40 w-full shrink-0 sm:h-auto sm:w-44">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-brand-50">{Icons.building({ className: "h-10 w-10 text-brand-300" })}</div>
                  )}
                  <span className="absolute left-2 top-2 rounded-md bg-gray-900/80 px-2 py-0.5 text-xs font-medium text-white">Balance {formatCurrency(p.balance)}</span>
                </Link>

                {/* Body */}
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between">
                    <Link href={`/portfolio/${p.id}`} className="text-sm font-medium text-brand-700 hover:underline">
                      {p.unitType === "SINGLE" ? "Single family" : `${p.unitsCount} Unit${p.unitsCount !== 1 ? "s" : ""}`}
                    </Link>
                    <span className="text-sm text-gray-500">Occupancy: <span className="font-semibold text-gray-900">{p.occupancyPct}%</span></span>
                  </div>
                  <Link href={`/portfolio/${p.id}`}>
                    <h3 className="mt-1 text-lg font-bold text-gray-900 hover:text-brand-700">{p.name}</h3>
                  </Link>
                  <p className="text-sm text-gray-500">{p.address}</p>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3">
                    <Link href={`/revenues?property=${p.id}`} className="flex flex-col items-center gap-1 rounded-lg py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                      {Icons.dollar({ className: "h-4 w-4" })} Accounting
                    </Link>
                    <Link href={`/renters?property=${p.id}`} className="flex flex-col items-center gap-1 rounded-lg py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                      {Icons.renters({ className: "h-4 w-4" })} Tenants
                    </Link>
                    <Link href={`/maintenance?property=${p.id}`} className="flex flex-col items-center gap-1 rounded-lg py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                      {Icons.wrench({ className: "h-4 w-4" })} MR requests
                    </Link>
                  </div>
                  <Link href={`/portfolio/${p.id}`} className="mt-3 border-t border-gray-100 pt-3 text-center text-sm font-semibold text-brand-600 hover:underline">
                    View property
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
