// Clean slate: remove all demo properties, tenants, leases, invoices, and
// requests, but keep (or create) a single landlord login so you can sign in
// and enter your own data. Run with: npm run db:fresh
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const LANDLORD_EMAIL = "landlord@renthive.com";
const LANDLORD_NAME = "Property Manager";

async function main() {
  // Safety guard: refuse to wipe a database that already has data,
  // unless explicitly overridden with ALLOW_DB_WIPE=1.
  const propertyCount = await db.property.count();
  if (propertyCount > 0 && process.env.ALLOW_DB_WIPE !== "1") {
    console.error(
      "\n⛔ This database already has data (" + propertyCount + " properties).\n" +
      "   `db:fresh` would DELETE all properties, tenants, and records.\n" +
      "   If you're sure, run:  ALLOW_DB_WIPE=1 npm run db:fresh\n" +
      "   (Tip: take a backup first with `npm run backup`.)\n"
    );
    process.exit(1);
  }

  await db.payment.deleteMany();
  await db.invoice.deleteMany();
  await db.maintenanceRequest.deleteMany();
  await db.lease.deleteMany();
  await db.unit.deleteMany();
  await db.property.deleteMany();
  // Remove all tenant accounts; keep landlord accounts.
  await db.user.deleteMany({ where: { role: "TENANT" } });

  const password = await bcrypt.hash("password123", 10);
  await db.user.upsert({
    where: { email: LANDLORD_EMAIL },
    update: {},
    create: { email: LANDLORD_EMAIL, name: LANDLORD_NAME, password, role: "LANDLORD" },
  });

  console.log("Clean slate ready.");
  console.log(`  Sign in: ${LANDLORD_EMAIL} / password123`);
  console.log("  Add your properties, then units, then tenants.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
