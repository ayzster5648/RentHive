import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { Tabs } from "@/components/Tabs";
import { AddPropertyButton } from "./AddPropertyButton";
import { PortfolioProperties, type PropertyCard } from "./PortfolioProperties";
import { PortfolioUnits, type PropertyGroup } from "./PortfolioUnits";

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "properties" } = await searchParams;
  const user = await requireRole("LANDLORD");

  const properties = await db.property.findMany({
    where: { landlordId: user.id, archived: false },
    include: {
      units: { include: { leases: { where: { status: "ACTIVE" }, include: { tenant: true, invoices: true } } }, orderBy: { label: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  const cards: PropertyCard[] = properties.map((p) => {
    const occupied = p.units.filter((u) => u.status === "OCCUPIED").length;
    const balance = p.units.flatMap((u) => u.leases).flatMap((l) => l.invoices).filter((i) => i.status !== "PAID").reduce((s, i) => s + i.amount, 0);
    return {
      id: p.id,
      name: p.name,
      address: `${p.address}, ${p.city}, ${p.state} ${p.zip}`,
      imageUrl: p.imageUrl,
      type: p.type,
      unitType: p.unitType,
      unitsCount: p.units.length,
      occupiedCount: occupied,
      occupancyPct: p.units.length ? Math.round((occupied / p.units.length) * 100) : 0,
      balance,
    };
  });

  const groups: PropertyGroup[] = properties.map((p) => ({
    id: p.id,
    name: p.name,
    address: `${p.address}, ${p.city}, ${p.state} ${p.zip}`,
    imageUrl: p.imageUrl,
    units: p.units.map((u) => ({
      id: u.id,
      label: u.label,
      kind: p.unitType === "SINGLE" ? p.type.toUpperCase() : "UNIT",
      status: u.status,
      beds: u.beds,
      baths: u.baths,
      sqft: u.sqft,
      rent: u.rent,
      tenant: u.leases[0]?.tenant.name ?? null,
    })),
  }));

  const tabs = [
    { key: "properties", label: "Properties", href: "/portfolio" },
    { key: "units", label: "Units", href: "/portfolio?tab=units" },
  ];

  return (
    <div>
      <PageHeader
        title="Portfolio"
        action={
          <div className="flex gap-2">
            <span className="btn-secondary cursor-default opacity-60" title="CSV import coming soon">Import</span>
            <AddPropertyButton />
          </div>
        }
      />
      <Tabs tabs={tabs} active={tab} />
      {tab === "properties" ? <PortfolioProperties properties={cards} /> : <PortfolioUnits groups={groups} />}
    </div>
  );
}
