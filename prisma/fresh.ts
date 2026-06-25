// Clean slate: remove all demo properties, tenants, leases, invoices, and
// requests, but keep (or create) a single landlord login so you can sign in
// and enter your own data. Run with: npm run db:fresh
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const LANDLORD_EMAIL = "landlord@renthive.com";
const LANDLORD_NAME = "Property Manager";

async function main() {
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
