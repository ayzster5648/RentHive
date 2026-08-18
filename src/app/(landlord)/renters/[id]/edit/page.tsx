import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { TenantForm } from "@/components/TenantForm";
import { updateTenantFull } from "../../../actions";

export default async function EditTenantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole("LANDLORD");
  const t = await db.user.findUnique({ where: { id } });
  if (!t || t.role !== "TENANT") notFound();

  const [firstName, ...rest] = t.name.split(" ");
  return (
    <div>
      <Link href={`/renters/${id}`} className="mb-4 inline-block text-sm text-brand-600 hover:underline">← Back to profile</Link>
      <PageHeader title={`Edit ${t.name}`} />
      <TenantForm
        action={updateTenantFull}
        tenant={{
          id: t.id, firstName: firstName ?? "", lastName: rest.join(" "), middleName: t.middleName ?? "",
          company: t.company ?? "", displayAsCompany: t.displayAsCompany, dob: t.dob ? t.dob.toISOString().slice(0, 10) : "",
          email: t.email, additionalEmail: t.additionalEmail ?? "", phone: t.phone ?? "", additionalPhone: t.additionalPhone ?? "",
          forwardingAddress: t.forwardingAddress ?? "", emergencyContact: t.emergencyContact ?? "",
        }}
      />
    </div>
  );
}
