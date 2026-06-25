"use client";

import { Modal } from "@/components/Modal";
import { createTask, createReminder } from "../actions";

export function AddTaskButton() {
  return (
    <Modal trigger={{ label: "Add task", icon: true, className: "btn-secondary" }} title="Add a task">
      {(close) => (
        <form action={async (fd) => { await createTask(fd); close(); }} className="space-y-3">
          <div>
            <label className="label">Task</label>
            <input name="title" className="input" placeholder="Follow up with applicant" required />
          </div>
          <div>
            <label className="label">Due date (optional)</label>
            <input name="dueDate" type="date" className="input" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={close} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add task</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function AddReminderButton() {
  return (
    <Modal trigger={{ label: "Add reminder", icon: true }} title="Add a reminder">
      {(close) => (
        <form action={async (fd) => { await createReminder(fd); close(); }} className="space-y-3">
          <div>
            <label className="label">Reminder</label>
            <input name="title" className="input" placeholder="Lease renewal — Unit 1A" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input name="date" type="date" className="input" required />
            </div>
            <div>
              <label className="label">Type</label>
              <select name="type" className="input" defaultValue="CUSTOM">
                <option value="CUSTOM">Custom</option>
                <option value="LEASE">Lease</option>
                <option value="RENT">Rent</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="INSPECTION">Inspection</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={close} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add reminder</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
