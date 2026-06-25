import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { Icons } from "@/components/icons";

const groups = [
  {
    heading: "Rental",
    blurb: "Performance and status of your rental properties.",
    reports: [
      { slug: "rent-roll", name: "Rent Roll", live: true },
      { slug: "contacts", name: "Contacts", live: true },
      { slug: "maintenance", name: "Maintenance Requests", live: true },
      { slug: "tenant-statement", name: "Tenant Statement", live: true },
      { slug: "rentability", name: "Rentability", live: false },
      { slug: "vacant-rentals", name: "Vacant Rentals", live: true },
    ],
  },
  {
    heading: "Financial",
    blurb: "Financial health and performance across your portfolio.",
    reports: [
      { slug: "income-statement", name: "Income Statement", live: true },
      { slug: "general-income", name: "General Income", live: true },
      { slug: "general-expenses", name: "General Expenses", live: true },
      { slug: "property-expenses", name: "Property Expenses", live: true },
    ],
  },
];

export default async function ReportsPage() {
  await requireRole("LANDLORD");
  return (
    <div>
      <PageHeader title="Reports" subtitle="Generate insights from your live data." />
      {groups.map((g) => (
        <div key={g.heading} className="mb-8">
          <h2 className="font-semibold text-gray-900">{g.heading}</h2>
          <p className="mb-3 text-sm text-gray-500">{g.blurb}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.reports.map((r) => (
              <Link
                key={r.slug}
                href={`/reports/${r.slug}`}
                className="card flex items-center justify-between p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  {Icons.reports({ className: "h-5 w-5 text-brand-600" })}
                  <span className="font-medium text-gray-900">{r.name}</span>
                </div>
                {r.live ? (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">LIVE</span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">SOON</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
