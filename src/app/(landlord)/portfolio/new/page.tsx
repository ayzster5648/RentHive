import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { PropertyForm } from "./PropertyForm";

export default async function NewPropertyPage() {
  await requireRole("LANDLORD");
  return (
    <div>
      <Link href="/portfolio" className="mb-4 inline-block text-sm text-brand-600 hover:underline">← Back to portfolio</Link>
      <PageHeader title="Add a property" subtitle="Enter the property details below." />
      <PropertyForm />
    </div>
  );
}
