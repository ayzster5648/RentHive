"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function addBankAccount(formData: FormData) {
  const user = await requireRole("LANDLORD");
  const bankName = String(formData.get("bankName") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim() || null;
  let mask = String(formData.get("mask") ?? "").trim().replace(/\D/g, "").slice(-4);
  if (!bankName) throw new Error("Bank name is required.");
  if (!mask) mask = String(Math.floor(1000 + Math.random() * 9000));
  await db.bankAccount.create({ data: { landlordId: user.id, bankName, nickname, mask } });
  revalidatePath("/reconciliation");
}

/**
 * Create a reconciliation and generate its bank-statement lines from the
 * landlord's recorded payments (deposits) and paid expenses (withdrawals) in
 * the period. Without a live bank feed, this mirrors your records so matching
 * works end to end.
 */
export async function createReconciliation(formData: FormData) {
  const user = await requireRole("LANDLORD");
  const bankAccountId = String(formData.get("bankAccountId") ?? "");
  const startRaw = String(formData.get("startDate") || "");
  if (!bankAccountId) throw new Error("Choose a bank account.");
  const bank = await db.bankAccount.findFirst({ where: { id: bankAccountId, landlordId: user.id } });
  if (!bank) throw new Error("Bank account not found.");

  const startDate = startRaw ? new Date(startRaw) : new Date(new Date().getFullYear(), 0, 1);
  const rec = await db.reconciliation.create({ data: { bankAccountId, startDate } });
  await generateLines(rec.id, user.id, startDate);

  revalidatePath("/reconciliation");
  redirect(`/reconciliation/${rec.id}`);
}

async function generateLines(reconciliationId: string, landlordId: string, since: Date) {
  const payments = await db.payment.findMany({
    where: { paidAt: { gte: since }, invoice: { lease: { unit: { property: { landlordId } } } } },
    include: { invoice: { include: { lease: { include: { tenant: true } } } } },
  });
  const expenses = await db.expense.findMany({
    where: { status: "PAID", date: { gte: since }, OR: [{ property: { landlordId } }, { propertyId: null }] },
  });

  const existing = await db.bankStatementLine.findMany({ where: { reconciliationId }, select: { description: true, amount: true, date: true } });
  const seen = new Set(existing.map((l) => `${l.description}|${l.amount}|${new Date(l.date).toDateString()}`));

  const lines = [
    ...payments.map((p) => ({ date: p.paidAt, description: `Payment — ${p.invoice.lease.tenant.name}`, amount: p.amount })),
    ...expenses.map((e) => ({ date: e.date, description: `${e.category}${e.vendor ? ` — ${e.vendor}` : ""}`, amount: -e.amount })),
  ].filter((l) => !seen.has(`${l.description}|${l.amount}|${new Date(l.date).toDateString()}`));

  if (lines.length) await db.bankStatementLine.createMany({ data: lines.map((l) => ({ ...l, reconciliationId })) });
  return lines.length;
}

export async function refreshFeed(formData: FormData) {
  const user = await requireRole("LANDLORD");
  const id = String(formData.get("id") ?? "");
  const rec = await db.reconciliation.findFirst({ where: { id, bankAccount: { landlordId: user.id } } });
  if (!rec) throw new Error("Reconciliation not found.");
  await generateLines(id, user.id, rec.startDate);
  revalidatePath(`/reconciliation/${id}`);
}

export async function matchLine(formData: FormData) {
  await requireRole("LANDLORD");
  const lineId = String(formData.get("lineId") ?? "");
  const matchedRef = String(formData.get("matchedRef") ?? "").trim() || "Account payment";
  if (!lineId) throw new Error("Missing line.");
  const line = await db.bankStatementLine.update({ where: { id: lineId }, data: { matchStatus: "MATCHED", matchedRef } });
  revalidatePath(`/reconciliation/${line.reconciliationId}`);
  redirect(`/reconciliation/${line.reconciliationId}?view=statement&sub=toreview`);
}

export async function setLineStatus(formData: FormData) {
  await requireRole("LANDLORD");
  const lineId = String(formData.get("lineId") ?? "");
  const status = String(formData.get("status") ?? "TO_REVIEW");
  const line = await db.bankStatementLine.update({ where: { id: lineId }, data: { matchStatus: status } });
  revalidatePath(`/reconciliation/${line.reconciliationId}`);
}

export async function addLineNote(formData: FormData) {
  await requireRole("LANDLORD");
  const lineId = String(formData.get("lineId") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  const line = await db.bankStatementLine.update({ where: { id: lineId }, data: { note } });
  revalidatePath(`/reconciliation/${line.reconciliationId}`);
}

export async function updateReconciliation(formData: FormData) {
  await requireRole("LANDLORD");
  const id = String(formData.get("id") ?? "");
  const autoRefresh = formData.get("autoRefresh") === "on";
  const startRaw = String(formData.get("startDate") || "");
  await db.reconciliation.update({ where: { id }, data: { autoRefresh, ...(startRaw ? { startDate: new Date(startRaw) } : {}) } });
  revalidatePath(`/reconciliation/${id}`);
}

export async function deleteReconciliation(formData: FormData) {
  await requireRole("LANDLORD");
  const id = String(formData.get("id") ?? "");
  if (id) await db.reconciliation.delete({ where: { id } });
  revalidatePath("/reconciliation");
  redirect("/reconciliation");
}
