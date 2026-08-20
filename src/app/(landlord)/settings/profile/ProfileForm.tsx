"use client";

import { useState, useRef, useActionState } from "react";
import { initials } from "@/lib/utils";
import { updateProfile, updateAddress, updateAdditionalSettings, changePassword, deleteAccount } from "../actions";

type Props = {
  firstName: string; lastName: string; email: string; phone: string;
  company: string; displayAsCompany: boolean; imageUrl: string;
  address: { line: string; unit: string; city: string; zip: string; state: string };
  extra: { timeZone: string; dateFormat: string; timeFormat: string; measurement: string };
};

const TIMEZONES = [
  "-08:00 Pacific Time - Los Angeles, Seattle",
  "-07:00 Mountain Time - Denver, Phoenix",
  "-06:00 Central Time - Chicago, Dallas, Houston",
  "-05:00 Eastern Time - New York City, Miami",
  "-04:00 Eastern Time - New York City, Brooklyn, Queens, Philadelphia",
];

function RoundImageInput({ defaultValue, fallback }: { defaultValue: string; fallback: string }) {
  const [preview, setPreview] = useState(defaultValue);
  const ref = useRef<HTMLInputElement>(null);
  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 400, scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d")?.drawImage(img, 0, 0, w, h);
        setPreview(c.toDataURL("image/jpeg", 0.72));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }
  return (
    <div className="flex shrink-0 flex-col items-center">
      <input type="hidden" name="imageUrl" value={preview} />
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      <button type="button" onClick={() => ref.current?.click()} className="group relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-slate-500 text-white">
        {preview
          ? <img src={preview} alt="" className="h-full w-full object-cover" />
          : <span className="text-2xl font-semibold">{fallback}</span>}
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/30 text-xs opacity-0 group-hover:opacity-100">📷 Update image</span>
      </button>
      <p className="mt-2 text-xs text-gray-400">Update image</p>
    </div>
  );
}

export function ProfileForm(p: Props) {
  const [state, action, pending] = useActionState(updateProfile, null);
  const [emailEditing, setEmailEditing] = useState(false);
  const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ") || "U";

  return (
    <div className="space-y-8">
      {/* Profile details */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900">Profile details</h2>
        <p className="mb-5 text-sm text-gray-500">Your profile is visible to your connected users.</p>
        <form action={action} className="space-y-5">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><label className="label">First name</label><input name="firstName" className="input" defaultValue={p.firstName} required /></div>
                <div><label className="label">Last name</label><input name="lastName" className="input" defaultValue={p.lastName} /></div>
              </div>
              <div><label className="label">Company <span className="text-red-500">*</span></label><input name="company" className="input" defaultValue={p.company} /></div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input type="checkbox" name="displayAsCompany" defaultChecked={p.displayAsCompany} className="h-4 w-4 accent-brand-600" /> Display as a company?
              </label>
              <div><label className="label">Phone number</label><input name="phone" className="input" defaultValue={p.phone} /></div>
            </div>
            <RoundImageInput defaultValue={p.imageUrl} fallback={initials(fullName)} />
          </div>

          {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
          {state && "ok" in state && state.ok && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Saved.</p>}
          <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Update"}</button>

          {/* Email */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><h3 className="font-semibold text-gray-900">Email address</h3><span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Verified</span></div>
              {!emailEditing && <button type="button" onClick={() => setEmailEditing(true)} className="text-sm font-medium text-brand-600 hover:underline">Change</button>}
            </div>
            {emailEditing
              ? <input name="email" type="email" className="input mt-2" defaultValue={p.email} required />
              : <><p className="mt-1 text-sm text-gray-700">Your email is {p.email}</p><input type="hidden" name="email" value={p.email} /></>}
          </div>
        </form>

        {/* Password */}
        <PasswordSection />
      </section>

      {/* Address */}
      <AddressSection address={p.address} />

      {/* Additional settings */}
      <AdditionalSection extra={p.extra} />

      {/* Delete account */}
      <DeleteSection />
    </div>
  );
}

function PasswordSection() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(changePassword, null);
  return (
    <div className="mt-6 border-t border-gray-100 pt-5">
      <div className="flex items-center justify-between">
        <div><h3 className="font-semibold text-gray-900">Password</h3><p className="text-sm text-gray-500">Use a strong password you don&apos;t use anywhere else.</p></div>
        <button type="button" onClick={() => setOpen((o) => !o)} className="text-sm font-medium text-brand-600 hover:underline">Change</button>
      </div>
      {open && (
        <form action={action} className="mt-4 grid max-w-md gap-3">
          <input name="current" type="password" className="input" placeholder="Current password" required />
          <input name="next" type="password" className="input" placeholder="New password (min 8 chars)" required />
          <input name="confirm" type="password" className="input" placeholder="Confirm new password" required />
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          {state && "ok" in state && state.ok && <p className="text-sm text-green-600">Password changed.</p>}
          <div><button type="submit" className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Update password"}</button></div>
        </form>
      )}
    </div>
  );
}

function AddressSection({ address }: { address: Props["address"] }) {
  const [state, action, pending] = useActionState(updateAddress, null);
  return (
    <section className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900">Address</h3>
      <p className="mb-4 text-sm text-gray-500">Your mailing address.</p>
      <form action={action} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className="label">Address</label><input name="addressLine" className="input" defaultValue={address.line} /></div>
          <div><label className="label">Unit/Ap. #</label><input name="addressUnit" className="input" defaultValue={address.unit} /></div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div><label className="label">City</label><input name="city" className="input" defaultValue={address.city} /></div>
          <div><label className="label">ZIP / Postal code</label><input name="zip" className="input" defaultValue={address.zip} /></div>
          <div><label className="label">State / region</label><input name="state" className="input" defaultValue={address.state} /></div>
        </div>
        {state && "ok" in state && state.ok && <p className="text-sm text-green-600">Saved.</p>}
        <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Update"}</button>
      </form>
    </section>
  );
}

function AdditionalSection({ extra }: { extra: Props["extra"] }) {
  const [state, action, pending] = useActionState(updateAdditionalSettings, null);
  return (
    <section className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900">Additional settings</h3>
      <p className="mb-4 text-sm text-gray-500">Customize the additional settings of your account.</p>
      <form action={action} className="space-y-4">
        <div>
          <label className="label">Time Zone</label>
          <select name="timeZone" className="input" defaultValue={extra.timeZone || TIMEZONES[4]}>
            {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div><label className="label">Date format</label><select name="dateFormat" className="input" defaultValue={extra.dateFormat || "mm/dd/yyyy"}><option>mm/dd/yyyy</option><option>dd/mm/yyyy</option><option>yyyy-mm-dd</option></select></div>
          <div><label className="label">Time format</label><select name="timeFormat" className="input" defaultValue={extra.timeFormat || "24 hour"}><option>24 hour</option><option>12 hour</option></select></div>
          <div><label className="label">Measurement</label><select name="measurement" className="input" defaultValue={extra.measurement || "Imperial"}><option>Imperial</option><option>Metric</option></select></div>
        </div>
        {state && "ok" in state && state.ok && <p className="text-sm text-green-600">Saved.</p>}
        <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Update"}</button>
      </form>
    </section>
  );
}

function DeleteSection() {
  const [confirming, setConfirming] = useState(false);
  return (
    <section className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900">Delete account</h3>
      <p className="mb-4 text-sm text-gray-500">Please note that all of the information will be permanently deleted.</p>
      {!confirming ? (
        <button onClick={() => setConfirming(true)} className="btn-danger">Delete account</button>
      ) : (
        <form action={deleteAccount} className="max-w-md space-y-3">
          <p className="text-sm text-red-700">This permanently deletes your account and all data. Type <strong>DELETE</strong> to confirm.</p>
          <input name="confirm" className="input" placeholder="DELETE" autoComplete="off" />
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirming(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-danger">Permanently delete</button>
          </div>
        </form>
      )}
    </section>
  );
}
