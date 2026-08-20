"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { chargeRent } from "@/lib/integrations/payments";
import { emailEnabled } from "@/lib/notifications";

export async function payInvoice(formData: FormData) {
  const user = await requireRole("TENANT");
  const invoiceId = String(formData.get("invoiceId") ?? "");
  if (!invoiceId) throw new Error("Missing invoice.");

  // Verify the invoice belongs to a lease held by this tenant.
  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, lease: { tenantId: user.id } },
  });
  if (!invoice) throw new Error("Invoice not found.");
  if (invoice.status === "PAID") return;

  // Routes through Stripe automatically when STRIPE_SECRET_KEY is set;
  // otherwise records a simulated card payment. See src/lib/integrations/payments.ts.
  const charge = await chargeRent({
    amount: invoice.amount,
    description: invoice.memo ?? `Rent payment (${invoice.id})`,
    tenantEmail: user.email,
  });
  if (!charge.ok) throw new Error("Payment could not be processed.");

  await db.$transaction([
    db.payment.create({ data: { invoiceId, amount: invoice.amount, method: charge.method } }),
    db.invoice.update({ where: { id: invoiceId }, data: { status: "PAID" } }),
  ]);

  revalidatePath("/portal");
  revalidatePath("/portal/payments");
}

export async function createMaintenanceRequest(formData: FormData) {
  const user = await requireRole("TENANT");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "MEDIUM");
  if (!title || !description) throw new Error("Title and description are required.");

  // Attach to the tenant's active lease's unit.
  const lease = await db.lease.findFirst({
    where: { tenantId: user.id, status: "ACTIVE" },
  });
  if (!lease) throw new Error("No active lease found.");

  await db.maintenanceRequest.create({
    data: {
      unitId: lease.unitId,
      tenantId: user.id,
      title,
      description,
      priority: priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      status: "OPEN",
      refNumber: Math.floor(100000 + Math.random() * 900000),
    },
  });

  // Notify the landlord if their "new maintenance request" email is enabled.
  const unit = await db.unit.findUnique({ where: { id: lease.unitId }, include: { property: true } });
  const landlordId = unit?.property.landlordId;
  if (landlordId && (await emailEnabled(landlordId, "maintNew"))) {
    const landlord = await db.user.findUnique({ where: { id: landlordId } });
    if (landlord) {
      const { sendEmail } = await import("@/lib/integrations/notifications");
      await sendEmail({
        to: landlord.email,
        subject: `New maintenance request: ${title}`,
        body: `${user.name} submitted a maintenance request at ${unit?.property.name} (${unit?.label}).\n\n${title}\n${description}\n\nPriority: ${priority}`,
      });
    }
  }

  revalidatePath("/portal/maintenance");
  revalidatePath("/portal");
  revalidatePath("/maintenance");
}
