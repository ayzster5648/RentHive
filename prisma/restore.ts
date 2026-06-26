// Restore the database from a backup JSON file.
// Run: npm run restore -- backups/backup-<timestamp>.json
// This REPLACES all current data with the backup's contents.
import { PrismaClient } from "@prisma/client";
import fs from "fs";

const db = new PrismaClient();

// Convert ISO date strings back into Date objects on load.
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
function reviver(_key: string, value: unknown) {
  return typeof value === "string" && ISO.test(value) ? new Date(value) : value;
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: npm run restore -- <path-to-backup.json>");
    process.exit(1);
  }
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(file, "utf8"), reviver);

  // Clear in child-first order.
  await db.payment.deleteMany();
  await db.invoice.deleteMany();
  await db.maintenanceRequest.deleteMany();
  await db.application.deleteMany();
  await db.expense.deleteMany();
  await db.inspection.deleteMany();
  await db.document.deleteMany();
  await db.reminder.deleteMany();
  await db.task.deleteMany();
  await db.listing.deleteMany();
  await db.lease.deleteMany();
  await db.unit.deleteMany();
  await db.property.deleteMany();
  await db.servicePro.deleteMany();
  await db.user.deleteMany();

  // Insert in parent-first order.
  const insert = async (rows: unknown[] | undefined, fn: (r: never) => Promise<unknown>) => {
    for (const r of rows ?? []) await fn(r as never);
  };
  await insert(data.users, (r) => db.user.create({ data: r }));
  await insert(data.servicePros, (r) => db.servicePro.create({ data: r }));
  await insert(data.properties, (r) => db.property.create({ data: r }));
  await insert(data.units, (r) => db.unit.create({ data: r }));
  await insert(data.leases, (r) => db.lease.create({ data: r }));
  await insert(data.listings, (r) => db.listing.create({ data: r }));
  await insert(data.invoices, (r) => db.invoice.create({ data: r }));
  await insert(data.payments, (r) => db.payment.create({ data: r }));
  await insert(data.maintenanceRequests, (r) => db.maintenanceRequest.create({ data: r }));
  await insert(data.expenses, (r) => db.expense.create({ data: r }));
  await insert(data.applications, (r) => db.application.create({ data: r }));
  await insert(data.inspections, (r) => db.inspection.create({ data: r }));
  await insert(data.documents, (r) => db.document.create({ data: r }));
  await insert(data.reminders, (r) => db.reminder.create({ data: r }));
  await insert(data.tasks, (r) => db.task.create({ data: r }));

  console.log(`Restored from ${file} (backup taken ${data._meta?.createdAt ?? "unknown"}).`);
}

main()
  .catch((e) => {
    console.error("Restore failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
