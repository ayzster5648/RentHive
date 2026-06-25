import "server-only";

/**
 * Payments adapter.
 *
 * Default: simulated success (no external service required).
 * To go live: set STRIPE_SECRET_KEY in .env and run `npm i stripe`.
 * The real Stripe path below activates automatically once the key is present.
 * See INTEGRATIONS.md for the full walkthrough.
 */

export type ChargeInput = {
  amount: number;
  description: string;
  tenantEmail?: string;
};

export type ChargeResult = {
  ok: boolean;
  reference: string; // payment/intent id
  method: string; // label stored on the Payment record
  simulated: boolean;
};

export function paymentsConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export async function chargeRent(input: ChargeInput): Promise<ChargeResult> {
  if (!paymentsConfigured()) {
    // --- Simulated path (default) ---
    return {
      ok: true,
      reference: `sim_${Date.now().toString(36)}`,
      method: "Card (simulated)",
      simulated: true,
    };
  }

  // --- Real path: Stripe ---
  // A variable specifier keeps the bundler/type-checker from requiring the
  // package until you actually install it.
  try {
    const specifier = "stripe";
    const StripeMod = (await import(specifier)).default;
    const stripe = new StripeMod(process.env.STRIPE_SECRET_KEY as string);

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(input.amount * 100), // cents
      currency: "usd",
      description: input.description,
      receipt_email: input.tenantEmail,
      automatic_payment_methods: { enabled: true },
    });

    return { ok: true, reference: intent.id, method: "Card (Stripe)", simulated: false };
  } catch (err) {
    throw new Error(
      "Stripe is configured (STRIPE_SECRET_KEY set) but the charge failed. " +
        "Run `npm i stripe`, double-check the key, and see INTEGRATIONS.md. " +
        `Original error: ${(err as Error).message}`
    );
  }
}
