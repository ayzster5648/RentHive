import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

// A payment's detail is its invoice's transaction view.
export default async function PaymentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("LANDLORD");
  const payment = await db.payment.findFirst({
    where: { id, invoice: { lease: { unit: { property: { landlordId: user.id } } } } },
  });
  if (!payment) notFound();
  redirect(`/revenues/tx/inv-${payment.invoiceId}`);
}
