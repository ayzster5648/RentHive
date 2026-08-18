import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader, Badge, Avatar, EmptyState } from "@/components/ui";
import { Tabs } from "@/components/Tabs";
import { Icons } from "@/components/icons";
import { AddApplicantButton, ApplicantStageControl } from "./ListingButtons";

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

  void unitOptions;
  const action = tab === "listings"
    ? <Link href="/listings/new" className="btn-primary">{Icons.plus({ className: "h-4 w-4" })}Add listing</Link>
    : <AddApplicantButton listings={listingOptions} stage={stageForTab[tab] ?? "LEAD"} />;

  return (
    <div>
      <PageHeader title="Listings & Applications" action={action} />
      <Tabs tabs={tabs} active={tab} />

      {tab === "listings" ? (
        listings.length === 0 ? (
          <EmptyState title="No active listings" hint="List a vacant unit to start collecting applications." />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((l) => (
              <div key={l.id} className="card overflow-hidden">
                <div className="relative flex h-40 items-center justify-center bg-brand-50">
                  {(l.coverPhotoUrl || l.unit.property.imageUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.coverPhotoUrl ?? l.unit.property.imageUrl ?? ""} alt="" className="h-full w-full object-cover" />
                  ) : Icons.listings({ className: "h-10 w-10 text-brand-300" })}
                  <span className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {l.status === "PUBLISHED" ? "Listed" : l.status === "DRAFT" ? "Draft" : "Rented"}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{l.unit.property.name}, {l.unit.label}</p>
                      <p className="text-xs text-gray-400">{l.unit.property.address}, {l.unit.property.city}, {l.unit.property.state}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(l.rent)}</p>
                      <p className="text-[10px] text-gray-400">Rent/monthly</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">{Icons.bed({ className: "h-4 w-4 text-gray-400" })} <span className="font-medium">x {l.unit.beds}</span> <span className="text-xs text-gray-400">Bedrooms</span></div>
                    <div className="flex items-center gap-1 text-gray-600"><span className="text-gray-400">◍</span> <span className="font-medium">x {l.unit.baths}</span> <span className="text-xs text-gray-400">Bathrooms</span></div>
                  </div>
                  <Link href="/listings/new" className="mt-3 flex items-center justify-center gap-1 border-t border-gray-100 pt-3 text-sm font-medium text-brand-600 hover:underline">
                    List unit {Icons.plus({ className: "h-3 w-3" })}
                  </Link>
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

const emptyText: Record<string, string> = {
  LEAD: "No leads",
  APPLICATION: "No applications",
  SCREENING: "No screenings",
};

async function ApplicantList({ stage, showScreening }: { stage: "LEAD" | "APPLICATION" | "SCREENING"; landlordId: string; showScreening: boolean }) {
  const apps = await db.application.findMany({
    where: { stage },
    include: { listing: { include: { unit: { include: { property: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  if (apps.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-20 text-center text-gray-400">
        {Icons.renters({ className: "h-8 w-8" })}
        <p className="mt-2 font-medium text-gray-500">{emptyText[stage]}</p>
        <p className="text-sm">There are no {stage.toLowerCase()}s on this page.</p>
      </div>
    );
  }

  // Leads use a lightweight contact-style table.
  if (stage === "LEAD") {
    return (
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Source</th>
              <th className="px-5 py-3 font-medium">Last update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {apps.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-5 py-3"><Badge status={a.status} /></td>
                <td className="px-5 py-3 font-medium text-gray-900">{a.name}</td>
                <td className="px-5 py-3 text-gray-600">{a.phone ?? "—"}</td>
                <td className="px-5 py-3 text-gray-600">{a.email ?? "—"}</td>
                <td className="px-5 py-3 text-gray-500">{a.listing ? "Listing" : "Manual"}</td>
                <td className="px-5 py-3 text-gray-500">{formatDate(a.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

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
