import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
}

const d = (date: Date) => new Date(date).toISOString().slice(0, 10);

export async function GET(_req: Request, { params }: { params: Promise<{ type: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "LANDLORD") return new Response("Unauthorized", { status: 401 });
  const { type } = await params;
  const owned = { property: { landlordId: user.id } };

  let rows: (string | number)[][] = [];
  let filename = "export.csv";

  if (type === "rent-roll") {
    filename = "rent-roll.csv";
    const leases = await db.lease.findMany({ where: { status: "ACTIVE", unit: owned }, include: { tenant: true, unit: { include: { property: true } } } });
    rows = [["Property", "Unit", "Tenant", "Email", "Phone", "Rent", "Due Day", "Lease Start", "Lease End"]];
    for (const l of leases) rows.push([l.unit.property.name, l.unit.label, l.tenant.name, l.tenant.email, l.tenant.phone ?? "", l.rentAmount, l.rentDueDay, d(l.startDate), d(l.endDate)]);
  } else if (type === "tenants") {
    filename = "tenants.csv";
    const tenants = await db.user.findMany({ where: { role: "TENANT", leases: { some: { unit: owned } } }, include: { leases: { include: { unit: true } } } });
    rows = [["Name", "Email", "Phone", "Emergency Contact", "Unit"]];
    for (const t of tenants) rows.push([t.name, t.email, t.phone ?? "", t.emergencyContact ?? "", t.leases[0]?.unit.label ?? ""]);
  } else if (type === "transactions") {
    filename = "transactions.csv";
    const invoices = await db.invoice.findMany({ where: { lease: { unit: owned } }, include: { lease: { include: { tenant: true, unit: true } } } });
    const expenses = await db.expense.findMany({ where: { OR: [owned, { propertyId: null }] }, include: { property: true } });
    rows = [["Date", "Direction", "Category", "Property/Unit", "Contact", "Amount", "Status"]];
    for (const i of invoices) rows.push([d(i.dueDate), "IN", i.type, i.lease.unit.label, i.lease.tenant.name, i.amount, i.status]);
    for (const e of expenses) rows.push([d(e.date), "OUT", e.category, e.property?.name ?? "Portfolio", e.vendor ?? "", e.amount, e.status]);
  } else if (type === "expenses") {
    filename = "expenses.csv";
    const expenses = await db.expense.findMany({ where: { OR: [owned, { propertyId: null }] }, include: { property: true } });
    rows = [["Date", "Category", "Property", "Vendor", "Memo", "Amount", "Status"]];
    for (const e of expenses) rows.push([d(e.date), e.category, e.property?.name ?? "Portfolio", e.vendor ?? "", e.memo ?? "", e.amount, e.status]);
  } else {
    return new Response("Unknown export type", { status: 404 });
  }

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
