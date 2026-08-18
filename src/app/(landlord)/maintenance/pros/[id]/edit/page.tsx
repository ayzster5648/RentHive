import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ServiceProForm } from "@/components/ServiceProForm";
import { updateServiceProFull } from "../../../../actions";

export default async function EditServiceProPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole("LANDLORD");
  const pro = await db.servicePro.findUnique({ where: { id } });
  if (!pro) notFound();

  return (
    <div>
      <Link href={`/maintenance/pros/${id}`} className="mb-4 inline-block text-sm text-brand-600 hover:underline">← Back to profile</Link>
      <PageHeader title={`Edit ${pro.name}`} />
      <ServiceProForm
        action={updateServiceProFull}
        pro={{
          id: pro.id, firstName: pro.firstName ?? "", lastName: pro.lastName ?? "", middleName: pro.middleName ?? "",
          company: pro.company ?? "", displayAsCompany: pro.displayAsCompany, website: pro.website ?? "",
          category: pro.category, subcategory: pro.subcategory ?? "", email: pro.email ?? "", additionalEmail: pro.additionalEmail ?? "",
          phone: pro.phone ?? "", additionalPhone: pro.additionalPhone ?? "", fax: pro.fax ?? "",
          address: pro.address ?? "", city: pro.city ?? "", state: pro.state ?? "", zip: pro.zip ?? "", country: pro.country ?? "",
        }}
      />
    </div>
  );
}
