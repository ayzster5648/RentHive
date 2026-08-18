import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { TenantForm } from "@/components/TenantForm";
import { createTenantFull } from "../../actions";

export default async function NewTenantPage() {
  await requireRole("LANDLORD");
  return (
    <div>
      <Link href="/renters?tab=renters" className="mb-4 inline-block text-sm text-brand-600 hover:underline">← Back to renters</Link>
      <PageHeader title="Add a tenant" subtitle="Create a tenant record. Assign them to a unit later with Move In." />
      <TenantForm action={createTenantFull} />
    </div>
  );
}
