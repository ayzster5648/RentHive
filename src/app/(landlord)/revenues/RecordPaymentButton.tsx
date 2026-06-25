"use client";

import { recordPayment } from "../actions";

export function RecordPaymentButton({ invoiceId }: { invoiceId: string }) {
  return (
    <form action={recordPayment}>
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <input type="hidden" name="method" value="Manual" />
      <button type="submit" className="btn-primary px-3 py-1 text-xs">
        Mark paid
      </button>
    </form>
  );
}
