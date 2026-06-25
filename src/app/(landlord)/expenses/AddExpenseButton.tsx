"use client";

import { Modal } from "@/components/Modal";
import { createExpense } from "../actions";

export function AddExpenseButton({ properties }: { properties: { id: string; name: string }[] }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <Modal trigger={{ label: "Record expense", icon: true }} title="Record an expense">
      {(close) => (
        <form action={async (fd) => { await createExpense(fd); close(); }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount</label>
              <input name="amount" type="number" min="0" step="0.01" className="input" required />
            </div>
            <div>
              <label className="label">Date</label>
              <input name="date" type="date" className="input" defaultValue={today} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select name="category" className="input">
                <option>Repairs</option><option>Utilities</option><option>Insurance</option>
                <option>Landscaping</option><option>Taxes</option><option>Management</option>
                <option>Mortgage</option><option>Supplies</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" className="input">
                <option value="PAID">Paid</option>
                <option value="OPEN">Open</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Property</label>
            <select name="propertyId" className="input">
              <option value="">— Portfolio-wide —</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Vendor</label>
            <input name="vendor" className="input" placeholder="Joe's Plumbing" />
          </div>
          <div>
            <label className="label">Memo</label>
            <input name="memo" className="input" placeholder="What was this for?" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={close} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save expense</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
