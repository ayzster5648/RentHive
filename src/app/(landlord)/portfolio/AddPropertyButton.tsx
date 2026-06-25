"use client";

import { Modal } from "@/components/Modal";
import { createProperty } from "../actions";

export function AddPropertyButton() {
  return (
    <Modal trigger={{ label: "Add property", icon: true }} title="Add a property">
      {(close) => (
        <form
          action={async (fd) => {
            await createProperty(fd);
            close();
          }}
          className="space-y-3"
        >
          <div>
            <label className="label">Property name</label>
            <input name="name" className="input" placeholder="Maple Court Apartments" required />
          </div>
          <div>
            <label className="label">Street address</label>
            <input name="address" className="input" placeholder="120 Maple Street" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">City</label>
              <input name="city" className="input" required />
            </div>
            <div>
              <label className="label">State</label>
              <input name="state" className="input" placeholder="CA" maxLength={2} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">ZIP</label>
              <input name="zip" className="input" required />
            </div>
            <div>
              <label className="label">Type</label>
              <select name="type" className="input">
                <option>Apartment</option>
                <option>House</option>
                <option>Townhouse</option>
                <option>Condo</option>
                <option>Duplex</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={close} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add property</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
