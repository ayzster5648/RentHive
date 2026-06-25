"use client";

import { Modal } from "@/components/Modal";
import { addUnit } from "../../actions";

export function AddUnitButton({ propertyId }: { propertyId: string }) {
  return (
    <Modal
      trigger={{ label: "Add unit", icon: true, className: "btn-secondary" }}
      title="Add a unit"
    >
      {(close) => (
        <form
          action={async (fd) => {
            await addUnit(fd);
            close();
          }}
          className="space-y-3"
        >
          <input type="hidden" name="propertyId" value={propertyId} />
          <div>
            <label className="label">Unit label</label>
            <input name="label" className="input" placeholder="Unit 2B" required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Beds</label>
              <input name="beds" type="number" min="0" step="1" defaultValue={1} className="input" />
            </div>
            <div>
              <label className="label">Baths</label>
              <input name="baths" type="number" min="0" step="0.5" defaultValue={1} className="input" />
            </div>
            <div>
              <label className="label">Rent</label>
              <input name="rent" type="number" min="0" step="50" defaultValue={1500} className="input" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={close} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add unit</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
