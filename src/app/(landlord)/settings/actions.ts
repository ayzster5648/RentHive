"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, verifyPassword, hashPassword } from "@/lib/auth";

export async function updateProfile(_prev: unknown, formData: FormData) {
  const user = await requireRole("LANDLORD");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const name = [firstName, lastName].filter(Boolean).join(" ");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const company = String(formData.get("company") ?? "").trim() || null;
  const displayAsCompany = formData.get("displayAsCompany") === "on";

  if (!name || !email) return { error: "First name and email are required." };
  if (displayAsCompany && !company) return { error: "Add a company name to display as a company." };

  // Guard against taking another user's email.
  const clash = await db.user.findFirst({ where: { email, NOT: { id: user.id } } });
  if (clash) return { error: "That email is already in use." };

  await db.user.update({ where: { id: user.id }, data: { name, email, phone, company, displayAsCompany } });
  revalidatePath("/settings/profile");
  revalidatePath("/", "layout");
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

export async function updateNotifications(formData: FormData) {
  const user = await requireRole("LANDLORD");
  await db.user.update({
    where: { id: user.id },
    data: {
      notifyOverdue: formData.get("notifyOverdue") === "on",
      notifyApplications: formData.get("notifyApplications") === "on",
      notifyMaintenance: formData.get("notifyMaintenance") === "on",
      notifyInspections: formData.get("notifyInspections") === "on",
    },
  });
  revalidatePath("/settings/notifications");
}
