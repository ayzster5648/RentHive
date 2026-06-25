import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { PageHeader, Badge } from "@/components/ui";
import { Icons } from "@/components/icons";
import { TrackView } from "@/components/TrackView";
import { AddUnitButton } from "./AddUnitButton";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("LANDLORD");

  const property = await db.property.findFirst({
    where: { id, landlordId: user.id },
    include: {
      units: {
        include: {
          leases: { where: { status: "ACTIVE" }, include: { tenant: true } },
        },
        orderBy: { label: "asc" },
      },
    },
  });

  if (!property) notFound();

  const occupied = property.units.filter((u) => u.status === "OCCUPIED").length;
  const monthlyRent = property.units
    .filter((u) => u.status === "OCCUPIED")
    .reduce((s, u) => s + u.rent, 0);

  return (
    <div>
      <TrackView id={property.id} name={property.name} sub={`${property.address}, ${property.city}`} />
      <Link href="/portfolio" className="mb-4 inline-block text-sm text-brand-600 hover:underline">
        ← Back to portfolio
      </Link>

      <PageHeader
        title={property.name}
        subtitle={`${property.address}, ${property.city}, ${property.state} ${property.zip}`}
        action={<AddUnitButton propertyId={property.id} />}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Units</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{property.units.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Occupied</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{occupied}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Vacant</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{property.units.length - occupied}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Monthly rent</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(monthlyRent)}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-5 py-3 font-medium">Unit</th>
              <th className="px-5 py-3 font-medium">Layout</th>
              <th className="px-5 py-3 font-medium">Rent</th>
              <th className="px-5 py-3 font-medium">Tenant</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {property.units.map((u) => {
              const tenant = u.leases[0]?.tenant;
              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{u.label}</td>
                  <td className="px-5 py-3 text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      {Icons.bed({ className: "h-4 w-4 text-gray-400" })}
                      {u.beds} bd · {u.baths} ba{u.sqft ? ` · ${u.sqft} sqft` : ""}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-900">{formatCurrency(u.rent)}/mo</td>
                  <td className="px-5 py-3 text-gray-600">{tenant ? tenant.name : "—"}</td>
                  <td className="px-5 py-3"><Badge status={u.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
