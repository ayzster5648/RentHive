import "server-only";

/**
 * Notifications adapter (email; SMS analogous).
 *
 * Default: simulated (logs to the server console).
 * To go live: set RESEND_API_KEY in .env and run `npm i resend`.
 * See INTEGRATIONS.md.
 */

// "tenant" recipients are NEVER really emailed unless the account owner
// explicitly opts in with ALLOW_TENANT_EMAIL=true. This keeps RentHive from
// contacting tenants' real inboxes. Default audience is "tenant" (the safe one).
export type EmailInput = { to: string; subject: string; body: string; audience?: "landlord" | "tenant" };
export type EmailResult = { ok: boolean; simulated: boolean };

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function tenantEmailAllowed(): boolean {
  return process.env.ALLOW_TENANT_EMAIL === "true";
}

export async function sendEmail(input: EmailInput): Promise<EmailResult> {
  const audience = input.audience ?? "tenant";
  const blockedTenant = audience === "tenant" && !tenantEmailAllowed();

  if (!emailConfigured() || blockedTenant) {
    // --- Simulated path (default, and always for tenants) ---
    console.log(`[email:simulated${blockedTenant ? ":tenant-blocked" : ""}] to=${input.to} subject="${input.subject}"`);
    return { ok: true, simulated: true };
  }

  // --- Real path: Resend ---
  try {
    const specifier = "resend";
    const { Resend } = await import(specifier);
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "RentHive <onboarding@resend.dev>",
      to: input.to,
      subject: input.subject,
      text: input.body,
    });
    return { ok: true, simulated: false };
  } catch (err) {
    throw new Error(
      "Email is configured but sending failed. Run `npm i resend`, verify " +
        `RESEND_API_KEY, and see INTEGRATIONS.md. Original error: ${(err as Error).message}`
    );
  }
}
