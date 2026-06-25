"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole, hashPassword } from "@/lib/auth";
import { nextDueDate } from "@/lib/utils";

export async function createProperty(formData: FormData) {
  const user = await requireRole("LANDLORD");

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const zip = String(formData.get("zip") ?? "").trim();
  const type = String(formData.get("type") ?? "Apartment").trim();

  if (!name || !address || !city || !state || !zip) {
    throw new Error("All property fields are required.");
  }

  await db.property.create({
    data: { name, address, city, state, zip, type, landlordId: user.id },
  });

  revalidatePath("/portfolio");
  revalidatePath("/dashboard");
}

export async function addUnit(formData: FormData) {
  await requireRole("LANDLORD");

  const propertyId = String(formData.get("propertyId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const beds = Number(formData.get("beds") ?? 1);
  const baths = Number(formData.get("baths") ?? 1);
  const rent = Number(formData.get("rent") ?? 0);

  if (!propertyId || !label) throw new Error("Unit label is required.");

  await db.unit.create({
    data: { propertyId, label, beds, baths, rent, status: "VACANT" },
  });

  revalidatePath(`/portfolio/${propertyId}`);
  revalidatePath("/dashboard");
}

/**
 * Onboard a tenant: create (or reuse) their user account, place them on a
 * vacant unit with a lease, mark the unit occupied, and raise the first rent
 * invoice due on the chosen day of the month.
 */
export async function addTenant(formData: FormData) {
  await requireRole("LANDLORD");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const emergencyContact = String(formData.get("emergencyContact") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const unitId = String(formData.get("unitId") ?? "");
  const rentAmount = Number(formData.get("rentAmount") ?? 0);
  const depositAmount = Number(formData.get("depositAmount") ?? 0);
  const rentDueDay = Number(formData.get("rentDueDay") ?? 1);
  const startDate = new Date(String(formData.get("startDate") || new Date().toISOString().slice(0, 10)));
  const endDate = new Date(String(formData.get("endDate") || ""));

  if (!name || !email) throw new Error("Tenant name and email are required.");
  if (!unitId) throw new Error("Please choose a unit for this tenant.");
  if (isNaN(endDate.getTime())) throw new Error("A lease end date is required.");

  const unit = await db.unit.findUnique({ where: { id: unitId } });
  if (!unit) throw new Error("Unit not found.");

  // Reuse an existing tenant account by email, otherwise create one.
  let tenant = await db.user.findUnique({ where: { email } });
  if (tenant) {
    tenant = await db.user.update({
      where: { id: tenant.id },
      data: { name, phone, emergencyContact, notes, role: "TENANT" },
    });
  } else {
    tenant = await db.user.create({
      data: {
        name,
        email,
        phone,
        emergencyContact,
        notes,
        role: "TENANT",
        // Default password so the tenant can sign in; they'd reset it in a real app.
        password: await hashPassword("password123"),
      },
    });
  }

  const lease = await db.lease.create({
    data: {
      unitId,
      tenantId: tenant.id,
      startDate,
      endDate,
      rentAmount,
      depositAmount,
      rentDueDay,
      status: "ACTIVE",
    },
  });

  await db.$transaction([
    db.unit.update({ where: { id: unitId }, data: { status: "OCCUPIED" } }),
    db.invoice.create({
      data: {
        leaseId: lease.id,
        type: "RENT",
        amount: rentAmount,
        dueDate: nextDueDate(rentDueDay, startDate),
        status: "DUE",
        memo: "First month's rent",
      },
    }),
  ]);

  revalidatePath("/renters");
  revalidatePath("/dashboard");
  redirect(`/renters/${tenant.id}`);
}

export async function updateTenant(formData: FormData) {
  await requireRole("LANDLORD");

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const emergencyContact = String(formData.get("emergencyContact") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!id || !name) throw new Error("Name is required.");

  await db.user.update({
    where: { id },
    data: { name, phone, emergencyContact, notes },
  });

  revalidatePath(`/renters/${id}`);
  revalidatePath("/renters");
}

/**
 * Raise this month's rent invoice for every active lease that doesn't already
 * have one. Lets the landlord bill the whole portfolio in one click.
 */
export async function generateMonthlyRent() {
  const user = await requireRole("LANDLORD");
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const leases = await db.lease.findMany({
    where: { status: "ACTIVE", unit: { property: { landlordId: user.id } } },
    include: { invoices: { where: { type: "RENT", dueDate: { gte: monthStart, lt: monthEnd } } } },
  });

  const toCreate = leases
    .filter((l) => l.invoices.length === 0)
    .map((l) => ({
      leaseId: l.id,
      type: "RENT" as const,
      amount: l.rentAmount,
      dueDate: new Date(now.getFullYear(), now.getMonth(), Math.min(l.rentDueDay, 28)),
      status: "DUE" as const,
      memo: `Rent for ${now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
    }));

  if (toCreate.length) await db.invoice.createMany({ data: toCreate });

  revalidatePath("/revenues");
  revalidatePath("/dashboard");
}

export async function recordPayment(formData: FormData) {
  await requireRole("LANDLORD");

  const invoiceId = String(formData.get("invoiceId") ?? "");
  const manualMethod = String(formData.get("method") ?? "");
  if (!invoiceId) throw new Error("Missing invoice.");

  const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error("Invoice not found.");

  // A landlord recording a payment is typically marking an offline payment
  // (cash/check/manual), so default to that label unless a processor is wired.
  const method = manualMethod || "Manual";

  await db.$transaction([
    db.payment.create({ data: { invoiceId, amount: invoice.amount, method } }),
    db.invoice.update({ where: { id: invoiceId }, data: { status: "PAID" } }),
  ]);

  revalidatePath("/revenues");
  revalidatePath("/dashboard");
}

export async function updateMaintenanceStatus(formData: FormData) {
  await requireRole("LANDLORD");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["OPEN", "IN_PROGRESS", "RESOLVED"].includes(status)) {
    throw new Error("Invalid request.");
  }

  await db.maintenanceRequest.update({
    where: { id },
    data: { status: status as "OPEN" | "IN_PROGRESS" | "RESOLVED" },
  });

  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
}

// --- Maintenance: landlord records a request ---
export async function createMaintenanceRequestLandlord(formData: FormData) {
  await requireRole("LANDLORD");
  const unitId = String(formData.get("unitId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "General").trim();
  const priority = String(formData.get("priority") ?? "MEDIUM");
  const assigneeId = String(formData.get("assigneeId") ?? "") || null;
  if (!unitId || !title) throw new Error("Unit and title are required.");

  const unit = await db.unit.findUnique({ where: { id: unitId }, include: { leases: { where: { status: "ACTIVE" } } } });
  const tenantId = unit?.leases[0]?.tenantId;
  // Fall back to the landlord as reporter if the unit has no tenant.
  const user = await requireRole("LANDLORD");

  await db.maintenanceRequest.create({
    data: {
      unitId,
      tenantId: tenantId ?? user.id,
      title,
      description: description || title,
      category,
      priority: priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      assigneeId,
      status: "OPEN",
    },
  });
  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
}

export async function assignServicePro(formData: FormData) {
  await requireRole("LANDLORD");
  const id = String(formData.get("id") ?? "");
  const assigneeId = String(formData.get("assigneeId") ?? "") || null;
  if (!id) throw new Error("Missing request.");
  await db.maintenanceRequest.update({ where: { id }, data: { assigneeId } });
  revalidatePath("/maintenance");
}

export async function createServicePro(formData: FormData) {
  await requireRole("LANDLORD");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required.");
  await db.servicePro.create({
    data: {
      name,
      company: String(formData.get("company") ?? "").trim() || null,
      category: String(formData.get("category") ?? "General").trim(),
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
    },
  });
  revalidatePath("/maintenance");
}

// --- Expenses ---
export async function createExpense(formData: FormData) {
  await requireRole("LANDLORD");
  const amount = Number(formData.get("amount") ?? 0);
  if (!amount) throw new Error("Amount is required.");
  await db.expense.create({
    data: {
      amount,
      category: String(formData.get("category") ?? "Repairs").trim(),
      vendor: String(formData.get("vendor") ?? "").trim() || null,
      memo: String(formData.get("memo") ?? "").trim() || null,
      propertyId: String(formData.get("propertyId") ?? "") || null,
      status: String(formData.get("status") ?? "PAID"),
      date: new Date(String(formData.get("date") || new Date().toISOString().slice(0, 10))),
    },
  });
  revalidatePath("/expenses");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

// --- Listings ---
export async function createListing(formData: FormData) {
  await requireRole("LANDLORD");
  const unitId = String(formData.get("unitId") ?? "");
  const rent = Number(formData.get("rent") ?? 0);
  if (!unitId) throw new Error("Choose a unit to list.");
  await db.listing.create({
    data: {
      unitId,
      rent,
      headline: String(formData.get("headline") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      status: "PUBLISHED",
    },
  });
  revalidatePath("/listings");
}

export async function addApplication(formData: FormData) {
  await requireRole("LANDLORD");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Applicant name is required.");
  await db.application.create({
    data: {
      name,
      email: String(formData.get("email") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      listingId: String(formData.get("listingId") ?? "") || null,
      stage: (String(formData.get("stage") ?? "LEAD")) as "LEAD" | "APPLICATION" | "SCREENING",
      status: "NEW",
    },
  });
  revalidatePath("/listings");
}

export async function updateApplication(formData: FormData) {
  await requireRole("LANDLORD");
  const id = String(formData.get("id") ?? "");
  const stage = String(formData.get("stage") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id) throw new Error("Missing application.");
  await db.application.update({
    where: { id },
    data: {
      ...(stage ? { stage: stage as "LEAD" | "APPLICATION" | "SCREENING" } : {}),
      ...(status ? { status: status as "NEW" | "IN_REVIEW" | "APPROVED" | "DECLINED" } : {}),
    },
  });
  revalidatePath("/listings");
}

// --- Inspections ---
export async function createInspection(formData: FormData) {
  await requireRole("LANDLORD");
  const propertyId = String(formData.get("propertyId") ?? "");
  if (!propertyId) throw new Error("Choose a property.");
  await db.inspection.create({
    data: {
      propertyId,
      unitLabel: String(formData.get("unitLabel") ?? "").trim() || null,
      type: (String(formData.get("type") ?? "ROUTINE")) as "MOVE_IN" | "MOVE_OUT" | "ROUTINE",
      inspector: String(formData.get("inspector") ?? "").trim() || null,
      scheduledFor: new Date(String(formData.get("scheduledFor") || new Date().toISOString().slice(0, 10))),
      notes: String(formData.get("notes") ?? "").trim() || null,
      status: "SCHEDULED",
    },
  });
  revalidatePath("/inspections");
}

export async function updateInspectionStatus(formData: FormData) {
  await requireRole("LANDLORD");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id) throw new Error("Missing inspection.");
  await db.inspection.update({ where: { id }, data: { status: status as "SCHEDULED" | "COMPLETED" | "CANCELED" } });
  revalidatePath("/inspections");
}

// --- Documents ---
export async function createDocument(formData: FormData) {
  await requireRole("LANDLORD");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Document name is required.");
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "pdf";
  await db.document.create({
    data: {
      name,
      type: ext,
      sizeKb: Number(formData.get("sizeKb") ?? 0) || Math.round(50 + Math.random() * 800),
      category: String(formData.get("category") ?? "Lease").trim(),
      propertyId: String(formData.get("propertyId") ?? "") || null,
    },
  });
  revalidatePath("/documents");
}

// --- Tasks & reminders ---
export async function createTask(formData: FormData) {
  await requireRole("LANDLORD");
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Task title is required.");
  const dueRaw = String(formData.get("dueDate") ?? "");
  await db.task.create({ data: { title, dueDate: dueRaw ? new Date(dueRaw) : null } });
  revalidatePath("/dashboard");
}

export async function toggleTask(formData: FormData) {
  await requireRole("LANDLORD");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const task = await db.task.findUnique({ where: { id } });
  if (task) await db.task.update({ where: { id }, data: { done: !task.done } });
  revalidatePath("/dashboard");
}

export async function createReminder(formData: FormData) {
  await requireRole("LANDLORD");
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  if (!title || !date) throw new Error("Title and date are required.");
  await db.reminder.create({
    data: { title, date: new Date(date), type: (String(formData.get("type") ?? "CUSTOM")) as "LEASE" | "RENT" | "MAINTENANCE" | "INSPECTION" | "CUSTOM" },
  });
  revalidatePath("/dashboard");
}
