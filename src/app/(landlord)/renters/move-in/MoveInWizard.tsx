"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeMoveIn } from "../../actions";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

type Unit = { id: string; label: string; propertyName: string; rent: number };

const STEPS = [
  { key: "terms", label: "Terms" },
  { key: "tenants", label: "Tenants" },
  { key: "transactions", label: "Lease Transactions" },
  { key: "utilities", label: "Utilities" },
  { key: "summary", label: "Summary" },
];
const UTILITIES = [
  { k: "Electricity", i: "revenues" }, { k: "Gas", i: "wrench" }, { k: "Water", i: "expenses" },
  { k: "Internet", i: "chat" }, { k: "Sewer", i: "reconciliation" }, { k: "Trash", i: "downloads" },
] as const;

function Toggle({ name, defaultChecked, label, desc }: { name: string; defaultChecked?: boolean; label: string; desc?: string }) {
  const [on, setOn] = useState(defaultChecked ?? false);
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 p-4">
      <div><p className="font-medium text-gray-900">{label}</p>{desc && <p className="mt-1 text-sm text-gray-500">{desc}</p>}</div>
      <label className="cursor-pointer">
        <input type="checkbox" name={name} checked={on} onChange={(e) => setOn(e.target.checked)} className="sr-only" />
        <span className={cn("relative block h-6 w-11 rounded-full transition-colors", on ? "bg-brand-600" : "bg-gray-300")}><span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", on ? "left-[22px]" : "left-0.5")} /></span>
      </label>
    </div>
  );
}

export function MoveInWizard({ units }: { units: Unit[] }) {
  const [step, setStep] = useState(0);
  const [leaseType, setLeaseType] = useState<"FIXED" | "M2M">("FIXED");
  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const [rent, setRent] = useState(units[0]?.rent ?? 0);
  const [tenantName, setTenantName] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const last = STEPS.length - 1;
  const today = new Date().toISOString().slice(0, 10);
  const nextYear = new Date(); nextYear.setFullYear(nextYear.getFullYear() + 1);
  const oneYear = nextYear.toISOString().slice(0, 10);
  const leaseNo = Math.floor(Math.random() * 90 + 10);
  const selectedUnit = units.find((u) => u.id === unitId);

  return (
    <form action={async (fd) => { setPending(true); try { await completeMoveIn(fd); } finally { setPending(false); } }} className="flex min-h-[80vh] flex-col">
      <input type="hidden" name="leaseType" value={leaseType} />
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="flex items-center gap-1 text-sm font-medium text-gray-600 disabled:opacity-40">{Icons.chevronLeft({ className: "h-4 w-4" })} Previous step</button>
        <div className="flex items-center gap-2">
          {step < last ? <button type="button" onClick={() => setStep((s) => Math.min(last, s + 1))} className="btn-primary">Continue</button>
            : <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Moving in…" : "Complete move in"}</button>}
          <button type="button" onClick={() => router.push("/renters")} className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-gray-500 hover:bg-gray-50">✕</button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Left rail */}
        <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-gray-50 p-6 md:block">
          <p className="mb-6 text-lg font-bold text-gray-900">Move In</p>
          <ol className="space-y-5">
            {STEPS.map((s, i) => (
              <li key={s.key}>
                <button type="button" onClick={() => setStep(i)} className="flex items-center gap-2">
                  <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px]", i < step ? "border-brand-600 bg-brand-600 text-white" : i === step ? "border-brand-600 text-brand-600" : "border-gray-300 text-gray-300")}>{i < step ? "✓" : ""}</span>
                  <span className={cn("text-sm font-medium", i === step ? "text-brand-700" : i < step ? "text-gray-700" : "text-gray-400")}>{s.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <div className="flex-1 space-y-10 p-6 lg:p-10">
          {/* Terms */}
          <div className={cn("space-y-10", step !== 0 && "hidden")}>
            <section>
              <h2 className="text-xl font-bold text-gray-900">Select Property</h2>
              <p className="mb-4 text-sm text-gray-500">Select the property and unit below.</p>
              <div className="max-w-md">
                <label className="label">Property <span className="text-red-500">*</span></label>
                <select name="unitId" className="input" required value={unitId} onChange={(e) => { setUnitId(e.target.value); const u = units.find((x) => x.id === e.target.value); if (u) setRent(u.rent); }}>
                  <option value="">Select a property</option>
                  {units.map((u) => <option key={u.id} value={u.id}>{u.propertyName} — {u.label}</option>)}
                </select>
              </div>
            </section>
            <section>
              <h2 className="text-xl font-bold text-gray-900">Lease Terms</h2>
              <p className="mb-4 text-sm text-gray-500">Select the lease type, start and end dates.</p>
              <label className="flex items-center gap-2"><input type="radio" checked={leaseType === "FIXED"} onChange={() => setLeaseType("FIXED")} className="accent-brand-600" /> <span className="font-medium text-gray-900">Fixed</span></label>
              {leaseType === "FIXED" && (
                <div className="ml-6 mt-3 grid max-w-lg grid-cols-1 gap-4 sm:grid-cols-2">
                  <div><label className="label">Starts on <span className="text-red-500">*</span></label><input name="startDate" type="date" className="input" defaultValue={today} required /></div>
                  <div><label className="label">Ends on <span className="text-red-500">*</span></label><input name="endDate" type="date" className="input" defaultValue={oneYear} /></div>
                  <div><label className="label">Lease #</label><input className="input bg-gray-50" defaultValue={leaseNo} readOnly /></div>
                </div>
              )}
              <label className="mt-4 flex items-center gap-2"><input type="radio" checked={leaseType === "M2M"} onChange={() => setLeaseType("M2M")} className="accent-brand-600" /> <span className="font-medium text-gray-900">Month-to-month</span></label>
              {leaseType === "M2M" && <div className="ml-6 mt-3 max-w-xs"><label className="label">Starts on <span className="text-red-500">*</span></label><input name="startDate" type="date" className="input" defaultValue={today} required /></div>}
            </section>
          </div>

          {/* Tenants */}
          <div className={cn("space-y-6", step !== 1 && "hidden")}>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Tenants</h2>
              <p className="mb-4 text-sm text-gray-500">Enter the tenant. If they already have an account, the lease is shared with them automatically.</p>
              <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
                <div><label className="label">Tenant name <span className="text-red-500">*</span></label><input name="tenantName" className="input" value={tenantName} onChange={(e) => setTenantName(e.target.value)} placeholder="Jane Doe" required /></div>
                <div><label className="label">Tenant email <span className="text-red-500">*</span></label><input name="tenantEmail" type="email" className="input" placeholder="jane@email.com" required /></div>
                <div><label className="label">Phone</label><input name="tenantPhone" className="input" /></div>
              </div>
            </div>
            <Toggle name="freeTenantPortal" defaultChecked label="Free Tenant Portal" desc="Share lease details, send messages, and collect payments by inviting the tenant to create an account via email." />
            <Toggle name="rentersInsurance" defaultChecked label="Renters Insurance" desc="Require tenants to obtain renters insurance or submit proof of an existing policy to protect their belongings and liability." />
            <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4"><div><p className="font-medium text-gray-900">Dependents</p><p className="text-sm text-gray-500">People who live in the unit but don&apos;t have portal access.</p></div><span className="text-sm font-medium text-brand-600">Add dependent</span></div>
          </div>

          {/* Lease Transactions */}
          <div className={cn("space-y-8", step !== 2 && "hidden")}>
            <section>
              <h2 className="text-xl font-bold text-gray-900">Rent Payments</h2>
              <p className="mb-4 text-sm text-gray-500">Enter the rent amount, payment frequency, and start date.</p>
              <div className="mb-4"><Toggle name="enableRecurring" defaultChecked label="Enable recurring rent invoicing" /></div>
              <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
                <div><label className="label">First rent date <span className="text-red-500">*</span></label><input name="firstRentDate" type="date" className="input" defaultValue={today} /></div>
                <div><label className="label">Frequency</label><select name="frequency" className="input" defaultValue="MONTHLY"><option value="MONTHLY">Monthly</option><option value="WEEKLY">Weekly</option><option value="YEARLY">Yearly</option></select></div>
                <div><label className="label">Total amount <span className="text-red-500">*</span></label><input name="rentAmount" type="number" min="0" step="50" className="input" value={rent} onChange={(e) => setRent(Number(e.target.value))} /></div>
              </div>
              <label className="mt-4 flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" name="markPaid" className="h-4 w-4 accent-brand-600" /> Mark all past invoices as paid</label>
            </section>
            <div className="space-y-3">
              {[["Deposits", "Include any additional deposits for this lease.", "Add deposit"], ["Other lease transactions", "Add other one-time or recurring charges to include in the lease.", "Add transaction"], ["Late fees", "Set automatic late fees after a tenant's grace period expires.", "Add late fees"]].map(([t, d, a]) => (
                <div key={t} className="rounded-xl border border-gray-200 p-4"><p className="font-semibold text-gray-900">{t}</p><p className="text-sm text-gray-500">{d}</p><span className="mt-2 inline-block text-sm font-medium text-brand-600">{a}</span></div>
              ))}
            </div>
          </div>

          {/* Utilities */}
          <div className={cn("space-y-8", step !== 3 && "hidden")}>
            <section>
              <h2 className="text-xl font-bold text-gray-900">Responsibilities</h2>
              <p className="mb-2 text-sm text-gray-500">Choose who is responsible for the rental&apos;s utilities each month.</p>
              <span className="text-sm font-medium text-brand-600">Add responsibility</span>
            </section>
            <section>
              <h2 className="text-xl font-bold text-gray-900">Utility providers</h2>
              <p className="mb-4 text-sm text-gray-500">Review available services for this lease. Tenants get a link to add provider details and confirmation codes.</p>
              <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                {UTILITIES.map((u) => { const Icon = Icons[u.i]; return (
                  <div key={u.k} className="flex items-center gap-3 rounded-xl border border-gray-200 p-4"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50"><Icon className="h-4 w-4 text-brand-600" /></span><div><p className="font-medium text-gray-900">{u.k}</p><p className="text-xs text-gray-400">No provider</p></div></div>
                ); })}
              </div>
            </section>
          </div>

          {/* Summary */}
          <div className={cn("space-y-6", step !== 4 && "hidden")}>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Review &amp; confirm</h2>
              <p className="mb-4 text-sm text-gray-500">Here&apos;s an overview of the new lease. Review for accuracy before completing.</p>
            </div>
            <div className="max-w-2xl rounded-xl border border-gray-200 p-6">
              <p className="flex items-center gap-2 text-lg font-semibold text-gray-800">{Icons.calendar({ className: "h-5 w-5 text-gray-400" })} New lease #{leaseNo}</p>
              <p className="mt-3 flex items-center gap-2 font-semibold text-gray-700">{Icons.home({ className: "h-4 w-4 text-gray-400" })} Property</p>
              <span className="mt-1 inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-800">{Icons.building({ className: "h-4 w-4 text-gray-400" })} {selectedUnit ? `${selectedUnit.propertyName} — ${selectedUnit.label}` : "—"}</span>
              <p className="mt-4 font-semibold text-gray-700">Details</p>
              <p className="text-sm text-gray-600">{leaseType === "FIXED" ? "Fixed lease" : "Month-to-month"} · {tenantName || "tenant"} · rent {rent ? `$${rent}` : "—"}/mo.</p>
            </div>
            <p className="text-sm text-gray-500">Click <strong>Complete move in</strong> to create the lease, generate the first rent invoice, and (if enabled) set up recurring rent.</p>
          </div>
        </div>
      </div>
    </form>
  );
}
