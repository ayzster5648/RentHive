import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { MoneyForm } from "@/components/MoneyForm";
import { createExpenseFull } from "../../actions";

export default async function RecordExpensePage() {
  const user = await requireRole("LANDLORD");
  const properties = await db.property.findMany({ where: { landlordId: user.id }, select: { id: true, name: true } });
  const pros = await db.servicePro.findMany({ select: { id: true, name: true, company: true } });

  return (
    <div>
      <Link href="/expenses" className="mb-4 inline-block text-sm text-brand-600 hover:underline">← Back to expenses</Link>
      <MoneyForm
        kind="expense"
        action={createExpenseFull}
        properties={properties.map((p) => ({ id: p.id, label: p.name }))}
        contacts={pros.map((p) => ({ id: p.id, label: p.company ?? p.name }))}
      />
    </div>
  );
}
