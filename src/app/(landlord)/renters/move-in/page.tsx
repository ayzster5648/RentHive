import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { MoveInWizard } from "./MoveInWizard";

export default async function MoveInPage() {
  const user = await requireRole("LANDLORD");
  const units = await db.unit.findMany({
    where: { property: { landlordId: user.id } },
    include: { property: true },
    orderBy: { label: "asc" },
  });

  if (units.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="font-medium text-gray-700">Add a property with units first</p>
        <p className="mt-1 text-sm text-gray-400">You need a unit before you can move a tenant in.</p>
      </div>
    );
  }

  return (
    <div className="-mx-8 -my-7 overflow-hidden border-t border-gray-200">
      <MoveInWizard units={units.map((u) => ({ id: u.id, label: u.label, propertyName: u.property.name, rent: u.rent }))} />
    </div>
  );
}
