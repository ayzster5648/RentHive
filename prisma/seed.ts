import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding RentHive demo data...");

  // Clear existing data (order matters for FK constraints).
  await db.payment.deleteMany();
  await db.invoice.deleteMany();
  await db.maintenanceRequest.deleteMany();
  await db.application.deleteMany();
  await db.listing.deleteMany();
  await db.inspection.deleteMany();
  await db.document.deleteMany();
  await db.expense.deleteMany();
  await db.reminder.deleteMany();
  await db.task.deleteMany();
  await db.servicePro.deleteMany();
  await db.lease.deleteMany();
  await db.unit.deleteMany();
  await db.property.deleteMany();
  await db.user.deleteMany();

  const password = await bcrypt.hash("password123", 10);

  // --- Users ---
  const landlord = await db.user.create({
    data: {
      email: "landlord@renthive.com",
      password,
      name: "Morgan Reyes",
      phone: "(415) 555-0102",
      role: "LANDLORD",
    },
  });

  const tenants = await Promise.all(
    [
      { email: "alex@example.com", name: "Alex Tanaka", phone: "(415) 555-0111", emergencyContact: "Mai Tanaka (mom) — (415) 555-9001", notes: "1 cat. Drives a blue Civic." },
      { email: "jordan@example.com", name: "Jordan Blake", phone: "(415) 555-0122", emergencyContact: "Pat Blake — (415) 555-9002" },
      { email: "sam@example.com", name: "Sam Rivera", phone: "(415) 555-0133", emergencyContact: "Lee Rivera — (415) 555-9003" },
      { email: "casey@example.com", name: "Casey Nguyen", phone: "(415) 555-0144" },
    ].map((t) => db.user.create({ data: { ...t, password, role: "TENANT" } }))
  );

  // --- Properties + Units ---
  const maple = await db.property.create({
    data: {
      name: "Maple Court Apartments",
      address: "120 Maple Street",
      city: "San Francisco",
      state: "CA",
      zip: "94110",
      type: "Apartment",
      landlordId: landlord.id,
      imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
      units: {
        create: [
          { label: "Unit 1A", beds: 2, baths: 1, sqft: 850, rent: 2400, status: "OCCUPIED" },
          { label: "Unit 1B", beds: 1, baths: 1, sqft: 650, rent: 1950, status: "OCCUPIED" },
          { label: "Unit 2A", beds: 2, baths: 2, sqft: 1100, rent: 2900, status: "VACANT" },
        ],
      },
    },
    include: { units: true },
  });

  const oakwood = await db.property.create({
    data: {
      name: "Oakwood Townhomes",
      address: "88 Oakwood Drive",
      city: "Oakland",
      state: "CA",
      zip: "94607",
      type: "Townhouse",
      landlordId: landlord.id,
      imageUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
      units: {
        create: [
          { label: "Townhome 3", beds: 3, baths: 2.5, sqft: 1500, rent: 3500, status: "OCCUPIED" },
          { label: "Townhome 4", beds: 3, baths: 2.5, sqft: 1500, rent: 3500, status: "MAINTENANCE" },
        ],
      },
    },
    include: { units: true },
  });

  const birch = await db.property.create({
    data: {
      name: "Birch Single Family",
      address: "495 Birch Avenue",
      city: "Berkeley",
      state: "CA",
      zip: "94704",
      type: "House",
      landlordId: landlord.id,
      imageUrl: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
      units: { create: [{ label: "Main House", beds: 4, baths: 3, sqft: 2300, rent: 4200, status: "VACANT" }] },
    },
    include: { units: true },
  });

  // --- Leases (tenant -> occupied unit) ---
  const now = new Date();
  const leaseStart = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const leaseEnd = new Date(now.getFullYear() + 1, now.getMonth() - 6, 1);

  const occupied = [
    { unit: maple.units[0], tenant: tenants[0], dueDay: 1 },
    { unit: maple.units[1], tenant: tenants[1], dueDay: 1 },
    { unit: oakwood.units[0], tenant: tenants[2], dueDay: 5 },
  ];

  for (const { unit, tenant, dueDay } of occupied) {
    const lease = await db.lease.create({
      data: {
        unitId: unit.id,
        tenantId: tenant.id,
        startDate: leaseStart,
        endDate: leaseEnd,
        rentAmount: unit.rent,
        depositAmount: unit.rent,
        rentDueDay: dueDay,
        status: "ACTIVE",
      },
    });

    for (let i = 5; i >= 0; i--) {
      const dueDate = new Date(now.getFullYear(), now.getMonth() - i, dueDay);
      const isPast = i > 0;
      const invoice = await db.invoice.create({
        data: {
          leaseId: lease.id,
          type: "RENT",
          amount: unit.rent,
          dueDate,
          status: isPast ? "PAID" : "DUE",
          memo: `Rent for ${dueDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
        },
      });
      if (isPast) {
        await db.payment.create({
          data: { invoiceId: invoice.id, amount: unit.rent, method: "Card", paidAt: new Date(dueDate.getFullYear(), dueDate.getMonth(), 2) },
        });
      }
    }
  }

  // Make Jordan overdue.
  const jordanLease = await db.lease.findFirst({ where: { tenantId: tenants[1].id } });
  if (jordanLease) {
    const lastDue = await db.invoice.findFirst({ where: { leaseId: jordanLease.id, status: "DUE" }, orderBy: { dueDate: "desc" } });
    if (lastDue) {
      await db.invoice.update({
        where: { id: lastDue.id },
        data: { status: "OVERDUE", dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 8) },
      });
    }
  }

  // --- Service Pros (maintenance vendors) ---
  const pros = await Promise.all(
    [
      { name: "Joe's Plumbing", company: "Joe's Plumbing LLC", category: "Plumbing", phone: "(629) 895-1762", email: "joe@joesplumbing.com" },
      { name: "Krista Garcia", company: "KG Electric", category: "Electrical", phone: "(407) 512-4394", email: "krista@kgelectric.com" },
      { name: "Bridget Cleaning", company: "Bright Clean Co", category: "House Cleaning", phone: "(313) 693-5401", email: "hello@brightclean.com" },
      { name: "Jose Rojo", company: "Rojo Property Services", category: "General", phone: "(786) 502-6162", email: "jose@rojops.com" },
    ].map((p) => db.servicePro.create({ data: p }))
  );

  // --- Maintenance requests ---
  await db.maintenanceRequest.create({
    data: { unitId: maple.units[0].id, tenantId: tenants[0].id, title: "Leaking kitchen faucet", description: "The kitchen faucet has been dripping constantly for a few days.", category: "Plumbing", priority: "MEDIUM", status: "OPEN", assigneeId: pros[0].id },
  });
  await db.maintenanceRequest.create({
    data: { unitId: maple.units[1].id, tenantId: tenants[1].id, title: "Heater not working", description: "No heat coming from the radiator in the bedroom.", category: "Heating / Cooling", priority: "HIGH", status: "IN_PROGRESS", assigneeId: pros[1].id },
  });
  await db.maintenanceRequest.create({
    data: { unitId: oakwood.units[0].id, tenantId: tenants[2].id, title: "Garage door stuck", description: "The garage door opener stopped responding to the remote.", category: "Doors / Windows", priority: "LOW", status: "RESOLVED", assigneeId: pros[3].id },
  });
  await db.maintenanceRequest.create({
    data: { unitId: oakwood.units[1].id, tenantId: tenants[2].id, title: "Quarterly HVAC filter change", description: "Recurring HVAC maintenance.", category: "Heating / Cooling", priority: "LOW", status: "OPEN", recurring: true, assigneeId: pros[3].id },
  });

  // --- Listings + Applications ---
  const listing1 = await db.listing.create({
    data: { unitId: maple.units[2].id, rent: 2900, status: "PUBLISHED", headline: "Bright 2BR/2BA in the Mission", description: "Spacious top-floor unit with updated kitchen, in-unit laundry, and great natural light." },
  });
  const listing2 = await db.listing.create({
    data: { unitId: birch.units[0].id, rent: 4200, status: "PUBLISHED", headline: "4BR family home near campus", description: "Detached single-family home with yard, garage, and remodeled bathrooms." },
  });

  await db.application.createMany({
    data: [
      { listingId: listing1.id, name: "Priya Sharma", email: "priya@example.com", phone: "(415) 555-0201", stage: "APPLICATION", status: "IN_REVIEW", creditScore: 742, income: 9800 },
      { listingId: listing1.id, name: "Marcus Lee", email: "marcus@example.com", phone: "(415) 555-0202", stage: "SCREENING", status: "IN_REVIEW", creditScore: 705, income: 8200 },
      { listingId: listing1.id, name: "Dana White", email: "dana@example.com", phone: "(415) 555-0203", stage: "LEAD", status: "NEW" },
      { listingId: listing2.id, name: "The Okafor Family", email: "okafor@example.com", phone: "(510) 555-0204", stage: "APPLICATION", status: "APPROVED", creditScore: 788, income: 15400 },
      { listingId: listing2.id, name: "Chris Doyle", email: "chris@example.com", phone: "(510) 555-0205", stage: "LEAD", status: "NEW" },
    ],
  });

  // --- Expenses ---
  await db.expense.createMany({
    data: [
      { propertyId: maple.id, category: "Repairs", vendor: "Joe's Plumbing LLC", amount: 285, date: new Date(now.getFullYear(), now.getMonth(), 4), status: "PAID", memo: "Faucet repair Unit 1A" },
      { propertyId: maple.id, category: "Utilities", vendor: "PG&E", amount: 410, date: new Date(now.getFullYear(), now.getMonth(), 2), status: "PAID", memo: "Common area electric" },
      { propertyId: oakwood.id, category: "Landscaping", vendor: "GreenScape", amount: 180, date: new Date(now.getFullYear(), now.getMonth() - 1, 15), status: "PAID" },
      { propertyId: oakwood.id, category: "Insurance", vendor: "Statewide Ins.", amount: 1240, date: new Date(now.getFullYear(), now.getMonth() - 1, 1), status: "PAID", memo: "Annual premium" },
      { propertyId: birch.id, category: "Repairs", vendor: "KG Electric", amount: 620, date: new Date(now.getFullYear(), now.getMonth(), 9), status: "OPEN", memo: "Panel upgrade" },
    ],
  });

  // --- Inspections ---
  await db.inspection.createMany({
    data: [
      { propertyId: maple.id, unitLabel: "Unit 2A", type: "MOVE_OUT", status: "COMPLETED", inspector: "Morgan Reyes", scheduledFor: new Date(now.getFullYear(), now.getMonth() - 1, 20), notes: "Minor wall scuffs; deposit mostly returned." },
      { propertyId: birch.id, unitLabel: "Main House", type: "MOVE_IN", status: "SCHEDULED", inspector: "Morgan Reyes", scheduledFor: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5) },
      { propertyId: oakwood.id, unitLabel: "Townhome 3", type: "ROUTINE", status: "SCHEDULED", inspector: "Jose Rojo", scheduledFor: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 12) },
    ],
  });

  // --- Documents ---
  await db.document.createMany({
    data: [
      { name: "Maple 1A Lease 2024 — Signed.pdf", type: "pdf", sizeKb: 431, category: "Lease", propertyId: maple.id },
      { name: "Maple Court — Insurance Policy.pdf", type: "pdf", sizeKb: 980, category: "Insurance", propertyId: maple.id },
      { name: "Oakwood Move-in Photos.jpg", type: "jpg", sizeKb: 167, category: "Inspection", propertyId: oakwood.id },
      { name: "Birch Inspection Report.pdf", type: "pdf", sizeKb: 512, category: "Inspection", propertyId: birch.id },
      { name: "W-9 — Joe's Plumbing.pdf", type: "pdf", sizeKb: 88, category: "Tax", propertyId: null },
    ],
  });

  // --- Reminders (calendar) ---
  await db.reminder.createMany({
    data: [
      { title: "Maple 1A lease expires in 60 days", type: "LEASE", date: new Date(now.getFullYear(), now.getMonth(), 1) },
      { title: "Collect rent — all units", type: "RENT", date: new Date(now.getFullYear(), now.getMonth(), 1) },
      { title: "Birch move-in inspection", type: "INSPECTION", date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5) },
      { title: "HVAC filter change — Oakwood", type: "MAINTENANCE", date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 12) },
    ],
  });

  // --- Tasks ---
  await db.task.createMany({
    data: [
      { title: "Follow up with Priya Sharma on application", done: false, dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2) },
      { title: "Schedule Birch move-in inspection", done: true },
      { title: "Send overdue notice to Jordan Blake", done: false, dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) },
      { title: "Renew Oakwood landscaping contract", done: false },
    ],
  });

  console.log("\nSeed complete! Demo accounts (password: password123):");
  console.log("  Landlord: landlord@renthive.com");
  console.log("  Tenant:   alex@example.com (also jordan@, sam@, casey@)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
