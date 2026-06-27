// Sync the whole database into a Google Sheet (one tab per data type).
//   npm run sync:sheets
// Requires env:
//   GOOGLE_SERVICE_ACCOUNT_JSON  full service-account JSON (one line)
//   GOOGLE_SHEET_ID              the spreadsheet ID from its URL
// The service account email must be shared as an Editor on the sheet.
import { PrismaClient } from "@prisma/client";
import { google } from "googleapis";

const db = new PrismaClient();

type Cell = string | number;
const d = (x: Date | null | undefined) => (x ? new Date(x).toISOString().slice(0, 10) : "");

async function main() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!raw || !sheetId) {
    console.error("Missing GOOGLE_SERVICE_ACCOUNT_JSON and/or GOOGLE_SHEET_ID. See README.");
    process.exit(1);
  }
  const creds = JSON.parse(raw);

  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: (creds.private_key as string).replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  // --- Pull data ---
  const [properties, units, tenants, leases, invoices, payments, expenses, requests, applications, inspections] = await Promise.all([
    db.property.findMany(),
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

  const collected = payments.reduce((s, p) => s + p.amount, 0);
  const spent = expenses.reduce((s, e) => s + e.amount, 0);

  const tabs: Record<string, Cell[][]> = {
    Summary: [
      ["Metric", "Value"],
      ["Last updated", new Date().toISOString().slice(0, 16).replace("T", " ")],
      ["Properties", properties.length],
      ["Units", units.length],
      ["Tenants", tenants.length],
      ["Active leases", leases.filter((l) => l.status === "ACTIVE").length],
      ["Total collected", collected],
      ["Total expenses", spent],
      ["Net", collected - spent],
    ],
    Properties: [
      ["Name", "Address", "City", "State", "ZIP", "Type", "Units"],
      ...properties.map((p) => [p.name, p.address, p.city, p.state, p.zip, p.type, units.filter((u) => u.propertyId === p.id).length] as Cell[]),
    ],
    Units: [
      ["Property", "Unit", "Beds", "Baths", "Sqft", "Rent", "Status"],
      ...units.map((u) => [u.property.name, u.label, u.beds, u.baths, u.sqft ?? "", u.rent, u.status] as Cell[]),
    ],
    Tenants: [
      ["Name", "Email", "Phone", "Emergency contact", "Unit"],
      ...tenants.map((t) => [t.name, t.email, t.phone ?? "", t.emergencyContact ?? "", t.leases[0]?.unit.label ?? ""] as Cell[]),
    ],
    Leases: [
      ["Property", "Unit", "Tenant", "Start", "End", "Rent", "Deposit", "Due day", "Status"],
      ...leases.map((l) => [l.unit.property.name, l.unit.label, l.tenant.name, d(l.startDate), d(l.endDate), l.rentAmount, l.depositAmount, l.rentDueDay, l.status] as Cell[]),
    ],
    Invoices: [
      ["Tenant", "Unit", "Type", "Memo", "Due", "Amount", "Status"],
      ...invoices.map((i) => [i.lease.tenant.name, i.lease.unit.label, i.type, i.memo ?? "", d(i.dueDate), i.amount, i.status] as Cell[]),
    ],
    Payments: [
      ["Tenant", "Amount", "Method", "Paid"],
      ...payments.map((p) => [p.invoice.lease.tenant.name, p.amount, p.method, d(p.paidAt)] as Cell[]),
    ],
    Expenses: [
      ["Date", "Category", "Property", "Vendor", "Memo", "Amount", "Status"],
      ...expenses.map((e) => [d(e.date), e.category, e.property?.name ?? "Portfolio", e.vendor ?? "", e.memo ?? "", e.amount, e.status] as Cell[]),
    ],
    Maintenance: [
      ["Title", "Category", "Property", "Unit", "Tenant", "Priority", "Status", "Assignee", "Created"],
      ...requests.map((r) => [r.title, r.category, r.unit.property.name, r.unit.label, r.tenant.name, r.priority, r.status, r.assignee?.name ?? "", d(r.createdAt)] as Cell[]),
    ],
    Applications: [
      ["Name", "Email", "Phone", "Listing", "Stage", "Status", "Credit"],
      ...applications.map((a) => [a.name, a.email ?? "", a.phone ?? "", a.listing ? `${a.listing.unit.property.name} - ${a.listing.unit.label}` : "", a.stage, a.status, a.creditScore ?? ""] as Cell[]),
    ],
    Inspections: [
      ["Property", "Unit", "Type", "Date", "Inspector", "Status"],
      ...inspections.map((i) => [i.property.name, i.unitLabel ?? "", i.type, d(i.scheduledFor), i.inspector ?? "", i.status] as Cell[]),
    ],
  };

  // --- Ensure tabs exist ---
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const existing = new Set((meta.data.sheets ?? []).map((s) => s.properties?.title));
  const toAdd = Object.keys(tabs).filter((t) => !existing.has(t));
  if (toAdd.length) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: { requests: toAdd.map((title) => ({ addSheet: { properties: { title } } })) },
    });
  }

  // --- Write each tab (clear, then fill) ---
  for (const [title, values] of Object.entries(tabs)) {
    await sheets.spreadsheets.values.clear({ spreadsheetId: sheetId, range: `${title}!A1:ZZ` });
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${title}!A1`,
      valueInputOption: "RAW",
      requestBody: { values },
    });
  }

  console.log(`Synced ${Object.keys(tabs).length} tabs to Google Sheet ${sheetId}.`);
}

main()
  .catch((e) => {
    console.error("Sheets sync failed:", e?.message ?? e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
