"use client";

import { Modal } from "@/components/Modal";
import { createDocument } from "../actions";

export function AddDocumentButton({ properties }: { properties: { id: string; name: string }[] }) {
  return (
    <Modal trigger={{ label: "Upload file", icon: true }} title="Add a document">
      {(close) => (
        <form action={async (fd) => { await createDocument(fd); close(); }} className="space-y-3">
          <div>
            <label className="label">File name</label>
            <input name="name" className="input" placeholder="Lease Agreement — Unit 1A.pdf" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select name="category" className="input">
                <option>Lease</option><option>Insurance</option><option>Inspection</option>
                <option>Tax</option><option>Receipt</option><option>Template</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="label">Property</label>
              <select name="propertyId" className="input">
                <option value="">— None —</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-400">Demo records file metadata. Wire up object storage to upload real files.</p>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={close} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add document</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
