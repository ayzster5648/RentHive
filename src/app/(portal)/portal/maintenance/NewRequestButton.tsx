"use client";

import { Modal } from "@/components/Modal";
import { createMaintenanceRequest } from "../../actions";

export function NewRequestButton() {
  return (
    <Modal trigger={{ label: "New request", icon: true }} title="Submit a maintenance request">
      {(close) => (
        <form
          action={async (fd) => {
            await createMaintenanceRequest(fd);
            close();
          }}
          className="space-y-3"
        >
          <div>
            <label className="label">What needs fixing?</label>
            <input name="title" className="input" placeholder="Leaking kitchen faucet" required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea name="description" className="input" rows={3} placeholder="Describe the issue in detail..." required />
          </div>
          <div>
            <label className="label">Priority</label>
            <select name="priority" className="input" defaultValue="MEDIUM">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={close} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Submit request</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
