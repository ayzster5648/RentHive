// Export the whole database to a multi-sheet Excel workbook.
//   npm run export:xlsx                 -> writes exports/renthive-<date>.xlsx
// If RESEND_API_KEY and BACKUP_EMAIL are set, it also emails the file.
// Used both locally and by the weekly GitHub Action.
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

const db = new PrismaClient();

const fmtDate = (d: Date | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : "");

function addSheet(wb: ExcelJS.Workbook, name: string, columns: { header: string; key: string }[], rows: Record<string, unknown>[]) {
  const ws = wb.addWorksheet(name);
  ws.columns = columns.map((c) => ({ ...c, width: Math.max(12, c.header.length + 2) }));
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF16745F" } };
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  rows.forEach((r) => ws.addRow(r));
  ws.views = [{ state: "frozen", ySplit: 1 }];
}

async function main() {
  const [properties, units, tenants, leases, invoices, payments, expenses, requests, applications, inspections] = await Promise.all([
    db.property.findMany({ include: { landlord: true } }),
    db.unit.findMany({ include: { property: true } }),
    db.user.findMany({ where: { role: "TENANT" }, include: { leases: { include: { unit: true } } } }),
    db.lease.findMany({ include: { tenant: true, unit: { include: { property: true } } } }),
    db.invoice.findMany({ include: { lease: { include: { tenant: true, unit: true } } } }),
    db.payment.findMany({ include: { invoice: { include: { lease: { include: { tenant: true } } } } } }),
    db.expense.findMany({ include: { property: true } }),
    db.maintenanceRequest.findMany({ include: { unit: { include: { property: true } }, tenant: true, assignee: true } }),
    db.application.findMany({ include: { listing: { include: { unit: { include: { property: true } } } } } }),
    db.inspection.findMany({ include: { property: true } }),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "RentHive";
  wb.created = new Date();

  // Summary
  const summary = wb.addWorksheet("Summary");
  summary.columns = [{ header: "Metric", key: "k", width: 28 }, { header: "Value", key: "v", width: 24 }];
  summary.getRow(1).font = { bold: true };
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  [
    ["Generated", new Date().toISOString().slice(0, 16).replace("T", " ")],
    ["Properties", properties.length],
    ["Units", units.length],
    ["Tenants", tenants.length],
    ["Active leases", leases.filter((l) => l.status === "ACTIVE").length],
    ["Invoices", invoices.length],
    ["Total collected", totalCollected],
    ["Total expenses", totalExpenses],
    ["Net", totalCollected - totalExpenses],
    ["Open maintenance", requests.filter((r) => r.status !== "RESOLVED").length],
  ].forEach(([k, v]) => summary.addRow({ k, v }));

  addSheet(wb, "Properties", [
    { header: "Name", key: "name" }, { header: "Address", key: "address" }, { header: "City", key: "city" },
    { header: "State", key: "state" }, { header: "ZIP", key: "zip" }, { header: "Type", key: "type" }, { header: "Units", key: "units" },
  ], properties.map((p) => ({ name: p.name, address: p.address, city: p.city, state: p.state, zip: p.zip, type: p.type, units: units.filter((u) => u.propertyId === p.id).length })));

  addSheet(wb, "Units", [
    { header: "Property", key: "property" }, { header: "Unit", key: "label" }, { header: "Beds", key: "beds" },
    { header: "Baths", key: "baths" }, { header: "Sqft", key: "sqft" }, { header: "Rent", key: "rent" }, { header: "Status", key: "status" },
  ], units.map((u) => ({ property: u.property.name, label: u.label, beds: u.beds, baths: u.baths, sqft: u.sqft ?? "", rent: u.rent, status: u.status })));

  addSheet(wb, "Tenants", [
    { header: "Name", key: "name" }, { header: "Email", key: "email" }, { header: "Phone", key: "phone" },
    { header: "Emergency contact", key: "ec" }, { header: "Unit", key: "unit" },
  ], tenants.map((t) => ({ name: t.name, email: t.email, phone: t.phone ?? "", ec: t.emergencyContact ?? "", unit: t.leases[0]?.unit.label ?? "" })));

  addSheet(wb, "Leases", [
    { header: "Property", key: "property" }, { header: "Unit", key: "unit" }, { header: "Tenant", key: "tenant" },
    { header: "Start", key: "start" }, { header: "End", key: "end" }, { header: "Rent", key: "rent" },
    { header: "Deposit", key: "deposit" }, { header: "Due day", key: "due" }, { header: "Status", key: "status" },
  ], leases.map((l) => ({ property: l.unit.property.name, unit: l.unit.label, tenant: l.tenant.name, start: fmtDate(l.startDate), end: fmtDate(l.endDate), rent: l.rentAmount, deposit: l.depositAmount, due: l.rentDueDay, status: l.status })));

  addSheet(wb, "Invoices", [
    { header: "Tenant", key: "tenant" }, { header: "Unit", key: "unit" }, { header: "Type", key: "type" },
    { header: "Memo", key: "memo" }, { header: "Due", key: "due" }, { header: "Amount", key: "amount" }, { header: "Status", key: "status" },
  ], invoices.map((i) => ({ tenant: i.lease.tenant.name, unit: i.lease.unit.label, type: i.type, memo: i.memo ?? "", due: fmtDate(i.dueDate), amount: i.amount, status: i.status })));

  addSheet(wb, "Payments", [
    { header: "Tenant", key: "tenant" }, { header: "Amount", key: "amount" }, { header: "Method", key: "method" }, { header: "Paid", key: "paid" },
  ], payments.map((p) => ({ tenant: p.invoice.lease.tenant.name, amount: p.amount, method: p.method, paid: fmtDate(p.paidAt) })));

  addSheet(wb, "Expenses", [
    { header: "Date", key: "date" }, { header: "Category", key: "category" }, { header: "Property", key: "property" },
    { header: "Vendor", key: "vendor" }, { header: "Memo", key: "memo" }, { header: "Amount", key: "amount" }, { header: "Status", key: "status" },
  ], expenses.map((e) => ({ date: fmtDate(e.date), category: e.category, property: e.property?.name ?? "Portfolio", vendor: e.vendor ?? "", memo: e.memo ?? "", amount: e.amount, status: e.status })));

  addSheet(wb, "Maintenance", [
    { header: "Title", key: "title" }, { header: "Category", key: "category" }, { header: "Property", key: "property" },
    { header: "Unit", key: "unit" }, { header: "Tenant", key: "tenant" }, { header: "Priority", key: "priority" },
    { header: "Status", key: "status" }, { header: "Assignee", key: "assignee" }, { header: "Created", key: "created" },
  ], requests.map((r) => ({ title: r.title, category: r.category, property: r.unit.property.name, unit: r.unit.label, tenant: r.tenant.name, priority: r.priority, status: r.status, assignee: r.assignee?.name ?? "", created: fmtDate(r.createdAt) })));

  addSheet(wb, "Applications", [
    { header: "Name", key: "name" }, { header: "Email", key: "email" }, { header: "Phone", key: "phone" },
    { header: "Listing", key: "listing" }, { header: "Stage", key: "stage" }, { header: "Status", key: "status" }, { header: "Credit", key: "credit" },
  ], applications.map((a) => ({ name: a.name, email: a.email ?? "", phone: a.phone ?? "", listing: a.listing ? `${a.listing.unit.property.name} - ${a.listing.unit.label}` : "", stage: a.stage, status: a.status, credit: a.creditScore ?? "" })));

  addSheet(wb, "Inspections", [
    { header: "Property", key: "property" }, { header: "Unit", key: "unit" }, { header: "Type", key: "type" },
    { header: "Date", key: "date" }, { header: "Inspector", key: "inspector" }, { header: "Status", key: "status" },
  ], inspections.map((i) => ({ property: i.property.name, unit: i.unitLabel ?? "", type: i.type, date: fmtDate(i.scheduledFor), inspector: i.inspector ?? "", status: i.status })));

  // Write file
  const dir = path.join(process.cwd(), "exports");
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const file = path.join(dir, `renthive-${stamp}.xlsx`);
  await wb.xlsx.writeFile(file);
  console.log(`Excel export written: ${file}`);

  // Optionally email it.
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.BACKUP_EMAIL;
  if (apiKey && to) {
    const buffer = await wb.xlsx.writeBuffer();
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "RentHive <onboarding@resend.dev>",
        to,
        subject: `RentHive weekly backup — ${stamp}`,
        text: `Your weekly RentHive data export is attached (${stamp}).`,
        attachments: [{ filename: `renthive-${stamp}.xlsx`, content: Buffer.from(buffer).toString("base64") }],
      }),
    });
    if (!res.ok) {
      console.error(`Email failed (${res.status}): ${await res.text()}`);
      process.exit(1);
    }
    console.log(`Emailed export to ${to}`);
  } else {
    console.log("(Set RESEND_API_KEY and BACKUP_EMAIL to also email the file.)");
  }
}

main()
  .catch((e) => {
    console.error("Export failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
