"use client";

import { postNextRecurringInvoice, endRecurring } from "../../../actions";

export function RecurringActions({ id, active }: { id: string; active: boolean }) {
  if (!active) return <span className="text-sm text-gray-400">Ended</span>;
  return (
    <div className="flex items-center gap-2">
      <form action={postNextRecurringInvoice}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="btn-primary">Post next invoice</button>
      </form>
      <form action={endRecurring}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="btn-secondary">End</button>
      </form>
    </div>
  );
}
