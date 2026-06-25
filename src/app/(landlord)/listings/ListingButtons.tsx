"use client";

import { Modal } from "@/components/Modal";
import { createListing, addApplication, updateApplication } from "../actions";

type Unit = { id: string; label: string; propertyName: string; rent: number };
type Listing = { id: string; label: string };

export function AddListingButton({ units }: { units: Unit[] }) {
  if (units.length === 0) {
    return <span className="text-sm text-gray-400">Add a vacant unit to create a listing</span>;
  }
  return (
    <Modal trigger={{ label: "Add listing", icon: true }} title="List a unit">
      {(close) => (
        <form action={async (fd) => { await createListing(fd); close(); }} className="space-y-3">
          <div>
            <label className="label">Unit</label>
            <select name="unitId" className="input" required defaultValue={units[0]?.id}>
              {units.map((u) => <option key={u.id} value={u.id}>{u.propertyName} — {u.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Asking rent</label>
            <input name="rent" type="number" min="0" step="50" className="input" defaultValue={units[0]?.rent} required />
          </div>
          <div>
            <label className="label">Headline</label>
            <input name="headline" className="input" placeholder="Bright 2BR with in-unit laundry" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea name="description" rows={3} className="input" placeholder="Describe the unit..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={close} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Publish listing</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function AddApplicantButton({ listings, stage }: { listings: Listing[]; stage: string }) {
  const label = stage === "LEAD" ? "Add lead" : stage === "SCREENING" ? "Screen a tenant" : "Add applicant";
  return (
    <Modal trigger={{ label, icon: true }} title={label}>
      {(close) => (
        <form action={async (fd) => { await addApplication(fd); close(); }} className="space-y-3">
          <input type="hidden" name="stage" value={stage} />
          <div>
            <label className="label">Name</label>
            <input name="name" className="input" placeholder="Jane Applicant" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" className="input" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input name="phone" className="input" />
            </div>
          </div>
          {listings.length > 0 && (
            <div>
              <label className="label">For listing</label>
              <select name="listingId" className="input">
                <option value="">— None —</option>
                {listings.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={close} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{label}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function ApplicantStageControl({ id, stage, status }: { id: string; stage: string; status: string }) {
  return (
    <div className="flex gap-2">
      <form action={updateApplication}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="stage" value={stage} />
        <select name="status" defaultValue={status} onChange={(e) => e.currentTarget.form?.requestSubmit()} className="input py-1 text-xs">
          <option value="NEW">New</option>
          <option value="IN_REVIEW">In review</option>
          <option value="APPROVED">Approved</option>
          <option value="DECLINED">Declined</option>
        </select>
      </form>
      <form action={updateApplication}>
        <input type="hidden" name="id" value={id} />
        <select name="stage" defaultValue={stage} onChange={(e) => e.currentTarget.form?.requestSubmit()} className="input py-1 text-xs">
          <option value="LEAD">Lead</option>
          <option value="APPLICATION">Application</option>
          <option value="SCREENING">Screening</option>
        </select>
      </form>
    </div>
  );
}
