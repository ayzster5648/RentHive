"use client";

import { payInvoice } from "../../actions";

export function PayButton({ invoiceId }: { invoiceId: string }) {
  return (
    <form action={payInvoice}>
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <button type="submit" className="btn-primary px-3 py-1 text-xs">Pay now</button>
    </form>
  );
}
