"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { cn, initials } from "@/lib/utils";

const CATEGORIES: Record<string, string[]> = {
  Plumbing: ["General", "Leak repair", "Water heater", "Drain cleaning"],
  Electrical: ["General", "Wiring", "Lighting", "Panel"],
  "Heating / Cooling": ["Heating", "Cooling", "Ventilation"],
  Cleaning: ["House Cleaning", "Carpet", "Move-out", "Window"],
  Landscaping: ["Lawn care", "Snow removal", "Tree service"],
  Handyman: ["General repairs", "Assembly"],
  Painting: ["Interior", "Exterior"],
  "Pest Control": ["General", "Rodents", "Insects"],
  "Landlord services": ["Eviction", "Lease review", "Legal"],
  "Property Management Services": ["Full service", "Leasing"],
  General: ["General"],
};

type Pro = {
  id: string; firstName: string; lastName: string; middleName: string;
  company: string; displayAsCompany: boolean; website: string;
  category: string; subcategory: string; email: string; additionalEmail: string;
  phone: string; additionalPhone: string; fax: string;
  address: string; city: string; state: string; zip: string; country: string;
};

export function ServiceProForm({
  action, pro,
}: {
  action: (fd: FormData) => Promise<void>;
  pro?: Pro;
}) {
  const [category, setCategory] = useState(pro?.category || "");
  const [displayCo, setDisplayCo] = useState(pro?.displayAsCompany ?? false);
  const [showEmail2, setShowEmail2] = useState(!!pro?.additionalEmail);
  const [showPhone2, setShowPhone2] = useState(!!pro?.additionalPhone);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const subs = CATEGORIES[category] ?? [];

  const fullName = [pro?.firstName, pro?.lastName].filter(Boolean).join(" ");

  return (
    <form
      action={async (fd) => { setPending(true); try { await action(fd); } finally { setPending(false); } }}
      className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]"
    >
      {pro && <input type="hidden" name="id" value={pro.id} />}

      {/* Photo */}
      <div className="card overflow-hidden self-start">
        <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">Profile photo</div>
        <div className="flex h-52 flex-col items-center justify-center gap-2 bg-gray-100 text-gray-400">
          {pro ? <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700">{initials(fullName || "SP")}</span> : Icons.renters({ className: "h-12 w-12" })}
          <span className="flex items-center gap-1 text-xs">{Icons.downloads({ className: "h-4 w-4" })} Upload photo</span>
        </div>
      </div>

      {/* Form */}
      <div className="card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">General information</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div><label className="label">First name <span className="text-red-500">*</span></label><input name="firstName" className="input" defaultValue={pro?.firstName} placeholder="Type name here" required /></div>
          <div><label className="label">Last name</label><input name="lastName" className="input" defaultValue={pro?.lastName} placeholder="Type name here" /></div>
          <div><label className="label">Middle name</label><input name="middleName" className="input" defaultValue={pro?.middleName} placeholder="Type name here" /></div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-gray-700">
            <input type="checkbox" name="displayAsCompany" checked={displayCo} onChange={(e) => setDisplayCo(e.target.checked)} className="h-4 w-4 accent-brand-600" />
            Display as a company?
          </label>
          <div><label className="label">Company name</label><input name="company" className="input" defaultValue={pro?.company} placeholder="Type name here" /></div>
          <div><label className="label">Company website</label><input name="website" className="input" defaultValue={pro?.website} placeholder="http://www.site.com" /></div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div><label className="label">Email</label><input name="email" type="email" className="input" defaultValue={pro?.email} placeholder="Add email here" /></div>
          <div><label className="label">Phone</label><input name="phone" className="input" defaultValue={pro?.phone} placeholder="Add phone number" /></div>
          <div><label className="label">Fax</label><input name="fax" className="input" defaultValue={pro?.fax} placeholder="Type the fax" /></div>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            {showEmail2 ? <input name="additionalEmail" className="input" defaultValue={pro?.additionalEmail} placeholder="Additional email" /> :
              <button type="button" onClick={() => setShowEmail2(true)} className="flex items-center gap-1 text-sm font-medium text-brand-600">{Icons.plus({ className: "h-4 w-4" })} Add another email</button>}
          </div>
          <div>
            {showPhone2 ? <input name="additionalPhone" className="input" defaultValue={pro?.additionalPhone} placeholder="Additional phone" /> :
              <button type="button" onClick={() => setShowPhone2(true)} className="flex items-center gap-1 text-sm font-medium text-brand-600">{Icons.plus({ className: "h-4 w-4" })} Add another phone</button>}
          </div>
        </div>

        <h2 className="mb-4 mt-8 text-sm font-semibold uppercase tracking-wide text-gray-500">Category</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Category <span className="text-red-500">*</span></label>
            <select name="category" className="input" value={category} onChange={(e) => setCategory(e.target.value)} required>
              <option value="">Select a category</option>
              {Object.keys(CATEGORIES).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Sub-category</label>
            <select name="subcategory" className="input" defaultValue={pro?.subcategory} disabled={!category}>
              <option value="">Select a sub-category</option>
              {subs.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <h2 className="mb-4 mt-8 text-sm font-semibold uppercase tracking-wide text-gray-500">Address</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className="label">Address</label><input name="address" className="input" defaultValue={pro?.address} placeholder="Street address" /></div>
          <div><label className="label">City</label><input name="city" className="input" defaultValue={pro?.city} placeholder="City" /></div>
          <div><label className="label">State / region</label><input name="state" className="input" defaultValue={pro?.state} placeholder="State" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Zip</label><input name="zip" className="input" defaultValue={pro?.zip} placeholder="Zip" /></div>
            <div><label className="label">Country</label><input name="country" className="input" defaultValue={pro?.country} placeholder="Country" /></div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
          <button type="button" onClick={() => router.push("/maintenance?tab=pros")} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Saving…" : pro ? "Save" : "Create"}</button>
        </div>
      </div>
    </form>
  );
}
