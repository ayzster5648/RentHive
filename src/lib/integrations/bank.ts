import "server-only";

/**
 * Bank-feed adapter (for Reconciliation).
 *
 * Default: simulated (returns no external statement lines; reconciliation runs
 * against your recorded payments/expenses only).
 * To go live: set PLAID_CLIENT_ID + PLAID_SECRET in .env and run `npm i plaid`.
 * See INTEGRATIONS.md.
 */

export type BankTxn = {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positive = deposit, negative = withdrawal
};

export type BankResult = { transactions: BankTxn[]; simulated: boolean };

export function bankConfigured(): boolean {
  return Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET && process.env.PLAID_ACCESS_TOKEN);
}

export async function fetchBankTransactions(opts: { since: Date }): Promise<BankResult> {
  if (!bankConfigured()) {
    return { transactions: [], simulated: true };
  }

  // --- Real path: Plaid /transactions/sync ---
  try {
    const specifier = "plaid";
    const { Configuration, PlaidApi, PlaidEnvironments } = await import(specifier);
    const config = new Configuration({
      basePath: PlaidEnvironments[process.env.PLAID_ENV ?? "sandbox"],
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
          "PLAID-SECRET": process.env.PLAID_SECRET,
        },
      },
    });
    const client = new PlaidApi(config);
    const res = await client.transactionsSync({ access_token: process.env.PLAID_ACCESS_TOKEN as string });
    const txns: BankTxn[] = (res.data.added ?? []).map((t: { transaction_id: string; date: string; name: string; amount: number }) => ({
      id: t.transaction_id,
      date: t.date,
      description: t.name,
      amount: -t.amount, // Plaid uses positive for outflow; flip to our convention
    }));
    void opts;
    return { transactions: txns, simulated: false };
  } catch (err) {
    throw new Error(
      "Plaid is configured but the sync failed. Run `npm i plaid`, verify your " +
        `credentials/access token, and see INTEGRATIONS.md. Original error: ${(err as Error).message}`
    );
  }
}
