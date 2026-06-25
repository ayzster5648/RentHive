"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { addTenant } from "../actions";

type VacantUnit = {
  id: string;
  label: string;
  propertyName: string;
  rent: number;
};

export function AddTenantButton({ vacantUnits }: { vacantUnits: VacantUnit[] }) {
  const [rent, setRent] = useState<number>(vacantUnits[0]?.rent ?? 0);

  const today = new Date().toISOString().slice(0, 10);
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const oneYear = nextYear.toISOString().slice(0, 10);

  if (vacantUnits.length === 0) {
    return (
      <span className="text-sm text-gray-400">
        Add a vacant unit first to onboard a tenant
      </span>
    );
  }

  return (
    <Modal trigger={{ label: "Add tenant", icon: true }} title="Add a tenant">
      {(close) => (
        <form
          action={async (fd) => {
            await addTenant(fd);
            close();
          }}
          className="max-h-[70vh] space-y-3 overflow-y-auto pr-1"
        >
          <div>
            <label className="label">Full name</label>
            <input name="name" className="input" placeholder="Jane Doe" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" className="input" placeholder="jane@email.com" required />
            </div>
            <div>
              <label className="label">Phone</label>
              <input name="phone" className="input" placeholder="(555) 123-4567" />
            </div>
          </div>
          <div>
            <label className="label">Emergency contact</label>
            <input name="emergencyContact" className="input" placeholder="John Doe — (555) 987-6543" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea name="notes" rows={2} className="input" placeholder="Pets, vehicle, anything to remember..." />
          </div>

          <hr className="border-gray-100" />

          <div>
            <label className="label">Assign to unit</label>
            <select
              name="unitId"
              className="input"
              required
              onChange={(e) => {
                const u = vacantUnits.find((v) => v.id === e.target.value);
                if (u) setRent(u.rent);
              }}
              defaultValue={vacantUnits[0]?.id}
            >
              {vacantUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.propertyName} — {u.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Rent / mo</label>
              <input name="rentAmount" type="number" min="0" step="50" className="input" value={rent} onChange={(e) => setRent(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Deposit</label>
              <input name="depositAmount" type="number" min="0" step="50" className="input" defaultValue={rent} />
            </div>
            <div>
              <label className="label">Rent due day</label>
              <input name="rentDueDay" type="number" min="1" max="28" className="input" defaultValue={1} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Lease start</label>
              <input name="startDate" type="date" className="input" defaultValue={today} required />
            </div>
            <div>
              <label className="label">Lease end</label>
              <input name="endDate" type="date" className="input" defaultValue={oneYear} required />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={close} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add tenant</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
