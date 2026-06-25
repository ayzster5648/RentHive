"use client";

import { Modal } from "@/components/Modal";
import { createInspection, updateInspectionStatus } from "../actions";

export function AddInspectionButton({ properties }: { properties: { id: string; name: string }[] }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <Modal trigger={{ label: "Schedule inspection", icon: true }} title="Schedule an inspection">
      {(close) => (
        <form action={async (fd) => { await createInspection(fd); close(); }} className="space-y-3">
          <div>
            <label className="label">Property</label>
            <select name="propertyId" className="input" required defaultValue={properties[0]?.id}>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Unit (optional)</label>
              <input name="unitLabel" className="input" placeholder="Unit 1A" />
            </div>
            <div>
              <label className="label">Type</label>
              <select name="type" className="input" defaultValue="ROUTINE">
                <option value="MOVE_IN">Move-in</option>
                <option value="MOVE_OUT">Move-out</option>
                <option value="ROUTINE">Routine</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input name="scheduledFor" type="date" className="input" defaultValue={today} required />
            </div>
            <div>
              <label className="label">Inspector</label>
              <input name="inspector" className="input" placeholder="Name" />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea name="notes" rows={2} className="input" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={close} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Schedule</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function InspectionStatusControl({ id, status }: { id: string; status: string }) {
  return (
    <form action={updateInspectionStatus}>
      <input type="hidden" name="id" value={id} />
      <select name="status" defaultValue={status} onChange={(e) => e.currentTarget.form?.requestSubmit()} className="input py-1 text-xs">
        <option value="SCHEDULED">Scheduled</option>
        <option value="COMPLETED">Completed</option>
        <option value="CANCELED">Canceled</option>
      </select>
    </form>
  );
}
