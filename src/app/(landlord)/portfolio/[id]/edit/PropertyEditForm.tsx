"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProperty } from "../../../actions";
import { PhotoUpload } from "@/components/PhotoUpload";

const AMENITIES = [
  "Basketball court", "BBQ", "Business center", "Clubhouse", "Dog park", "Elevator", "Fire pits", "Fitness center",
  "Game room", "Hot tub", "Near park", "On-site laundry", "Pet washing station", "Playground", "Pool",
  "Tennis court", "Theater room", "Volleyball court",
];
const COUNTRIES = ["United States", "Canada", "United Kingdom", "Australia"];
const STATUSES = ["", "Active", "Under renovation", "For sale", "Off market"];

type Props = {
  id: string; name: string; yearBuilt: string; mls: string; address: string;
  city: string; state: string; zip: string; country: string; status: string;
  amenities: string[]; imageUrl: string;
};

function Chip({ value, checked }: { value: string; checked: boolean }) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" name="amenities" value={value} defaultChecked={checked} className="peer sr-only" />
      <span className="inline-block rounded-full border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:text-brand-700 hover:border-brand-400">{value}</span>
    </label>
  );
}

export function PropertyEditForm(p: Props) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  return (
    <form
      action={async (fd) => { setPending(true); try { await updateProperty(fd); } finally { setPending(false); } }}
      className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]"
    >
      <input type="hidden" name="id" value={p.id} />

      {/* Left: photo */}
      <div className="space-y-4">
        <div className="card overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">Property Photo</div>
          <div className="p-3"><PhotoUpload name="imageUrl" defaultValue={p.imageUrl} /></div>
        </div>
      </div>

      {/* Right: fields */}
      <div className="card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">General information</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2"><label className="label">Property name <span className="text-red-500">*</span></label><input name="name" className="input" defaultValue={p.name} required /></div>
          <div><label className="label">Year built</label><input name="yearBuilt" type="number" min="1800" max="2100" className="input" defaultValue={p.yearBuilt} /></div>
          <div className="sm:col-span-2"><label className="label">Street address <span className="text-red-500">*</span></label><input name="address" className="input" defaultValue={p.address} required /></div>
          <div><label className="label">MLS #</label><input name="mls" className="input" defaultValue={p.mls} /></div>
          <div><label className="label">City <span className="text-red-500">*</span></label><input name="city" className="input" defaultValue={p.city} required /></div>
          <div><label className="label">State / Region <span className="text-red-500">*</span></label><input name="state" className="input" defaultValue={p.state} required /></div>
          <div><label className="label">Zip <span className="text-red-500">*</span></label><input name="zip" className="input" defaultValue={p.zip} required /></div>
          <div><label className="label">Country <span className="text-red-500">*</span></label>
            <select name="country" className="input" defaultValue={p.country || "United States"}>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <div className="sm:col-span-2"><label className="label">Property status</label>
            <select name="status" className="input" defaultValue={p.status}>{STATUSES.map((s) => <option key={s} value={s}>{s || "Select…"}</option>)}</select>
          </div>
        </div>

        <h2 className="mb-4 mt-8 text-sm font-semibold uppercase tracking-wide text-gray-500">Property amenities</h2>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => <Chip key={a} value={a} checked={p.amenities.includes(a)} />)}
        </div>

        <h2 className="mb-4 mt-8 text-sm font-semibold uppercase tracking-wide text-gray-500">Property attachments</h2>
        <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 py-8 text-center text-sm text-gray-400">
          <span className="text-brand-600">⬆ Upload</span>
          <span>Document storage needs the file-storage integration.</span>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
          <button type="button" onClick={() => router.push(`/portfolio/${p.id}`)} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Update"}</button>
        </div>
      </div>
    </form>
  );
}
