"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole, hashPassword } from "@/lib/auth";
import { nextDueDate, formatCurrency } from "@/lib/utils";

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

/** Rich create-property form: general info, type, single-unit details, amenities. */
export async function createPropertyFull(formData: FormData) {
  const user = await requireRole("LANDLORD");

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const zip = String(formData.get("zip") ?? "").trim();
  if (!name || !address || !city || !state || !zip) {
    throw new Error("Property name and full address are required.");
  }

  const unitType = String(formData.get("unitType") ?? "SINGLE");
  const yearBuiltRaw = String(formData.get("yearBuilt") ?? "").trim();
  const property = await db.property.create({
    data: {
      name,
      address,
      city,
      state,
      zip,
      country: String(formData.get("country") ?? "United States").trim() || "United States",
      type: String(formData.get("type") ?? "House"),
      unitType,
      yearBuilt: yearBuiltRaw ? Number(yearBuiltRaw) : null,
      mls: String(formData.get("mls") ?? "").trim() || null,
      isMobileHome: formData.get("isMobileHome") === "yes",
      isAffordableHousing: formData.get("isAffordableHousing") === "yes",
      parking: String(formData.get("parking") ?? "").trim() || null,
      laundry: String(formData.get("laundry") ?? "").trim() || null,
      airConditioning: String(formData.get("airConditioning") ?? "").trim() || null,
      features: formData.getAll("features").map(String),
      amenities: formData.getAll("amenities").map(String),
      imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
      landlordId: user.id,
    },
  });

  // A single-unit property is itself the rentable unit — create it inline.
  if (unitType === "SINGLE") {
    await db.unit.create({
      data: {
        propertyId: property.id,
        label: name,
        beds: Number(formData.get("beds") ?? 1) || 1,
        baths: Number(formData.get("baths") ?? 1) || 1,
        sqft: Number(formData.get("sqft") ?? 0) || null,
        rent: Number(formData.get("marketRent") ?? 0) || 0,
        deposit: Number(formData.get("deposit") ?? 0) || 0,
        status: "VACANT",
      },
    });
  }

  revalidatePath("/portfolio");
  revalidatePath("/dashboard");
  redirect(`/portfolio/${property.id}`);
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

/** Move In wizard: create/reuse tenant, create the lease + recurring rent + first invoice. */
export async function completeMoveIn(formData: FormData) {
  await requireRole("LANDLORD");

  const unitId = String(formData.get("unitId") ?? "");
  const tenantName = String(formData.get("tenantName") ?? "").trim();
  const tenantEmail = String(formData.get("tenantEmail") ?? "").trim().toLowerCase();
  const tenantPhone = String(formData.get("tenantPhone") ?? "").trim() || null;
  const leaseType = String(formData.get("leaseType") ?? "FIXED");
  const startDate = new Date(String(formData.get("startDate") || new Date().toISOString().slice(0, 10)));
  const endRaw = String(formData.get("endDate") || "");
  const rentAmount = Number(formData.get("rentAmount") ?? 0);
  const enableRecurring = formData.get("enableRecurring") === "on";
  const markPaid = formData.get("markPaid") === "on";

  if (!unitId) throw new Error("Select a property and unit.");
  if (!tenantName || !tenantEmail) throw new Error("Tenant name and email are required.");

  const unit = await db.unit.findUnique({ where: { id: unitId } });
  if (!unit) throw new Error("Unit not found.");

  // For month-to-month, default the end date a year out.
  const endDate = endRaw ? new Date(endRaw) : new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
  const dueDay = Math.min(Math.max(startDate.getDate(), 1), 28);

  const mover = await requireRole("LANDLORD");
  let tenant = await db.user.findUnique({ where: { email: tenantEmail } });
  if (tenant) {
    tenant = await db.user.update({ where: { id: tenant.id }, data: { name: tenantName, phone: tenantPhone, role: "TENANT", managedById: mover.id } });
  } else {
    tenant = await db.user.create({ data: { name: tenantName, email: tenantEmail, phone: tenantPhone, role: "TENANT", managedById: mover.id, password: await hashPassword("password123") } });
  }

  const lease = await db.lease.create({
    data: {
      unitId, tenantId: tenant.id, startDate, endDate,
      rentAmount: rentAmount || unit.rent, depositAmount: rentAmount || unit.rent,
      rentDueDay: dueDay, status: "ACTIVE",
    },
  });

  await db.unit.update({ where: { id: unitId }, data: { status: "OCCUPIED" } });

  // First rent invoice.
  await db.invoice.create({
    data: { leaseId: lease.id, type: "RENT", amount: rentAmount || unit.rent, dueDate: nextDueDate(dueDay, startDate), status: markPaid ? "PAID" : "DUE", memo: "First month's rent" },
  });

  if (enableRecurring) {
    const next = new Date(nextDueDate(dueDay, startDate));
    next.setMonth(next.getMonth() + 1);
    await db.recurringInvoice.create({
      data: { leaseId: lease.id, category: "Rent", amount: rentAmount || unit.rent, frequency: "MONTHLY", startDate, endDate: leaseType === "FIXED" ? endDate : null, nextDate: next, status: "ACTIVE", details: "Rent" },
    });
  }

  // Extra move-in charges (deposits + one-time transactions from the wizard).
  try {
    const extras = JSON.parse(String(formData.get("extraCharges") || "[]")) as { label: string; type: string; amount: number }[];
    for (const c of extras) {
      const amt = Number(c.amount);
      if (!amt || amt <= 0) continue;
      await db.invoice.create({
        data: { leaseId: lease.id, type: c.type === "DEPOSIT" ? "DEPOSIT" : "OTHER", amount: amt, dueDate: startDate, status: markPaid ? "PAID" : "DUE", memo: c.label || (c.type === "DEPOSIT" ? "Deposit" : "Charge") },
      });
    }
  } catch { /* ignore malformed extras */ }

  revalidatePath("/renters");
  revalidatePath("/dashboard");
  redirect(`/renters/leases/${lease.id}`);
}

/** Email an overdue-balance reminder to a tenant (simulated unless email is configured). */
export async function sendBalanceNotice(formData: FormData) {
  const user = await requireRole("LANDLORD");
  const tenantId = String(formData.get("tenantId") ?? "");
  const tenant = await db.user.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error("Tenant not found.");

  const invoices = await db.invoice.findMany({
    where: { status: { not: "PAID" }, lease: { tenantId, unit: { property: { landlordId: user.id } } } },
  });
  const balance = invoices.reduce((s, i) => s + i.amount, 0);

  const { sendEmail } = await import("@/lib/integrations/notifications");
  await sendEmail({
    to: tenant.email,
    subject: `Rent balance reminder — ${formatCurrency(balance)} due`,
    body: `Hi ${tenant.name.split(" ")[0]},\n\nOur records show an outstanding balance of ${formatCurrency(balance)}. Please submit payment at your earliest convenience.\n\nThank you.`,
  });
  revalidatePath("/renters");
}

/** Apply a credit toward a tenant's oldest unpaid invoice (records it as a payment). */
export async function applyCredit(formData: FormData) {
  const user = await requireRole("LANDLORD");
  const tenantId = String(formData.get("tenantId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  if (!amount || amount <= 0) throw new Error("Enter a credit amount.");

  const oldest = await db.invoice.findFirst({
    where: { status: { not: "PAID" }, lease: { tenantId, unit: { property: { landlordId: user.id } } } },
    orderBy: { dueDate: "asc" },
  });
  if (!oldest) throw new Error("No open invoice to credit.");

  await db.$transaction([
    db.payment.create({ data: { invoiceId: oldest.id, amount: Math.min(amount, oldest.amount), method: "Credit" } }),
    ...(amount >= oldest.amount ? [db.invoice.update({ where: { id: oldest.id }, data: { status: "PAID" as const } })] : []),
  ]);
  revalidatePath("/renters");
}

function tenantData(formData: FormData) {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const middleName = String(formData.get("middleName") ?? "").trim() || null;
  const company = String(formData.get("company") ?? "").trim() || null;
  const name = [firstName, lastName].filter(Boolean).join(" ") || company || firstName;
  const dobRaw = String(formData.get("dob") ?? "");
  return {
    name,
    middleName,
    company,
    displayAsCompany: formData.get("displayAsCompany") === "on",
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    additionalEmail: String(formData.get("additionalEmail") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    additionalPhone: String(formData.get("additionalPhone") ?? "").trim() || null,
    dob: dobRaw ? new Date(dobRaw) : null,
    forwardingAddress: String(formData.get("forwardingAddress") ?? "").trim() || null,
    emergencyContact: String(formData.get("emergencyContact") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

/** Create a standalone tenant record (no lease). Assign a unit later via Move In. */
export async function createTenantFull(formData: FormData) {
  const user = await requireRole("LANDLORD");
  const data = tenantData(formData);
  if (!data.name || !data.email) throw new Error("First name and email are required.");
  const existing = await db.user.findUnique({ where: { email: data.email } });
  const tenant = existing
    ? await db.user.update({ where: { id: existing.id }, data: { ...data, role: "TENANT", managedById: user.id } })
    : await db.user.create({ data: { ...data, role: "TENANT", managedById: user.id, password: await hashPassword("password123") } });
  revalidatePath("/renters");
  redirect(`/renters/${tenant.id}`);
}

export async function updateTenantFull(formData: FormData) {
  await requireRole("LANDLORD");
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing tenant.");
  await db.user.update({ where: { id }, data: tenantData(formData) });
  revalidatePath(`/renters/${id}`);
  redirect(`/renters/${id}`);
}

export async function archiveTenant(formData: FormData) {
  await requireRole("LANDLORD");
  const id = String(formData.get("id") ?? "");
  const t = await db.user.findUnique({ where: { id } });
  if (t) await db.user.update({ where: { id }, data: { archived: !t.archived } });
  revalidatePath("/renters");
}

export async function deleteTenant(formData: FormData) {
  await requireRole("LANDLORD");
  const id = String(formData.get("id") ?? "");
  // Only allow deleting tenants with no active lease.
  const leaseCount = await db.lease.count({ where: { tenantId: id, status: "ACTIVE" } });
  if (leaseCount > 0) throw new Error("End the tenant's active lease before deleting.");
  if (id) await db.user.delete({ where: { id } });
  revalidatePath("/renters");
  redirect("/renters?tab=renters");
}

export async function createInsurance(formData: FormData) {
  await requireRole("LANDLORD");
  const tenantId = String(formData.get("tenantId") ?? "");
  const policyNumber = String(formData.get("policyNumber") ?? "").trim();
  const effRaw = String(formData.get("effectiveDate") || "");
  const expRaw = String(formData.get("expirationDate") || "");
  if (!tenantId || !policyNumber || !effRaw || !expRaw) throw new Error("Policy #, effective and expiration dates are required.");

  await db.insurance.create({
    data: {
      tenantId,
      leaseId: String(formData.get("leaseId") ?? "") || null,
      company: String(formData.get("company") ?? "").trim() || null,
      website: String(formData.get("website") ?? "").trim() || null,
      policyNumber,
      effectiveDate: new Date(effRaw),
      expirationDate: new Date(expRaw),
      details: String(formData.get("details") ?? "").trim() || null,
    },
  });
  revalidatePath(`/renters/${tenantId}`);
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

// Plain-argument actions used by the drag-and-drop board.
export async function setMaintenanceStatus(id: string, status: "OPEN" | "IN_PROGRESS" | "RESOLVED") {
  await requireRole("LANDLORD");
  if (!id || !["OPEN", "IN_PROGRESS", "RESOLVED"].includes(status)) return;
  await db.maintenanceRequest.update({ where: { id }, data: { status } });
  revalidatePath("/maintenance");
}

export async function setMaintenanceAssignee(id: string, assigneeId: string | null) {
  await requireRole("LANDLORD");
  if (!id) return;
  await db.maintenanceRequest.update({ where: { id }, data: { assigneeId: assigneeId || null } });
  revalidatePath("/maintenance");
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

function serviceProData(formData: FormData) {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim() || null;
  const displayAsCompany = formData.get("displayAsCompany") === "on";
  const name = displayAsCompany && company ? company : [firstName, lastName].filter(Boolean).join(" ");
  return {
    name: name || firstName || "Service Pro",
    firstName: firstName || null,
    lastName: lastName || null,
    middleName: String(formData.get("middleName") ?? "").trim() || null,
    company,
    displayAsCompany,
    website: String(formData.get("website") ?? "").trim() || null,
    category: String(formData.get("category") ?? "General").trim() || "General",
    subcategory: String(formData.get("subcategory") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    additionalPhone: String(formData.get("additionalPhone") ?? "").trim() || null,
    fax: String(formData.get("fax") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    additionalEmail: String(formData.get("additionalEmail") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    city: String(formData.get("city") ?? "").trim() || null,
    state: String(formData.get("state") ?? "").trim() || null,
    zip: String(formData.get("zip") ?? "").trim() || null,
    country: String(formData.get("country") ?? "").trim() || null,
  };
}

export async function createServiceProFull(formData: FormData) {
  await requireRole("LANDLORD");
  const data = serviceProData(formData);
  if (!data.firstName && !data.company) throw new Error("First name is required.");
  await db.servicePro.create({ data });
  revalidatePath("/maintenance");
  redirect("/maintenance?tab=pros");
}

export async function updateServiceProFull(formData: FormData) {
  await requireRole("LANDLORD");
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing service pro.");
  await db.servicePro.update({ where: { id }, data: serviceProData(formData) });
  revalidatePath("/maintenance");
  revalidatePath(`/maintenance/pros/${id}`);
  redirect(`/maintenance/pros/${id}`);
}

export async function archiveServicePro(formData: FormData) {
  await requireRole("LANDLORD");
  const id = String(formData.get("id") ?? "");
  const pro = await db.servicePro.findUnique({ where: { id } });
  if (pro) await db.servicePro.update({ where: { id }, data: { archived: !pro.archived } });
  revalidatePath("/maintenance");
}

export async function deleteServicePro(formData: FormData) {
  await requireRole("LANDLORD");
  const id = String(formData.get("id") ?? "");
  if (id) await db.servicePro.delete({ where: { id } });
  revalidatePath("/maintenance");
}

export async function createRecurringMaintenance(formData: FormData) {
  await requireRole("LANDLORD");
  const user = await requireRole("LANDLORD");
  const unitId = String(formData.get("unitId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!unitId || !title) throw new Error("Unit and title are required.");
  const unit = await db.unit.findUnique({ where: { id: unitId }, include: { leases: { where: { status: "ACTIVE" } } } });
  await db.maintenanceRequest.create({
    data: {
      unitId,
      tenantId: unit?.leases[0]?.tenantId ?? user.id,
      title,
      description: String(formData.get("description") ?? "").trim() || title,
      category: String(formData.get("category") ?? "General").trim(),
      priority: (String(formData.get("priority") ?? "MEDIUM")) as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      recurring: true,
      assigneeId: String(formData.get("assigneeId") ?? "") || null,
      status: "OPEN",
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

// --- Recurring invoices ---
export async function postNextRecurringInvoice(formData: FormData) {
  await requireRole("LANDLORD");
  const id = String(formData.get("id") ?? "");
  const rec = await db.recurringInvoice.findUnique({ where: { id } });
  if (!rec || rec.status !== "ACTIVE") throw new Error("Recurring schedule not found or ended.");

  await db.invoice.create({
    data: {
      leaseId: rec.leaseId,
      type: "RENT",
      amount: rec.amount,
      dueDate: rec.nextDate,
      status: "DUE",
      memo: rec.details ?? rec.category,
    },
  });

  // Advance nextDate by the frequency (monthly).
  const next = new Date(rec.nextDate);
  next.setMonth(next.getMonth() + 1);
  const ended = rec.endDate && next > new Date(rec.endDate);
  await db.recurringInvoice.update({
    where: { id },
    data: { nextDate: next, status: ended ? "ENDED" : "ACTIVE" },
  });

  revalidatePath("/revenues");
  revalidatePath(`/revenues/recurring/${id}`);
}

export async function endRecurring(formData: FormData) {
  await requireRole("LANDLORD");
  const id = String(formData.get("id") ?? "");
  await db.recurringInvoice.update({ where: { id }, data: { status: "ENDED" } });
  revalidatePath("/revenues");
  revalidatePath(`/revenues/recurring/${id}`);
}

// --- Record income (full form) ---
export async function createIncome(formData: FormData) {
  const user = await requireRole("LANDLORD");
  const amount = Number(formData.get("amount") ?? 0);
  if (!amount) throw new Error("Amount is required.");

  const [category, subcategory] = String(formData.get("categoryPath") ?? "Rent").split(" / ");
  const scope = String(formData.get("scope") ?? "PROPERTY");
  const tags = String(formData.get("tags") ?? "").trim();
  const detailsRaw = String(formData.get("details") ?? "").trim();
  const details = [detailsRaw, tags ? `Tags: ${tags}` : ""].filter(Boolean).join(" · ") || null;

  await db.income.create({
    data: {
      landlordId: user.id,
      scope,
      category: category ?? "Rent",
      subcategory: subcategory ?? null,
      propertyId: scope === "PROPERTY" ? String(formData.get("propertyId") ?? "") || null : null,
      payer: String(formData.get("payer") ?? "").trim() || null,
      amount,
      dueDate: new Date(String(formData.get("dueDate") || new Date().toISOString().slice(0, 10))),
      status: formData.get("markPaid") === "on" ? "PAID" : "DUE",
      details,
    },
  });

  revalidatePath("/revenues");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  redirect("/revenues");
}

// --- Record expense (full form) ---
export async function createExpenseFull(formData: FormData) {
  await requireRole("LANDLORD");
  const amount = Number(formData.get("amount") ?? 0);
  if (!amount) throw new Error("Amount is required.");

  const [category, subcategory] = String(formData.get("categoryPath") ?? "Repairs").split(" / ");
  const scope = String(formData.get("scope") ?? "PROPERTY");
  const tags = String(formData.get("tags") ?? "").trim();
  const detailsRaw = String(formData.get("details") ?? "").trim();
  const memo = [detailsRaw, tags ? `Tags: ${tags}` : ""].filter(Boolean).join(" · ") || null;

  await db.expense.create({
    data: {
      amount,
      category: subcategory ? `${category} / ${subcategory}` : category,
      vendor: String(formData.get("payee") ?? "").trim() || null,
      memo,
      propertyId: scope === "PROPERTY" ? String(formData.get("propertyId") ?? "") || null : null,
      status: formData.get("markPaid") === "on" ? "PAID" : "OPEN",
      date: new Date(String(formData.get("dueDate") || new Date().toISOString().slice(0, 10))),
    },
  });

  revalidatePath("/expenses");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  redirect("/expenses");
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

export async function createListingFull(formData: FormData) {
  await requireRole("LANDLORD");
  const unitId = String(formData.get("unitId") ?? "");
  const rent = Number(formData.get("rent") ?? 0);
  if (!unitId) throw new Error("Choose a unit to list.");
  const num = (k: string) => { const v = String(formData.get(k) ?? "").trim(); return v ? Number(v) : null; };
  const dateAvailable = String(formData.get("dateAvailable") ?? "");

  await db.listing.create({
    data: {
      unitId,
      rent,
      status: "PUBLISHED",
      headline: String(formData.get("headline") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      securityDeposit: num("securityDeposit"),
      amountRefundable: num("amountRefundable"),
      dateAvailable: dateAvailable ? new Date(dateAvailable) : null,
      minLease: num("minLease"),
      maxLease: num("maxLease"),
      monthToMonth: formData.get("monthToMonth") === "on",
      leasingDetails: String(formData.get("leasingDetails") ?? "").trim() || null,
      petsAllowed: formData.get("petsAllowed") === "on",
      petsPolicy: String(formData.get("petsPolicy") ?? "").trim() || null,
      parking: String(formData.get("parking") ?? "").trim() || null,
      laundry: String(formData.get("laundry") ?? "").trim() || null,
      airConditioning: String(formData.get("airConditioning") ?? "").trim() || null,
      amenities: formData.getAll("amenities").map(String),
      features: formData.getAll("features").map(String),
      coverPhotoUrl: String(formData.get("coverPhotoUrl") ?? "").trim() || null,
      videoUrl: String(formData.get("videoUrl") ?? "").trim() || null,
      screeningTier: String(formData.get("screeningTier") ?? "Full check"),
      incomeVerification: formData.get("incomeVerification") === "on",
      onlineApplications: formData.get("onlineApplications") === "on",
      contactName: String(formData.get("contactName") ?? "").trim() || null,
      contactPhone: String(formData.get("contactPhone") ?? "").trim() || null,
      contactEmail: String(formData.get("contactEmail") ?? "").trim() || null,
      displayPhone: formData.get("displayPhone") === "on",
      ribbonType: String(formData.get("ribbonType") ?? "None"),
      ribbonTitle: String(formData.get("ribbonTitle") ?? "").trim() || null,
      ribbonColor: String(formData.get("ribbonColor") ?? "").trim() || null,
      syndication: formData.getAll("syndication").map(String),
    },
  });

  // Mark the unit as listed (still vacant until move-in).
  revalidatePath("/listings");
  redirect("/listings");
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
export async function saveDashboardWidgets(formData: FormData) {
  const user = await requireRole("LANDLORD");
  const widgets = formData.getAll("widgets").map(String);
  await db.user.update({ where: { id: user.id }, data: { dashboardWidgets: widgets } });
  revalidatePath("/dashboard");
}

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
