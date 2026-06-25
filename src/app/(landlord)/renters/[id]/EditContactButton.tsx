"use client";

import { Modal } from "@/components/Modal";
import { updateTenant } from "../../actions";

type Tenant = {
  id: string;
  name: string;
  phone: string | null;
  emergencyContact: string | null;
  notes: string | null;
};

export function EditContactButton({ tenant }: { tenant: Tenant }) {
  return (
    <Modal
      trigger={{ label: "Edit contact", className: "btn-secondary px-3 py-1.5 text-sm" }}
      title="Edit tenant contact"
    >
      {(close) => (
        <form
          action={async (fd) => {
            await updateTenant(fd);
            close();
          }}
          className="space-y-3"
        >
          <input type="hidden" name="id" value={tenant.id} />
          <div>
            <label className="label">Full name</label>
            <input name="name" className="input" defaultValue={tenant.name} required />
          </div>
          <div>
            <label className="label">Phone</label>
            <input name="phone" className="input" defaultValue={tenant.phone ?? ""} placeholder="(555) 123-4567" />
          </div>
          <div>
            <label className="label">Emergency contact</label>
            <input name="emergencyContact" className="input" defaultValue={tenant.emergencyContact ?? ""} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea name="notes" rows={3} className="input" defaultValue={tenant.notes ?? ""} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={close} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
