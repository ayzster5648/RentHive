import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { RefreshFeedButton, LineMenu, ReconActionsMenu } from "../ReconClient";
import { updateReconciliation } from "../actions";

function shortNo(id: string): number {
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000;
  return h;
}

export default async function ReconciliationDetail({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string; sub?: string }>;
}) {
  const { id } = await params;
  const { view = "statement", sub = "toreview" } = await searchParams;
  const user = await requireRole("LANDLORD");

  const rec = await db.reconciliation.findFirst({
    where: { id, bankAccount: { landlordId: user.id } },
    include: { bankAccount: true, lines: { orderBy: { date: "desc" } } },
  });
  if (!rec) notFound();

  const active = rec.lines.filter((l) => l.matchStatus !== "IGNORED");
  const matched = rec.lines.filter((l) => l.matchStatus === "MATCHED");
  const statement = active.reduce((s, l) => s + l.amount, 0);
  const account = matched.reduce((s, l) => s + l.amount, 0);
  const diff = statement - account;
  const notMatched = rec.lines.filter((l) => l.matchStatus === "TO_REVIEW").length;
  const pct = active.length ? Math.round((matched.length / active.length) * 100) : 0;

  // Account registry = the recorded payments/expenses this landlord has in the period.
  const registry = view === "registry"
    ? [
        ...(await db.payment.findMany({ where: { paidAt: { gte: rec.startDate }, invoice: { lease: { unit: { property: { landlordId: user.id } } } } }, include: { invoice: { include: { lease: { include: { tenant: true, unit: true } } } } } }))
            .map((p) => ({ id: "p" + p.id, date: p.paidAt, desc: `Payment — ${p.invoice.lease.tenant.name}`, where: p.invoice.lease.unit.label, amount: p.amount })),
        ...(await db.expense.findMany({ where: { status: "PAID", date: { gte: rec.startDate }, OR: [{ property: { landlordId: user.id } }, { propertyId: null }] }, include: { property: true } }))
            .map((e) => ({ id: "e" + e.id, date: e.date, desc: `${e.category}${e.vendor ? ` — ${e.vendor}` : ""}`, where: e.property?.name ?? "Portfolio", amount: -e.amount })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const subTabs = [
    { key: "toreview", label: "To review" }, { key: "matched", label: "Matched" }, { key: "ignored", label: "Ignored" }, { key: "all", label: "All" },
  ];
  const lines = rec.lines.filter((l) => {
    if (sub === "toreview") return l.matchStatus === "TO_REVIEW";
    if (sub === "matched") return l.matchStatus === "MATCHED";
    if (sub === "ignored") return l.matchStatus === "IGNORED";
    return true;
  });
  const link = (v: string, s: string) => `/reconciliation/${id}?view=${v}${s ? `&sub=${s}` : ""}`;

  return (
    <div>
      <div className="mb-3 text-sm text-gray-400">
        <Link href="/reconciliation" className="text-brand-600 hover:underline">Reconciliation</Link> / <span className="text-gray-700">Bank statement</span>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/reconciliation" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-2xl font-bold text-gray-900">No.{shortNo(rec.id)}</h1>
        </div>
        <div className="flex gap-2"><RefreshFeedButton id={rec.id} /><ReconActionsMenu id={rec.id} /></div>
      </div>

      {/* Header card */}
      <div className="card mb-6 p-6">
        <p className="flex items-center gap-2 text-lg font-semibold text-gray-800">{Icons.calendar({ className: "h-5 w-5 text-gray-400" })} Start date {formatDate(rec.startDate)}</p>
        <p className="mt-1 text-xl font-bold text-gray-900">{rec.bankAccount.nickname ?? rec.bankAccount.bankName} | •••• {rec.bankAccount.mask}</p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-sm text-gray-500"><span><span className="font-semibold text-gray-900">{matched.length}</span> Matched</span><span><span className="font-semibold text-gray-900">{notMatched}</span> Not matched</span></div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="text-sm text-gray-500">Statement balance</p><p className={cn("mt-1 text-2xl font-bold", statement < 0 ? "text-red-600" : "text-gray-900")}>{formatCurrency(statement)}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Account balance</p><p className={cn("mt-1 text-2xl font-bold", account < 0 ? "text-red-600" : "text-gray-900")}>{formatCurrency(account)}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Difference</p><p className={cn("mt-1 text-2xl font-bold", diff === 0 ? "text-green-600" : "text-red-600")}>{formatCurrency(diff)}</p></div>
      </div>

      {diff === 0 && active.length > 0 && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{Icons.check({ className: "h-5 w-5" })} <span className="font-medium">Reconciled — the statement and account balances match.</span></div>
      )}

      {/* View tabs */}
      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {[{ k: "registry", l: "Account Registry" }, { k: "statement", l: "Bank Statement" }].map((t) => (
          <Link key={t.k} href={link(t.k, t.k === "statement" ? "toreview" : "")} className={cn("-mb-px border-b-2 px-4 py-2.5 text-sm font-medium", view === t.k ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500 hover:text-gray-800")}>{t.l}</Link>
        ))}
      </div>

      {view === "registry" ? (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-[110px_1fr_1fr_120px] gap-4 border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs font-medium uppercase text-gray-400"><span>Date</span><span>Description</span><span>Property</span><span className="text-right">Amount</span></div>
          {registry.length === 0 ? <p className="px-5 py-10 text-center text-sm text-gray-400">No account records in this period.</p> :
            registry.map((r) => (
              <div key={r.id} className="grid grid-cols-[110px_1fr_1fr_120px] gap-4 px-5 py-3 text-sm">
                <span className="text-gray-600">{formatDate(r.date)}</span>
                <span className="text-gray-700">{r.desc}</span>
                <span className="text-gray-500">{r.where}</span>
                <span className={cn("text-right font-medium", r.amount < 0 ? "text-red-600" : "text-green-700")}>{r.amount < 0 ? "−" : "+"}{formatCurrency(Math.abs(r.amount))}</span>
              </div>
            ))}
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-4 border-b border-gray-100 text-sm">
            {subTabs.map((t) => (
              <Link key={t.key} href={link("statement", t.key)} className={cn("-mb-px border-b-2 px-2 py-2 font-medium", sub === t.key ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500 hover:text-gray-800")}>{t.label}</Link>
            ))}
          </div>
          {rec.lines.length === 0 ? (
            <div className="card p-10 text-center text-sm text-gray-400">No statement lines. Use <strong>Refresh feed</strong> to pull recorded payments &amp; expenses.</div>
          ) : (
            <div className="card overflow-hidden">
              <div className="grid grid-cols-[90px_110px_1fr_120px_140px] gap-4 border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs font-medium uppercase text-gray-400"><span>Status</span><span>Date</span><span>Description &amp; notes</span><span className="text-right">Amount</span><span></span></div>
              {lines.length === 0 ? <p className="px-5 py-10 text-center text-sm text-gray-400">Nothing here.</p> :
                lines.map((l) => (
                  <div key={l.id} className="grid grid-cols-[90px_110px_1fr_120px_140px] items-center gap-4 px-5 py-3 text-sm">
                    <span className="flex items-center gap-1 text-green-700">{Icons.check({ className: "h-4 w-4" })}Posted</span>
                    <span className="text-gray-600">{formatDate(l.date)}</span>
                    <span className="text-gray-700">{l.description}{l.note && <span className="ml-1 text-xs text-gray-400">· {l.note}</span>}</span>
                    <span className={cn("text-right font-medium", l.amount < 0 ? "text-red-600" : "text-gray-900")}>{l.amount < 0 ? "−" : ""}{formatCurrency(Math.abs(l.amount))}</span>
                    <span className="flex items-center justify-end gap-3">
                      {l.matchStatus === "MATCHED" ? <span className="text-xs font-medium text-green-600">Matched</span> : l.matchStatus === "IGNORED" ? <span className="text-xs text-gray-400">Ignored</span> : <Link href={`/reconciliation/${id}/line/${l.id}`} className="text-sm font-medium text-brand-600 hover:underline">Match</Link>}
                      <LineMenu lineId={l.id} ignored={l.matchStatus === "IGNORED"} />
                    </span>
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      {/* Settings */}
      <div id="settings" className="card mt-8 p-6">
        <h2 className="mb-4 font-semibold text-gray-900">Configure settings</h2>
        <form action={updateReconciliation} className="flex flex-wrap items-end gap-4">
          <input type="hidden" name="id" value={rec.id} />
          <div><label className="label">Report start date</label><input name="startDate" type="date" className="input" defaultValue={rec.startDate.toISOString().slice(0, 10)} /></div>
          <label className="flex items-center gap-2 pb-2 text-sm text-gray-700"><input type="checkbox" name="autoRefresh" defaultChecked={rec.autoRefresh} className="h-4 w-4 accent-brand-600" /> Automatic feed refresh</label>
          <button type="submit" className="btn-primary">Save</button>
        </form>
      </div>
    </div>
  );
}
