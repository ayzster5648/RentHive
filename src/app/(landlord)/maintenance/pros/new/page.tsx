import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ServiceProForm } from "@/components/ServiceProForm";
import { createServiceProFull } from "../../../actions";

export default async function NewServiceProPage() {
  await requireRole("LANDLORD");
  return (
    <div>
      <Link href="/maintenance?tab=pros" className="mb-4 inline-block text-sm text-brand-600 hover:underline">← Back to service pros</Link>
      <PageHeader title="Add a service pro" subtitle="Add a vendor or contractor you work with." />
      <ServiceProForm action={createServiceProFull} />
    </div>
  );
}
