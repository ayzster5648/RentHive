import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { Icons } from "@/components/icons";
import { createReconciliation } from "../actions";

export default async function NewReconciliationPage({ searchParams }: { searchParams: Promise<{ bank?: string }> }) {
  const { bank } = await searchParams;
  const user = await requireRole("LANDLORD");
  const accounts = await db.bankAccount.findMany({ where: { landlordId: user.id }, orderBy: { createdAt: "asc" } });

  if (accounts.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="font-medium text-gray-700">Add a bank account first</p>
        <Link href="/reconciliation" className="mt-3 inline-block text-sm text-brand-600 hover:underline">← Back to reconciliation</Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <Link href="/reconciliation" className="mb-4 inline-block text-sm text-brand-600 hover:underline">← Back</Link>
      <PageHeader title="New reconciliation report" subtitle="Choose a bank account and the period to pull statement transactions and compare to your records." />
      <div className="card p-6">
        <form action={createReconciliation} className="space-y-4">
          <div>
            <label className="label">Bank account <span className="text-red-500">*</span></label>
            <select name="bankAccountId" className="input" required defaultValue={bank ?? accounts[0]?.id}>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.bankName} · •••• {a.mask}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Start date <span className="text-red-500">*</span></label>
            <input name="startDate" type="date" className="input" defaultValue={new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)} required />
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {Icons.wrench({ className: "mt-0.5 h-4 w-4 shrink-0" })}
            <p>The statement is generated from your recorded payments and paid expenses in this period (no live bank feed is connected).</p>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary">Create report</button>
          </div>
        </form>
      </div>
    </div>
  );
}
