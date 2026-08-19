import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { matchLine } from "../../../actions";

export default async function MatchPage({ params }: { params: Promise<{ id: string; lineId: string }> }) {
  const { id, lineId } = await params;
  const user = await requireRole("LANDLORD");

  const line = await db.bankStatementLine.findFirst({ where: { id: lineId, reconciliation: { id, bankAccount: { landlordId: user.id } } }, include: { reconciliation: { include: { bankAccount: true } } } });
  if (!line) notFound();

  // Candidate account records near the line's amount.
  const target = Math.abs(line.amount);
  const isDeposit = line.amount >= 0;
  const candidates = isDeposit
    ? (await db.payment.findMany({ where: { amount: { gte: target - 0.01, lte: target + 0.01 }, invoice: { lease: { unit: { property: { landlordId: user.id } } } } }, include: { invoice: { include: { lease: { include: { tenant: true, unit: true } } } } }, take: 20 }))
        .map((p) => ({ id: p.id, date: p.paidAt, category: p.invoice.type === "RENT" ? "Rent" : p.invoice.type, property: p.invoice.lease.unit.label, contact: p.invoice.lease.tenant.name, amount: p.amount }))
    : (await db.expense.findMany({ where: { status: "PAID", amount: { gte: target - 0.01, lte: target + 0.01 }, OR: [{ property: { landlordId: user.id } }, { propertyId: null }] }, include: { property: true }, take: 20 }))
        .map((e) => ({ id: e.id, date: e.date, category: e.category, property: e.property?.name ?? "Portfolio", contact: e.vendor ?? "—", amount: -e.amount }));

  return (
    <div className="max-w-4xl">
      <Link href={`/reconciliation/${id}?view=statement&sub=toreview`} className="mb-4 inline-block text-sm font-medium text-brand-600 hover:underline">← Back</Link>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Match payments</h1>
        <p className="mx-auto mt-1 max-w-lg text-sm text-gray-500">Select an account payment record to match this bank statement transaction, or create a payment manually.</p>
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 text-sm">
          <span className="text-gray-600">{formatDate(line.date)}</span>
          <span className="text-gray-700">{line.description}</span>
          <span className="text-gray-500">{line.reconciliation.bankAccount.bankName} •••• {line.reconciliation.bankAccount.mask}</span>
          <span className={cn("font-semibold", line.amount < 0 ? "text-red-600" : "text-green-700")}>{line.amount < 0 ? "−" : ""}{formatCurrency(Math.abs(line.amount))}</span>
        </div>
      </div>

      <div className="mt-6 card overflow-hidden">
        <div className="grid grid-cols-[110px_1fr_1fr_1fr_120px_120px] gap-4 border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs font-medium uppercase text-gray-400"><span>Date</span><span>Category</span><span>Property</span><span>Contact</span><span className="text-right">Amount</span><span></span></div>
        {candidates.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">No matching account records. You can create a payment manually.</div>
        ) : candidates.map((c) => (
          <div key={c.id} className="grid grid-cols-[110px_1fr_1fr_1fr_120px_120px] items-center gap-4 px-5 py-3 text-sm">
            <span className="text-gray-600">{formatDate(c.date)}</span>
            <span className="text-gray-700">{c.category}</span>
            <span className="text-gray-500">{c.property}</span>
            <span className="text-gray-700">{c.contact}</span>
            <span className={cn("text-right font-medium", c.amount < 0 ? "text-red-600" : "text-gray-900")}>{c.amount < 0 ? "−" : ""}{formatCurrency(Math.abs(c.amount))}</span>
            <span className="text-right">
              <form action={matchLine}>
                <input type="hidden" name="lineId" value={line.id} />
                <input type="hidden" name="matchedRef" value={`${c.category} · ${c.contact}`} />
                <button type="submit" className="btn-primary px-3 py-1 text-xs">Match</button>
              </form>
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <Link href="/revenues/new" className="btn-secondary">Create payment</Link>
        <form action={matchLine}>
          <input type="hidden" name="lineId" value={line.id} />
          <input type="hidden" name="matchedRef" value="Marked as matched" />
          <button type="submit" className="btn-primary">Mark as matched</button>
        </form>
      </div>
    </div>
  );
}
