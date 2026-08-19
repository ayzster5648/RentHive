"use client";

import { Modal } from "@/components/Modal";
import { createInsurance } from "../../actions";

type Lease = { id: string; label: string };

export function AddInsuranceButton({ tenantId, leases }: { tenantId: string; leases: Lease[] }) {
  return (
    <Modal trigger={{ label: "Add insurance", icon: true }} title="Insurance">
      {(close) => (
        <form action={async (fd) => { await createInsurance(fd); close(); }} className="space-y-4">
          <input type="hidden" name="tenantId" value={tenantId} />
          <div>
            <label className="label">Lease</label>
            {leases.length > 0 ? (
              <select name="leaseId" className="input">
                <option value="">— None —</option>
                {leases.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            ) : (
              <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500">No moved-in lease.</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label className="label">Company name</label><input name="company" className="input" /></div>
            <div><label className="label">Company website</label><input name="website" className="input" placeholder="http://…" /></div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div><label className="label">Policy # <span className="text-red-500">*</span></label><input name="policyNumber" className="input" required /></div>
            <div><label className="label">Effective date <span className="text-red-500">*</span></label><input name="effectiveDate" type="date" className="input" required /></div>
            <div><label className="label">Expiration date <span className="text-red-500">*</span></label><input name="expirationDate" type="date" className="input" required /></div>
          </div>
          <div>
            <label className="label">Details</label>
            <textarea name="details" rows={3} maxLength={200} className="input" placeholder="Policy details…" />
          </div>
          <p className="text-xs text-gray-400">File upload needs the S3 storage integration; the policy record saves either way.</p>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={close} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
