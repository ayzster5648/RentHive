import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type SearchHit = {
  type: string;
  label: string;
  sub: string;
  href: string;
};

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "LANDLORD") return NextResponse.json({ hits: [] });

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ hits: [] });

  const owned = { property: { landlordId: user.id } };
  const hits: SearchHit[] = [];

  const [properties, units, tenants, applicants, expenses, pros, requests] = await Promise.all([
    db.property.findMany({
      where: { landlordId: user.id, OR: [{ name: { contains: q, mode: "insensitive" } }, { address: { contains: q, mode: "insensitive" } }, { city: { contains: q, mode: "insensitive" } }] },
      take: 5,
    }),
    db.unit.findMany({ where: { property: { landlordId: user.id }, label: { contains: q, mode: "insensitive" } }, include: { property: true }, take: 5 }),
    db.user.findMany({
      where: { role: "TENANT", leases: { some: { unit: owned } }, OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] },
      take: 5,
    }),
    db.application.findMany({ where: { name: { contains: q, mode: "insensitive" } }, take: 5 }),
    db.expense.findMany({
      where: {
        AND: [
          { OR: [{ property: { landlordId: user.id } }, { propertyId: null }] },
          { OR: [{ vendor: { contains: q, mode: "insensitive" } }, { category: { contains: q, mode: "insensitive" } }, { memo: { contains: q, mode: "insensitive" } }] },
        ],
      },
      take: 5,
    }),
    db.servicePro.findMany({ where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { company: { contains: q, mode: "insensitive" } }, { category: { contains: q, mode: "insensitive" } }] }, take: 5 }),
    db.maintenanceRequest.findMany({ where: { unit: owned, OR: [{ title: { contains: q, mode: "insensitive" } }, { category: { contains: q, mode: "insensitive" } }] }, include: { unit: true }, take: 5 }),
  ]);

  for (const p of properties) hits.push({ type: "Property", label: p.name, sub: `${p.address}, ${p.city}`, href: `/portfolio/${p.id}` });
  for (const u of units) hits.push({ type: "Unit", label: u.label, sub: u.property.name, href: `/portfolio/${u.propertyId}` });
  for (const t of tenants) hits.push({ type: "Tenant", label: t.name, sub: t.email, href: `/renters/${t.id}` });
  for (const a of applicants) hits.push({ type: "Applicant", label: a.name, sub: a.email ?? a.phone ?? "Applicant", href: "/listings?tab=applications" });
  for (const e of expenses) hits.push({ type: "Expense", label: `${e.category} — $${e.amount}`, sub: e.vendor ?? e.memo ?? "Expense", href: "/expenses" });
  for (const pr of pros) hits.push({ type: "Service Pro", label: pr.name, sub: pr.category, href: "/maintenance?tab=pros" });
  for (const r of requests) hits.push({ type: "Maintenance", label: r.title, sub: `${r.unit.label} · ${r.category}`, href: "/maintenance" });

  return NextResponse.json({ hits });
}
