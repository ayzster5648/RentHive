import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PropertyEditForm } from "./PropertyEditForm";

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("LANDLORD");
  const property = await db.property.findFirst({ where: { id, landlordId: user.id } });
  if (!property) notFound();

  return (
    <div>
      <div className="mb-3 text-sm text-gray-400">
        <Link href="/portfolio" className="text-brand-600 hover:underline">Portfolio</Link> / <Link href={`/portfolio/${id}`} className="text-brand-600 hover:underline">{property.name}</Link> / <span className="text-gray-700">Edit</span>
      </div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Edit property</h1>
      <PropertyEditForm
        id={property.id}
        name={property.name}
        yearBuilt={property.yearBuilt ? String(property.yearBuilt) : ""}
        mls={property.mls ?? ""}
        address={property.address}
        city={property.city}
        state={property.state}
        zip={property.zip}
        country={property.country}
        status={property.status ?? ""}
        amenities={property.amenities}
        imageUrl={property.imageUrl ?? ""}
      />
    </div>
  );
}
