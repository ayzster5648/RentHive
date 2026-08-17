"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPropertyFull } from "../../actions";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

const FEATURES = [
  "Alarm", "Furnished", "Renovated", "Hardwood floors", "Fireplace", "Fresh paint", "Dishwasher",
  "Walk-in closets", "Balcony, Deck, Patio", "Internet", "Fenced yard", "Tile", "Carpet", "Storage", "Unfurnished",
];
const AMENITIES = [
  "Basketball court", "BBQ", "Business center", "Clubhouse", "Dog park", "Elevator", "Fire pits", "Fitness center",
  "Game room", "Hot tub", "Near park", "On-site laundry", "Pet washing station", "Playground", "Pool",
  "Tennis court", "Theater room", "Volleyball court",
];
const PARKING = ["None", "Street", "Driveway", "Garage", "Covered", "Off-street"];
const LAUNDRY = ["None", "In-unit", "Shared", "Hookups"];
const AC = ["None", "Central", "Window unit", "Split system"];
const PROPERTY_KINDS = ["House", "Apartment", "Townhouse", "Condo", "Duplex", "Mobile home", "Commercial"];

function Chip({ name, value }: { name: string; value: string }) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" name={name} value={value} className="peer sr-only" />
      <span className="inline-block rounded-full border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:text-brand-700 hover:border-brand-400">
        {value}
      </span>
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 px-6 py-6 last:border-0">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
      {children}
    </div>
  );
}

export function PropertyForm() {
  const [unitType, setUnitType] = useState<"SINGLE" | "MULTI">("SINGLE");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  return (
    <form
      action={async (fd) => { setPending(true); try { await createPropertyFull(fd); } finally { setPending(false); } }}
      className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]"
    >
      {/* Left: photo */}
      <div className="space-y-4">
        <div className="card overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">Property photo</div>
          <div className="flex h-52 flex-col items-center justify-center gap-2 bg-gray-50 text-gray-400">
            {Icons.building({ className: "h-12 w-12" })}
            <span className="text-xs">Paste an image URL below</span>
          </div>
          <div className="p-3">
            <input name="imageUrl" className="input text-sm" placeholder="https://…/photo.jpg (optional)" />
          </div>
        </div>
      </div>

      {/* Right: form sections */}
      <div className="card">
        <Section title="General information">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Property name *</label>
              <input name="name" className="input" required />
            </div>
            <div>
              <label className="label">Year built</label>
              <input name="yearBuilt" type="number" min="1800" max="2100" className="input" />
            </div>
            <div>
              <label className="label">MLS #</label>
              <input name="mls" className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Street address *</label>
              <input name="address" className="input" placeholder="123 Main St" required />
            </div>
            <div>
              <label className="label">City *</label>
              <input name="city" className="input" required />
            </div>
            <div>
              <label className="label">State/Region *</label>
              <input name="state" className="input" required />
            </div>
            <div>
              <label className="label">Zip *</label>
              <input name="zip" className="input" required />
            </div>
            <div>
              <label className="label">Country *</label>
              <input name="country" className="input" defaultValue="United States" required />
            </div>
            <div>
              <label className="label">Property kind</label>
              <select name="type" className="input" defaultValue="House">
                {PROPERTY_KINDS.map((k) => <option key={k}>{k}</option>)}
              </select>
            </div>
          </div>
        </Section>

        <Section title="Property type">
          <input type="hidden" name="unitType" value={unitType} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {([
              { v: "SINGLE", t: "Single unit type", d: "One rental at a single address — a house, single mobile home, or condo. No separate units." },
              { v: "MULTI", t: "Multi unit type", d: "Multiple rental units at one address — apartments, rooms, offices, garages, etc. Add units after creating." },
            ] as const).map((o) => (
              <button
                type="button"
                key={o.v}
                onClick={() => setUnitType(o.v)}
                className={cn("rounded-xl border p-4 text-left transition-colors", unitType === o.v ? "border-brand-500 bg-brand-50/40" : "border-gray-200 hover:border-gray-300")}
              >
                <div className="flex items-center gap-2">
                  <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2", unitType === o.v ? "border-brand-500 bg-brand-500 text-white" : "border-gray-300")}>
                    {unitType === o.v && Icons.check({ className: "h-3 w-3" })}
                  </span>
                  <span className="font-medium text-gray-900">{o.t}</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">{o.d}</p>
              </button>
            ))}
          </div>
        </Section>

        {unitType === "SINGLE" && (
          <Section title="Unit details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Beds</label>
                <select name="beds" className="input" defaultValue="1">
                  {[0, 1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Baths</label>
                <select name="baths" className="input" defaultValue="1">
                  {[1, 1.5, 2, 2.5, 3, 3.5, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Size (sq ft)</label>
                <input name="sqft" type="number" min="0" className="input" placeholder="0" />
              </div>
              <div>
                <label className="label">Market rent</label>
                <input name="marketRent" type="number" min="0" step="50" className="input" placeholder="0.00" />
              </div>
              <div>
                <label className="label">Deposit</label>
                <input name="deposit" type="number" min="0" step="50" className="input" placeholder="0.00" />
              </div>
            </div>
          </Section>
        )}

        <Section title="Insurance information">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Is this property a manufactured/mobile home?</p>
              <div className="flex gap-6 text-sm">
                <label className="flex items-center gap-2"><input type="radio" name="isMobileHome" value="no" defaultChecked className="accent-brand-600" /> No</label>
                <label className="flex items-center gap-2"><input type="radio" name="isMobileHome" value="yes" className="accent-brand-600" /> Yes</label>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Would this property qualify as Affordable Housing?</p>
              <div className="flex gap-6 text-sm">
                <label className="flex items-center gap-2"><input type="radio" name="isAffordableHousing" value="no" defaultChecked className="accent-brand-600" /> No</label>
                <label className="flex items-center gap-2"><input type="radio" name="isAffordableHousing" value="yes" className="accent-brand-600" /> Yes</label>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Basic amenities">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Parking</label>
              <select name="parking" className="input" defaultValue=""><option value="">Select…</option>{PARKING.map((o) => <option key={o}>{o}</option>)}</select>
            </div>
            <div>
              <label className="label">Laundry</label>
              <select name="laundry" className="input" defaultValue=""><option value="">Select…</option>{LAUNDRY.map((o) => <option key={o}>{o}</option>)}</select>
            </div>
            <div>
              <label className="label">Air conditioning</label>
              <select name="airConditioning" className="input" defaultValue=""><option value="">Select…</option>{AC.map((o) => <option key={o}>{o}</option>)}</select>
            </div>
          </div>
        </Section>

        <Section title="Property features">
          <div className="flex flex-wrap gap-2">
            {FEATURES.map((f) => <Chip key={f} name="features" value={f} />)}
          </div>
        </Section>

        <Section title="Property amenities">
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => <Chip key={a} name="amenities" value={a} />)}
          </div>
        </Section>

        <div className="flex items-center justify-end gap-3 px-6 py-5">
          <button type="button" onClick={() => router.push("/portfolio")} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Creating…" : "Create"}</button>
        </div>
      </div>
    </form>
  );
}
