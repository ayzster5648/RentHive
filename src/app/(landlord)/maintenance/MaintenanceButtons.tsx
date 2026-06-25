"use client";

import { Modal } from "@/components/Modal";
import { createMaintenanceRequestLandlord, createServicePro, assignServicePro } from "../actions";

type Unit = { id: string; label: string; propertyName: string };
type Pro = { id: string; name: string };

const categories = ["General", "Plumbing", "Electrical", "Heating / Cooling", "Appliances", "Doors / Windows", "Pest Control", "Landscaping", "Cleaning"];

export function AddRequestButton({ units, pros }: { units: Unit[]; pros: Pro[] }) {
  return (
    <Modal trigger={{ label: "Add request", icon: true }} title="Record a maintenance request">
      {(close) => (
        <form action={async (fd) => { await createMaintenanceRequestLandlord(fd); close(); }} className="space-y-3">
          <div>
            <label className="label">Unit</label>
            <select name="unitId" className="input" required defaultValue={units[0]?.id}>
              {units.map((u) => <option key={u.id} value={u.id}>{u.propertyName} — {u.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Title</label>
            <input name="title" className="input" placeholder="Leaking faucet" required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea name="description" rows={2} className="input" placeholder="Details..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select name="category" className="input">{categories.map((c) => <option key={c}>{c}</option>)}</select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select name="priority" className="input" defaultValue="MEDIUM">
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Assign service pro (optional)</label>
            <select name="assigneeId" className="input">
              <option value="">— Unassigned —</option>
              {pros.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={close} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add request</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function AddServiceProButton() {
  return (
    <Modal trigger={{ label: "Add service pro", icon: true }} title="Add a service pro">
      {(close) => (
        <form action={async (fd) => { await createServicePro(fd); close(); }} className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input name="name" className="input" placeholder="Joe's Plumbing" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Company</label>
              <input name="company" className="input" />
            </div>
            <div>
              <label className="label">Category</label>
              <select name="category" className="input">{categories.map((c) => <option key={c}>{c}</option>)}</select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Phone</label>
              <input name="phone" className="input" />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" className="input" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={close} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add service pro</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function AssignProControl({ id, assigneeId, pros }: { id: string; assigneeId: string | null; pros: Pro[] }) {
  return (
    <form action={assignServicePro}>
      <input type="hidden" name="id" value={id} />
      <select name="assigneeId" defaultValue={assigneeId ?? ""} onChange={(e) => e.currentTarget.form?.requestSubmit()} className="input py-1 text-xs">
        <option value="">Unassigned</option>
        {pros.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </form>
  );
}
