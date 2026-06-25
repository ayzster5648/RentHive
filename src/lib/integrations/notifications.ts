import "server-only";

/**
 * Notifications adapter (email; SMS analogous).
 *
 * Default: simulated (logs to the server console).
 * To go live: set RESEND_API_KEY in .env and run `npm i resend`.
 * See INTEGRATIONS.md.
 */

export type EmailInput = { to: string; subject: string; body: string };
export type EmailResult = { ok: boolean; simulated: boolean };

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(input: EmailInput): Promise<EmailResult> {
  if (!emailConfigured()) {
    // --- Simulated path (default) ---
    console.log(`[email:simulated] to=${input.to} subject="${input.subject}"`);
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
