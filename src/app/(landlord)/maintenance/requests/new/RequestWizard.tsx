"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createMaintenanceRequestFull } from "../../../actions";

type Unit = { id: string; label: string; propertyName: string; tenants: { id: string; name: string }[] };
type Pro = { id: string; name: string; category: string };

const CATEGORIES = [
  "Appliances / Dishwasher / Leaking", "Appliances / Laundry / Washing machine", "Appliances / Heating & Cooling / Not cold",
  "Electrical / Outlets / Interior", "Household / Cleaning", "Household / Pest control / Rodents",
  "Household / Doors & Windows / Windows", "Plumbing / Leak from the ceiling", "Exterior / Roof & Gutters / Needs repairing", "Other / General",
];

const STEPS = [
  { key: "details", label: "Request Details", subs: [] as string[] },
  { key: "tenants", label: "Tenants & Access", subs: ["Tenant Information", "Entry Information"] },
  { key: "assignee", label: "Assignee", subs: [] },
];

export function RequestWizard({ units, pros, landlordName }: { units: Unit[]; pros: Pro[]; landlordName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [availability, setAvailability] = useState("");
  const [allowEntry, setAllowEntry] = useState(false);
  const [assigneeId, setAssigneeId] = useState("");
  const [assignSearch, setAssignSearch] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);

  const unit = units.find((u) => u.id === unitId);
  const tenantOptions = unit?.tenants ?? [];

  const assigneeLabel = useMemo(() => {
    if (!assigneeId) return "Unassigned";
    if (assigneeId === "SELF") return `${landlordName} (You)`;
    return pros.find((p) => p.id === assigneeId)?.name ?? "Unassigned";
  }, [assigneeId, pros, landlordName]);

  const filteredPros = pros.filter((p) => p.name.toLowerCase().includes(assignSearch.toLowerCase()));

  const last = step === STEPS.length - 1;

  async function submit() {
    const fd = new FormData();
    fd.set("unitId", unitId);
    fd.set("priority", priority);
    fd.set("dueDate", dueDate);
    fd.set("category", category);
    fd.set("description", description);
    fd.set("tenantId", tenantId);
    fd.set("availability", availability);
    fd.set("allowEntry", allowEntry ? "true" : "false");
    fd.set("assigneeId", assigneeId === "SELF" ? "" : assigneeId);
    await createMaintenanceRequestFull(fd);
  }

  return (
    <div className="flex min-h-[calc(100vh-1px)]">
      {/* Sidebar steps */}
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-gray-50 p-6 md:block">
        <h2 className="mb-6 text-lg font-semibold text-gray-800">Request</h2>
        <ol className="space-y-4">
          {STEPS.map((s, i) => (
            <li key={s.key}>
              <div className="flex items-center gap-3">
                <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px]", i < step ? "border-brand-600 bg-brand-600 text-white" : i === step ? "border-brand-600 text-brand-600" : "border-gray-300 text-gray-300")}>{i < step ? "✓" : ""}</span>
                <span className={cn("text-sm font-medium", i === step ? "text-brand-700" : i < step ? "text-gray-700" : "text-gray-400")}>{s.label}</span>
              </div>
              {i === step && s.subs.length > 0 && (
                <ul className="ml-8 mt-2 space-y-1">
                  {s.subs.map((sub) => <li key={sub} className="text-sm text-brand-600">{sub}</li>)}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </aside>

      {/* Main */}
      <div className="flex-1">
        <div className="flex items-center justify-between border-b border-gray-200 px-8 py-4">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="flex items-center gap-1 text-sm font-medium text-gray-600 disabled:opacity-40">← Previous step</button>
          <div className="flex items-center gap-2">
            {last
              ? <button onClick={submit} className="btn-primary">Complete</button>
              : <button onClick={() => setStep((s) => s + 1)} className="btn-primary">Next</button>}
            <button onClick={() => router.push("/maintenance")} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50">✕</button>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-8 py-10">
          {/* Step 1: Request Details */}
          <div className={cn("space-y-10", step !== 0 && "hidden")}>
            <section>
              <h3 className="text-xl font-semibold text-gray-800">Property</h3>
              <p className="mb-3 text-sm text-gray-500">Choose or enter the rental property and unit number (if applicable) below.</p>
              <label className="label">Property <span className="text-red-500">*</span></label>
              <select value={unitId} onChange={(e) => { setUnitId(e.target.value); setTenantId(""); }} className="input max-w-md">
                {units.length === 0 && <option value="">No units — add a property first</option>}
                {units.map((u) => <option key={u.id} value={u.id}>{u.propertyName}{u.label ? `, ${u.label}` : ""}</option>)}
              </select>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800">Priority &amp; Due Date</h3>
              <p className="mb-3 text-sm text-gray-500">Please select the request priority and due date.</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Priority <span className="text-red-500">*</span></label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input">
                    <option value="LOW">Low</option><option value="MEDIUM">Normal</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="label">Due date</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800">Photos &amp; Video</h3>
              <p className="mb-3 text-sm text-gray-500">Include images or video to provide a clearer picture of the problem.</p>
              <div className="space-y-2 text-sm font-medium text-brand-600">
                <p className="cursor-not-allowed opacity-70" title="Requires file-storage integration">+ Add photos</p>
                <p className="cursor-not-allowed opacity-70" title="Requires file-storage integration">+ Add video</p>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800">Category</h3>
              <p className="mb-3 text-sm text-gray-500">Select the category that best matches the maintenance issue.</p>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input max-w-md">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <label className="label mt-4">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input" placeholder="Describe the issue…" />
            </section>
          </div>

          {/* Step 2: Tenants & Access */}
          <div className={cn("space-y-12", step !== 1 && "hidden")}>
            <section>
              <h3 className="text-xl font-semibold text-gray-800">Tenant Information</h3>
              <p className="mb-4 text-sm text-gray-500">Select the tenants, if available. If no tenants are available for this property, please skip this step.</p>
              <label className="label">Tenants</label>
              <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="input max-w-md">
                <option value="">Choose tenants</option>
                {tenantOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {tenantOptions.length === 0 && <p className="mt-2 text-sm text-gray-400">No active-lease tenants for this property — you can skip this.</p>}
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800">Available Date &amp; Time</h3>
              <p className="mb-3 text-sm text-gray-500">If the property is rented, please provide the convenient date and time to arrange the maintenance.</p>
              <input value={availability} onChange={(e) => setAvailability(e.target.value)} className="input max-w-md" placeholder="e.g. Oct 23, 12PM – 4PM" />

              <h3 className="mt-8 text-xl font-semibold text-gray-800">Property Access Authorization</h3>
              <p className="mb-3 text-sm text-gray-500">Grant permission for the team to use the key in tenant&apos;s absence.</p>
              <button type="button" onClick={() => setAllowEntry((v) => !v)} className="flex items-center gap-2">
                <span className={cn("relative h-6 w-11 rounded-full transition-colors", allowEntry ? "bg-brand-600" : "bg-gray-300")}>
                  <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", allowEntry ? "left-[22px]" : "left-0.5")} />
                </span>
                <span className="text-sm text-gray-700">Allow to enter</span>
              </button>
            </section>
          </div>

          {/* Step 3: Assignee */}
          <div className={cn("space-y-6", step !== 2 && "hidden")}>
            <h3 className="text-xl font-semibold text-gray-800">Assignee</h3>
            <p className="text-sm text-gray-500">Assign the request to yourself, a team member (if applicable), or a Service Pro from the list.</p>
            <div className="relative max-w-md">
              <label className="label">Assignee</label>
              <button type="button" onClick={() => setAssignOpen((o) => !o)} className="input flex items-center justify-between text-left">
                <span className={assigneeId ? "text-gray-800" : "text-gray-400"}>{assigneeLabel}</span><span className="text-gray-400">▾</span>
              </button>
              {assignOpen && (
                <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                  <input value={assignSearch} onChange={(e) => setAssignSearch(e.target.value)} placeholder="Search" className="input mb-2" />
                  <p className="px-2 py-1 text-xs font-semibold uppercase text-gray-400">Team</p>
                  <button type="button" onClick={() => { setAssigneeId("SELF"); setAssignOpen(false); }} className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-gray-50">{landlordName} <span className="text-gray-400">(You)</span></button>
                  <p className="px-2 py-1 text-xs font-semibold uppercase text-gray-400">Service pros (all)</p>
                  {filteredPros.length === 0 && <p className="px-2 py-1 text-sm text-gray-400">No service pros</p>}
                  {filteredPros.map((p) => (
                    <button key={p.id} type="button" onClick={() => { setAssigneeId(p.id); setAssignOpen(false); }} className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-gray-50">{p.name} <span className="text-gray-400">({p.category})</span></button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
