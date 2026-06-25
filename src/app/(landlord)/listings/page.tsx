import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader, Badge, Avatar, EmptyState } from "@/components/ui";
import { Tabs } from "@/components/Tabs";
import { Icons } from "@/components/icons";
import { AddListingButton, AddApplicantButton, ApplicantStageControl } from "./ListingButtons";

const stageForTab: Record<string, "LEAD" | "APPLICATION" | "SCREENING"> = {
  leads: "LEAD",
  applications: "APPLICATION",
  screenings: "SCREENING",
};

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "listings" } = await searchParams;
  const user = await requireRole("LANDLORD");

  const listings = await db.listing.findMany({
    where: { unit: { property: { landlordId: user.id } } },
    include: { unit: { include: { property: true } }, applications: true },
    orderBy: { createdAt: "desc" },
  });

  const vacantUnits = await db.unit.findMany({
    where: { status: "VACANT", property: { landlordId: user.id } },
    include: { property: true },
  });
  const unitOptions = vacantUnits.map((u) => ({ id: u.id, label: u.label, propertyName: u.property.name, rent: u.rent }));
  const listingOptions = listings.map((l) => ({ id: l.id, label: `${l.unit.property.name} — ${l.unit.label}` }));

  const counts = await db.application.groupBy({ by: ["stage"], _count: true });
  const countFor = (s: string) => counts.find((c) => c.stage === s)?._count ?? 0;

  const tabs = [
    { key: "listings", label: "Listings", href: "/listings", badge: String(listings.length) },
    { key: "leads", label: "Leads", href: "/listings?tab=leads", badge: String(countFor("LEAD")) },
    { key: "applications", label: "Applications", href: "/listings?tab=applications", badge: String(countFor("APPLICATION")) },
    { key: "screenings", label: "Screenings", href: "/listings?tab=screenings", badge: String(countFor("SCREENING")) },
  ];

  const action = tab === "listings"
    ? <AddListingButton units={unitOptions} />
    : <AddApplicantButton listings={listingOptions} stage={stageForTab[tab] ?? "LEAD"} />;

  return (
    <div>
      <PageHeader title="Listings & Applications" action={action} />
      <Tabs tabs={tabs} active={tab} />

      {tab === "listings" ? (
        listings.length === 0 ? (
          <EmptyState title="No active listings" hint="List a vacant unit to start collecting applications." />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <div key={l.id} className="card overflow-hidden">
                <div className="flex h-32 items-center justify-center bg-brand-50">
                  {l.unit.property.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.unit.property.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : Icons.listings({ className: "h-10 w-10 text-brand-300" })}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(l.rent)}<span className="text-sm font-normal text-gray-400">/mo</span></span>
                    <Badge status={l.status} />
                  </div>
                  <p className="mt-1 text-sm font-medium text-gray-800">{l.headline ?? l.unit.label}</p>
                  <p className="text-xs text-gray-400">{l.unit.property.name} · {l.unit.label}</p>
                  <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
                    <span>{l.unit.beds} bd</span><span>{l.unit.baths} ba</span>
                    {l.unit.sqft && <span>{l.unit.sqft} sqft</span>}
                    <span className="ml-auto font-medium text-brand-700">{l.applications.length} application{l.applications.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <ApplicantList stage={stageForTab[tab]} landlordId={user.id} showScreening={tab === "screenings"} />
      )}
    </div>
  );
}

async function ApplicantList({ stage, showScreening }: { stage: "LEAD" | "APPLICATION" | "SCREENING"; landlordId: string; showScreening: boolean }) {
  const apps = await db.application.findMany({
    where: { stage },
    include: { listing: { include: { unit: { include: { property: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  if (apps.length === 0) return <EmptyState title={`No ${stage.toLowerCase()}s yet`} hint="Add one with the button above." />;

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="px-5 py-3 font-medium">Applicant</th>
            <th className="px-5 py-3 font-medium">Listing</th>
            {showScreening && <th className="px-5 py-3 font-medium">Credit</th>}
            {showScreening && <th className="px-5 py-3 font-medium">Income</th>}
            <th className="px-5 py-3 font-medium">Applied</th>
            <th className="px-5 py-3 font-medium">Status & stage</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {apps.map((a) => (
            <tr key={a.id} className="hover:bg-gray-50">
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={a.name} />
                  <div>
                    <p className="font-medium text-gray-900">{a.name}</p>
                    <p className="text-xs text-gray-400">{a.email ?? a.phone ?? "—"}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3 text-gray-600">{a.listing ? `${a.listing.unit.property.name} — ${a.listing.unit.label}` : "—"}</td>
              {showScreening && <td className="px-5 py-3">{a.creditScore ? <span className={a.creditScore >= 720 ? "font-medium text-green-600" : a.creditScore >= 660 ? "text-amber-600" : "text-red-600"}>{a.creditScore}</span> : "—"}</td>}
              {showScreening && <td className="px-5 py-3 text-gray-600">{a.income ? `${formatCurrency(a.income)}/mo` : "—"}</td>}
              <td className="px-5 py-3 text-gray-500">{formatDate(a.createdAt)}</td>
              <td className="px-5 py-3"><ApplicantStageControl id={a.id} stage={a.stage} status={a.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
