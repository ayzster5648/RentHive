import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { MoneyForm } from "@/components/MoneyForm";
import { createIncome } from "../../actions";

export default async function RecordIncomePage() {
  const user = await requireRole("LANDLORD");
  const properties = await db.property.findMany({ where: { landlordId: user.id }, select: { id: true, name: true } });
  const tenants = await db.user.findMany({
    where: { role: "TENANT", leases: { some: { unit: { property: { landlordId: user.id } } } } },
    select: { id: true, name: true },
  });

  return (
    <div>
      <Link href="/revenues" className="mb-4 inline-block text-sm text-brand-600 hover:underline">← Back to revenues</Link>
      <MoneyForm
        kind="income"
        action={createIncome}
        properties={properties.map((p) => ({ id: p.id, label: p.name }))}
        contacts={tenants.map((t) => ({ id: t.id, label: t.name }))}
      />
    </div>
  );
}
