// Snapshot the entire database to a timestamped JSON file in /backups.
// Run: npm run backup
// Backups stay local (gitignored) because they contain tenant personal data.
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const db = new PrismaClient();

async function main() {
  const data = {
    _meta: { createdAt: new Date().toISOString(), version: 1 },
    users: await db.user.findMany(),
    servicePros: await db.servicePro.findMany(),
    properties: await db.property.findMany(),
    units: await db.unit.findMany(),
    leases: await db.lease.findMany(),
    listings: await db.listing.findMany(),
    invoices: await db.invoice.findMany(),
    payments: await db.payment.findMany(),
    maintenanceRequests: await db.maintenanceRequest.findMany(),
    expenses: await db.expense.findMany(),
    applications: await db.application.findMany(),
    inspections: await db.inspection.findMany(),
    documents: await db.document.findMany(),
    reminders: await db.reminder.findMany(),
    tasks: await db.task.findMany(),
  };

  const dir = path.join(process.cwd(), "backups");
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(dir, `backup-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));

  const counts = Object.entries(data)
    .filter(([k]) => k !== "_meta")
    .map(([k, v]) => `${k}: ${(v as unknown[]).length}`)
    .join(", ");

  console.log("Backup written:");
  console.log(`  ${file}`);
  console.log(`  ${counts}`);
}

main()
  .catch((e) => {
    console.error("Backup failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
