import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { RequestWizard } from "./RequestWizard";

export default async function NewRequestPage() {
  const user = await requireRole("LANDLORD");

  const units = await db.unit.findMany({
    where: { property: { landlordId: user.id } },
    include: { property: true, leases: { where: { status: "ACTIVE" }, include: { tenant: true } } },
    orderBy: { label: "asc" },
  });
  const pros = await db.servicePro.findMany({ where: { archived: false }, orderBy: { name: "asc" } });

  return (
    <div className="-mx-8 -my-7 overflow-hidden border-t border-gray-200">
      <RequestWizard
        units={units.map((u) => ({
          id: u.id, label: u.label, propertyName: u.property.name,
          tenants: u.leases.map((l) => ({ id: l.tenant.id, name: l.tenant.name })),
        }))}
        pros={pros.map((p) => ({ id: p.id, name: p.name, category: p.category }))}
        landlordName={user.name}
      />
    </div>
  );
}
