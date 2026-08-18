"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createListingFull } from "../../actions";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

type Unit = { id: string; label: string; propertyName: string; rent: number };

const AMENITIES = ["Basketball court", "BBQ", "Business center", "Clubhouse", "Dog park", "Elevator", "Fire pits", "Fitness center", "Game room", "Hot tub", "Near park", "On-site laundry", "Pet washing station", "Playground", "Pool", "Tennis court", "Theater room", "Volleyball court"];
const FEATURES = ["Alarm", "Furnished", "Renovated", "Hardwood floors", "Fireplace", "Fresh paint", "Dishwasher", "Walk-in closets", "Balcony, Deck, Patio", "Internet", "Fenced yard", "Tile", "Carpet", "Storage", "Unfurnished"];
const PARKING = ["None", "Street", "Driveway", "Garage", "Covered", "Off-street"];
const LAUNDRY = ["None", "In-unit", "Shared", "Hookups"];
const AC = ["None", "Central", "Window unit", "Split system"];
const RIBBON_COLORS = ["#229176", "#c0392b", "#3b2f63", "#e08e0b", "#134a3f", "#d6558c", "#5a92c0"];

const STEPS = [
  { key: "property", label: "Property Information", subs: ["Property", "Amenities", "Media", "Description"] },
  { key: "leasing", label: "Leasing Details", subs: ["Lease Details", "Pets"] },
  { key: "application", label: "Application Settings", subs: [] },
  { key: "marketing", label: "Marketing", subs: ["Listing Contact", "Ribbon", "Syndication Options"] },
];

function Toggle({ name, defaultChecked, label }: { name: string; defaultChecked?: boolean; label: string }) {
  const [on, setOn] = useState(defaultChecked ?? false);
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <input type="checkbox" name={name} checked={on} onChange={(e) => setOn(e.target.checked)} className="sr-only" />
      <span className={cn("relative h-6 w-11 rounded-full transition-colors", on ? "bg-brand-600" : "bg-gray-300")}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", on ? "left-[22px]" : "left-0.5")} />
      </span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  );
}
function Chip({ name, value }: { name: string; value: string }) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" name={name} value={value} className="peer sr-only" />
      <span className="inline-block rounded-full border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:text-brand-700 hover:border-brand-400">{value}</span>
    </label>
  );
}
function H({ children }: { children: React.ReactNode }) { return <h2 className="text-xl font-bold text-gray-900">{children}</h2>; }
function Sub({ children }: { children: React.ReactNode }) { return <p className="mb-4 text-sm text-gray-500">{children}</p>; }

export function ListingWizard({ units, contact }: { units: Unit[]; contact: { name: string; phone: string; email: string } }) {
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [rent, setRent] = useState(units[0]?.rent ?? 0);
  const router = useRouter();
  const last = STEPS.length - 1;

  return (
    <form
      action={async (fd) => { setPending(true); try { await createListingFull(fd); } finally { setPending(false); } }}
      className="flex min-h-[80vh] flex-col"
    >
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="flex items-center gap-1 text-sm font-medium text-gray-600 disabled:opacity-40">
          {Icons.chevronLeft({ className: "h-4 w-4" })} Previous step
        </button>
        <div className="flex items-center gap-2">
          {step < last ? (
            <button type="button" onClick={() => setStep((s) => Math.min(last, s + 1))} className="btn-primary">Next</button>
          ) : (
            <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Submitting…" : "Submit listing"}</button>
          )}
          <button type="button" onClick={() => router.push("/listings")} className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-gray-500 hover:bg-gray-50">✕</button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Left rail */}
        <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-gray-50 p-6 md:block">
          <p className="mb-6 text-lg font-bold text-gray-900">Create a Listing</p>
          <ol className="space-y-5">
            {STEPS.map((s, i) => (
              <li key={s.key}>
                <button type="button" onClick={() => setStep(i)} className="flex items-center gap-2 text-left">
                  <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px]", i < step ? "border-brand-600 bg-brand-600 text-white" : i === step ? "border-brand-600 text-brand-600" : "border-gray-300 text-gray-300")}>
                    {i < step ? "✓" : ""}
                  </span>
                  <span className={cn("text-sm font-medium", i === step ? "text-brand-700" : i < step ? "text-gray-700" : "text-gray-400")}>{s.label}</span>
                </button>
                {i === step && s.subs.length > 0 && (
                  <ul className="ml-7 mt-2 space-y-1">
                    {s.subs.map((sub) => <li key={sub} className="text-sm text-brand-600">{sub}</li>)}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </aside>

        {/* Content — all steps mounted, hidden when inactive so values persist */}
        <div className="flex-1 space-y-10 p-6 lg:p-10">
          {/* Step 1: Property Information */}
          <div className={cn("space-y-10", step !== 0 && "hidden")}>
            <section>
              <H>Property</H>
              <Sub>Choose the property or unit you want to list.</Sub>
              <div className="max-w-md">
                <label className="label">Property / unit <span className="text-red-500">*</span></label>
                <select name="unitId" className="input" required defaultValue={units[0]?.id} onChange={(e) => { const u = units.find((x) => x.id === e.target.value); if (u) setRent(u.rent); }}>
                  {units.map((u) => <option key={u.id} value={u.id}>{u.propertyName} — {u.label}</option>)}
                </select>
              </div>
            </section>
            <section>
              <H>Amenities</H>
              <Sub>Choose the essential amenities available for this property.</Sub>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div><label className="label">Parking</label><select name="parking" className="input" defaultValue=""><option value="">Select parking type</option>{PARKING.map((o) => <option key={o}>{o}</option>)}</select></div>
                <div><label className="label">Laundry</label><select name="laundry" className="input" defaultValue=""><option value="">Select laundry type</option>{LAUNDRY.map((o) => <option key={o}>{o}</option>)}</select></div>
                <div><label className="label">Air conditioning</label><select name="airConditioning" className="input" defaultValue=""><option value="">Select AC type</option>{AC.map((o) => <option key={o}>{o}</option>)}</select></div>
              </div>
              <p className="mb-2 mt-6 text-sm font-medium text-gray-700">Property amenities</p>
              <div className="flex flex-wrap gap-2">{AMENITIES.map((a) => <Chip key={a} name="amenities" value={a} />)}</div>
              <p className="mb-2 mt-6 text-sm font-medium text-gray-700">Property features</p>
              <div className="flex flex-wrap gap-2">{FEATURES.map((f) => <Chip key={f} name="features" value={f} />)}</div>
            </section>
            <section>
              <H>Media</H>
              <Sub>Add a cover photo, gallery, and an optional video tour.</Sub>
              <div className="max-w-md space-y-4">
                <div><label className="label">Cover photo URL</label><input name="coverPhotoUrl" className="input" placeholder="https://…/photo.jpg" /></div>
                <div><label className="label">Video tour (YouTube URL)</label><input name="videoUrl" className="input" placeholder="https://www.youtube.com/…" /></div>
                <p className="text-xs text-gray-400">Real photo uploads need the S3 storage integration; paste URLs for now.</p>
              </div>
            </section>
            <section>
              <H>Description</H>
              <Sub>Highlight the key features and benefits so you attract the right renters.</Sub>
              <div className="max-w-2xl space-y-3">
                <div><label className="label">Headline</label><input name="headline" className="input" placeholder="Bright 2BR with in-unit laundry" /></div>
                <div><label className="label">Marketing description</label><textarea name="description" rows={5} maxLength={4000} className="input" placeholder="Add the marketing description here." /></div>
              </div>
            </section>
          </div>

          {/* Step 2: Leasing Details */}
          <div className={cn("space-y-10", step !== 1 && "hidden")}>
            <section>
              <H>Lease Details</H>
              <Sub>Provide the key lease terms and any details renters should know.</Sub>
              <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
                <div><label className="label">Monthly rent <span className="text-red-500">*</span></label><input name="rent" type="number" min="0" step="50" className="input" value={rent} onChange={(e) => setRent(Number(e.target.value))} required /></div>
                <div><label className="label">Security deposit</label><input name="securityDeposit" type="number" min="0" step="50" className="input" placeholder="0.00" /></div>
                <div><label className="label">Amount refundable</label><input name="amountRefundable" type="number" min="0" step="50" className="input" placeholder="0.00" /></div>
                <div><label className="label">Date available <span className="text-red-500">*</span></label><input name="dateAvailable" type="date" className="input" /></div>
                <div><label className="label">Min lease (months)</label><select name="minLease" className="input" defaultValue=""><option value="">Select</option>{[1,3,6,9,12,18,24].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
                <div><label className="label">Max lease (months)</label><select name="maxLease" className="input" defaultValue=""><option value="">Select</option>{[6,12,18,24,36].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
              </div>
              <div className="mt-4"><Toggle name="monthToMonth" label="Month-to-month" /></div>
              <div className="mt-4 max-w-2xl"><label className="label">Other leasing details</label><textarea name="leasingDetails" rows={3} maxLength={250} className="input" placeholder="Here you can add other leasing details if necessary." /></div>
            </section>
            <section>
              <H>Pets</H>
              <Sub>Indicate what pets are permitted and any rules for pet owners.</Sub>
              <Toggle name="petsAllowed" label="Pets allowed" />
              <div className="mt-4 max-w-2xl"><label className="label">Pet policy (optional)</label><textarea name="petsPolicy" rows={2} className="input" placeholder="Breed / weight limits, pet deposit, etc." /></div>
            </section>
          </div>

          {/* Step 3: Application Settings */}
          <div className={cn("space-y-8", step !== 2 && "hidden")}>
            <section>
              <H>Tenant Screening</H>
              <Sub>Choose the screening applicants will complete.</Sub>
              <div className="max-w-2xl space-y-2">
                {[
                  { v: "Basic check", d: "Credit report and eviction history." },
                  { v: "Full check", d: "Credit, background, eviction, and identity verification." },
                ].map((o, i) => (
                  <label key={o.v} className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50/40">
                    <input type="radio" name="screeningTier" value={o.v} defaultChecked={i === 1} className="mt-1 accent-brand-600" />
                    <div><p className="font-medium text-gray-900">{o.v}</p><p className="text-sm text-gray-500">{o.d}</p></div>
                  </label>
                ))}
              </div>
            </section>
            <section>
              <H>Income Verification</H>
              <Sub>Require applicants to verify income and employment.</Sub>
              <Toggle name="incomeVerification" defaultChecked label="Require income verification" />
            </section>
            <section>
              <H>Online Applications</H>
              <Sub>Accept applications online for this listing.</Sub>
              <Toggle name="onlineApplications" defaultChecked label="Accept applications online" />
            </section>
          </div>

          {/* Step 4: Marketing */}
          <div className={cn("space-y-10", step !== 3 && "hidden")}>
            <section>
              <H>Listing Contact</H>
              <Sub>Contact details shown publicly for potential tenants to reach you.</Sub>
              <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
                <div><label className="label">Contact <span className="text-red-500">*</span></label><input name="contactName" className="input" defaultValue={contact.name} /></div>
                <div><label className="label">Phone number</label><input name="contactPhone" className="input" defaultValue={contact.phone} /></div>
                <div><label className="label">Email <span className="text-red-500">*</span></label><input name="contactEmail" type="email" className="input" defaultValue={contact.email} /></div>
              </div>
              <div className="mt-4"><Toggle name="displayPhone" defaultChecked label="Display the phone number publicly" /></div>
            </section>
            <section>
              <H>Ribbon</H>
              <Sub>Add a ribbon to make your listing stand out.</Sub>
              <div className="max-w-2xl">
                <label className="label">Ribbon title</label>
                <select name="ribbonType" className="input" defaultValue="None">
                  <option value="None">None</option><option value="New">New</option><option value="Reduced price">Reduced price</option>
                  <option value="Move-in special">Move-in special</option><option value="Pet friendly">Pet friendly</option><option value="Available now">Available now</option>
                </select>
                <p className="mb-2 mt-4 text-sm font-medium text-gray-700">Ribbon color</p>
                <div className="flex gap-2">
                  {RIBBON_COLORS.map((c, i) => (
                    <label key={c} className="cursor-pointer">
                      <input type="radio" name="ribbonColor" value={c} defaultChecked={i === 0} className="peer sr-only" />
                      <span className="block h-8 w-8 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-gray-400" style={{ backgroundColor: c }} />
                    </label>
                  ))}
                </div>
              </div>
            </section>
            <section>
              <H>Syndication Options</H>
              <Sub>Select where your listing appears. Your listing website is always included.</Sub>
              <div className="max-w-2xl space-y-3">
                {[
                  { v: "Listing Website", d: "Your own RentHive listings page.", checked: true },
                  { v: "Free Syndication", d: "Partner rental sites, no extra cost.", checked: false },
                  { v: "Premium Syndication", d: "Expanded network of listing sites.", checked: false },
                ].map((o) => (
                  <label key={o.v} className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-4 has-[:checked]:border-brand-500">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" name="syndication" value={o.v} defaultChecked={o.checked} className="h-5 w-5 accent-brand-600" />
                      <div><p className="font-medium text-gray-900">{o.v}</p><p className="text-sm text-gray-500">{o.d}</p></div>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </form>
  );
}
