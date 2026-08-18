"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

type Option = { id: string; label: string };

const INCOME_CATEGORIES: Record<string, string[]> = {
  Rent: ["Monthly rent", "Prorated rent"],
  Fees: ["Late fee", "Application fee", "Pet fee", "Admin fee"],
  Deposit: ["Security deposit", "Pet deposit"],
  Reimbursement: ["Utilities", "Repairs"],
  Other: ["Other income"],
};
const EXPENSE_CATEGORIES: Record<string, string[]> = {
  "Repairs & Maintenance": ["Plumbing", "Electrical", "HVAC", "Appliances", "General"],
  Utilities: ["Water", "Electric", "Gas", "Trash", "Internet"],
  Insurance: ["Property insurance", "Liability"],
  Taxes: ["Property tax"],
  Management: ["Management fee", "Leasing fee"],
  Landscaping: ["Lawn care", "Snow removal"],
  Mortgage: ["Mortgage payment"],
  Supplies: ["Supplies"],
  Other: ["Other expense"],
};

export function MoneyForm({
  kind,
  action,
  properties,
  contacts,
  defaultPayee,
}: {
  kind: "income" | "expense";
  action: (fd: FormData) => Promise<void>;
  properties: Option[];
  contacts: Option[];
  defaultPayee?: string;
}) {
  const isIncome = kind === "income";
  const [scope, setScope] = useState<"PROPERTY" | "GENERAL">("PROPERTY");
  const [markPaid, setMarkPaid] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const cats = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const contactLabel = isIncome ? "Payer" : "Payer / Payee";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      action={async (fd) => { setPending(true); try { await action(fd); } finally { setPending(false); } }}
      className="mx-auto max-w-2xl"
    >
      <div className="card p-6 sm:p-8">
        <h1 className="mb-6 border-b border-gray-100 pb-4 text-2xl font-bold text-gray-900">
          {isIncome ? "Record income" : "Record expense"}
        </h1>

        {/* Scope */}
        <input type="hidden" name="scope" value={scope} />
        <div className="mb-6 flex gap-8">
          {(["PROPERTY", "GENERAL"] as const).map((s) => (
            <button type="button" key={s} onClick={() => setScope(s)} className="flex items-center gap-2">
              <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2", scope === s ? "border-brand-600" : "border-gray-300")}>
                {scope === s && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
              </span>
              <span className={cn("text-sm font-medium", scope === s ? "text-gray-900" : "text-gray-500")}>
                {s === "PROPERTY" ? (isIncome ? "Property Income" : "Property Expense") : isIncome ? "General Income" : "General Expense"}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-5">
          {scope === "PROPERTY" && properties.length > 0 && (
            <div>
              <label className="label">Property <span className="text-red-500">*</span></label>
              <select name="propertyId" className="input" required defaultValue={properties[0]?.id}>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="label">Category &amp; subcategory <span className="text-red-500">*</span></label>
            <select name="categoryPath" className="input" required defaultValue="">
              <option value="" disabled>Select a category…</option>
              {Object.entries(cats).map(([cat, subs]) => (
                <optgroup key={cat} label={cat}>
                  {subs.map((sub) => <option key={sub} value={`${cat} / ${sub}`}>{cat} — {sub}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Due on <span className="text-red-500">*</span></label>
              <input name="dueDate" type="date" className="input" defaultValue={today} required />
            </div>
            <div>
              <label className="label">Amount <span className="text-red-500">*</span></label>
              <input name="amount" type="number" min="0" step="0.01" className="input" placeholder="0.00" required />
            </div>
          </div>

          {/* Mark as paid toggle */}
          <div className="flex items-center justify-end gap-3">
            <input type="hidden" name="markPaid" value={markPaid ? "on" : "off"} />
            <button
              type="button"
              onClick={() => setMarkPaid((v) => !v)}
              className={cn("relative h-6 w-11 rounded-full transition-colors", markPaid ? "bg-brand-600" : "bg-gray-300")}
            >
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", markPaid ? "left-[22px]" : "left-0.5")} />
            </button>
            <span className="text-sm font-medium text-gray-700">Mark as paid</span>
          </div>

          <div>
            <label className="label">{contactLabel} {isIncome && <span className="text-red-500">*</span>}</label>
            <input name={isIncome ? "payer" : "payee"} className="input" list="contacts" placeholder={isIncome ? "Who paid" : "Vendor / payee"} defaultValue={defaultPayee} required={isIncome} />
            <datalist id="contacts">
              {contacts.map((c) => <option key={c.id} value={c.label} />)}
            </datalist>
          </div>

          <div>
            <label className="label">Tags</label>
            <input name="tags" className="input" placeholder="Comma-separated, optional" />
          </div>

          <div>
            <label className="label">Details</label>
            <textarea name="details" rows={3} maxLength={200} className="input" placeholder="Some details about this record" />
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-brand-600">
            {Icons.downloads({ className: "h-5 w-5" })}
            <span className="cursor-not-allowed opacity-70" title="Enable S3 storage to attach files">Upload file</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
          <button type="button" onClick={() => router.push(isIncome ? "/revenues" : "/expenses")} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Creating…" : "Create"}</button>
        </div>
      </div>
    </form>
  );
}
