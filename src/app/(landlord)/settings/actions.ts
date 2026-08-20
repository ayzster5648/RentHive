"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole, verifyPassword, hashPassword, destroySession } from "@/lib/auth";

export async function updateProfile(_prev: unknown, formData: FormData) {
  const user = await requireRole("LANDLORD");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const name = [firstName, lastName].filter(Boolean).join(" ");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const company = String(formData.get("company") ?? "").trim() || null;
  const displayAsCompany = formData.get("displayAsCompany") === "on";
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;

  if (!name || !email) return { error: "First name and email are required." };
  if (displayAsCompany && !company) return { error: "Add a company name to display as a company." };

  const clash = await db.user.findFirst({ where: { email, NOT: { id: user.id } } });
  if (clash) return { error: "That email is already in use." };

  await db.user.update({
    where: { id: user.id },
    data: { name, email, phone, company, displayAsCompany, ...(imageUrl ? { imageUrl } : {}) },
  });
  revalidatePath("/settings/profile");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateAddress(_prev: unknown, formData: FormData) {
  const user = await requireRole("LANDLORD");
  await db.user.update({
    where: { id: user.id },
    data: {
      addressLine: String(formData.get("addressLine") ?? "").trim() || null,
      addressUnit: String(formData.get("addressUnit") ?? "").trim() || null,
      city: String(formData.get("city") ?? "").trim() || null,
      zip: String(formData.get("zip") ?? "").trim() || null,
      state: String(formData.get("state") ?? "").trim() || null,
    },
  });
  revalidatePath("/settings/profile");
  return { ok: true };
}

export async function updateAdditionalSettings(_prev: unknown, formData: FormData) {
  const user = await requireRole("LANDLORD");
  await db.user.update({
    where: { id: user.id },
    data: {
      timeZone: String(formData.get("timeZone") ?? "").trim() || null,
      dateFormat: String(formData.get("dateFormat") ?? "").trim() || null,
      timeFormat: String(formData.get("timeFormat") ?? "").trim() || null,
      measurement: String(formData.get("measurement") ?? "").trim() || null,
    },
  });
  revalidatePath("/settings/profile");
  return { ok: true };
}

export async function changePassword(_prev: unknown, formData: FormData) {
  const user = await requireRole("LANDLORD");
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!(await verifyPassword(current, user.password))) return { error: "Your current password is incorrect." };
  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  if (next !== confirm) return { error: "New passwords don't match." };

  await db.user.update({ where: { id: user.id }, data: { password: await hashPassword(next) } });
  return { ok: true };
}

export async function toggleTwoFactor(formData: FormData) {
  const user = await requireRole("LANDLORD");
  await db.user.update({ where: { id: user.id }, data: { twoFactor: formData.get("enabled") === "true" } });
  revalidatePath("/settings/security");
}

export async function updateNotifications(formData: FormData) {
  const user = await requireRole("LANDLORD");
  // Every notification row posts hidden keys listing which channels it exposes;
  // we read <key>__email / <key>__feed checkboxes into a JSON blob.
  const keysRaw = String(formData.get("__keys") ?? "");
  const prefs: Record<string, { email?: boolean; feed?: boolean }> = {};
  for (const entry of keysRaw.split(",").filter(Boolean)) {
    const [key, channels] = entry.split(":");
    const ch = (channels ?? "").split("|");
    prefs[key] = {};
    if (ch.includes("email")) prefs[key].email = formData.get(`${key}__email`) === "on";
    if (ch.includes("feed")) prefs[key].feed = formData.get(`${key}__feed`) === "on";
  }
  await db.user.update({
    where: { id: user.id },
    data: {
      notificationPrefs: JSON.stringify(prefs),
      // keep legacy booleans roughly in sync so the bell still works
      notifyOverdue: prefs["invoiceOverdue"]?.email ?? user.notifyOverdue,
      notifyApplications: prefs["rentalApplication"]?.email ?? user.notifyApplications,
      notifyMaintenance: prefs["maintNew"]?.email ?? user.notifyMaintenance,
      notifyInspections: prefs["inspectionCompleted"]?.email ?? user.notifyInspections,
    },
  });
  revalidatePath("/settings/notifications");
}

export async function deleteAccount(formData: FormData) {
  const user = await requireRole("LANDLORD");
  const confirmText = String(formData.get("confirm") ?? "");
  if (confirmText !== "DELETE") throw new Error("Type DELETE to confirm.");
  await db.user.delete({ where: { id: user.id } });
  await destroySession();
  redirect("/login");
}
