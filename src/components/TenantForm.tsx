"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { cn, initials } from "@/lib/utils";

type Tenant = {
  id: string; firstName: string; lastName: string; middleName: string; company: string;
  displayAsCompany: boolean; dob: string; email: string; additionalEmail: string;
  phone: string; additionalPhone: string; forwardingAddress: string; emergencyContact: string;
};

function Reveal({ label, children }: { label: string; children: (close: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return open ? <>{children(() => setOpen(false))}</> : (
    <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">{Icons.plus({ className: "h-4 w-4" })} {label}</button>
  );
}

export function TenantForm({ action, tenant }: { action: (fd: FormData) => Promise<void>; tenant?: Tenant }) {
  const [displayCo, setDisplayCo] = useState(tenant?.displayAsCompany ?? false);
  const [showEmail2, setShowEmail2] = useState(!!tenant?.additionalEmail);
  const [showPhone2, setShowPhone2] = useState(!!tenant?.additionalPhone);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const full = [tenant?.firstName, tenant?.lastName].filter(Boolean).join(" ");

  return (
    <form action={async (fd) => { setPending(true); try { await action(fd); } finally { setPending(false); } }} className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      {tenant && <input type="hidden" name="id" value={tenant.id} />}

      <div className="card overflow-hidden self-start">
        <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">Profile photo</div>
        <div className="flex h-56 flex-col items-center justify-center gap-2 bg-gray-100 text-gray-400">
          {tenant ? <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700">{initials(full || "T")}</span> : Icons.renters({ className: "h-12 w-12" })}
          <span className="flex items-center gap-1 text-xs">{Icons.downloads({ className: "h-4 w-4" })} Upload photo</span>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Personal information</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div><label className="label">First name <span className="text-red-500">*</span></label><input name="firstName" className="input" defaultValue={tenant?.firstName} placeholder="Type name here" required /></div>
          <div><label className="label">Last name <span className="text-red-500">*</span></label><input name="lastName" className="input" defaultValue={tenant?.lastName} placeholder="Type name here" /></div>
          <div><label className="label">Middle name</label><input name="middleName" className="input" defaultValue={tenant?.middleName} placeholder="Type name here" /></div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-gray-700"><input type="checkbox" name="displayAsCompany" checked={displayCo} onChange={(e) => setDisplayCo(e.target.checked)} className="h-4 w-4 accent-brand-600" /> Display as a company?</label>
          <div><label className="label">Company name</label><input name="company" className="input" defaultValue={tenant?.company} placeholder="Type name here" /></div>
          <div><label className="label">Date of birth</label><input name="dob" type="date" className="input" defaultValue={tenant?.dob} /></div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className="label">Email <span className="text-red-500">*</span></label><input name="email" type="email" className="input" defaultValue={tenant?.email} placeholder="Add email here" required /></div>
          <div><label className="label">Phone</label><input name="phone" className="input" defaultValue={tenant?.phone} placeholder="Add phone number" /></div>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>{showEmail2 ? <input name="additionalEmail" className="input" defaultValue={tenant?.additionalEmail} placeholder="Additional email" /> : <button type="button" onClick={() => setShowEmail2(true)} className="flex items-center gap-1 text-sm font-medium text-brand-600">{Icons.plus({ className: "h-4 w-4" })} Add another email</button>}</div>
          <div>{showPhone2 ? <input name="additionalPhone" className="input" defaultValue={tenant?.additionalPhone} placeholder="Additional phone" /> : <button type="button" onClick={() => setShowPhone2(true)} className="flex items-center gap-1 text-sm font-medium text-brand-600">{Icons.plus({ className: "h-4 w-4" })} Add another phone</button>}</div>
        </div>

        <h2 className="mb-3 mt-8 text-lg font-semibold text-gray-900">Forwarding address</h2>
        <Reveal label="Add address">{() => <input name="forwardingAddress" className="input" defaultValue={tenant?.forwardingAddress} placeholder="Street, city, state, zip" />}</Reveal>

        <h2 className="mb-3 mt-8 text-lg font-semibold text-gray-900">Emergency contacts</h2>
        <Reveal label="Add emergency contact">{() => <input name="emergencyContact" className="input" defaultValue={tenant?.emergencyContact} placeholder="Name — phone" />}</Reveal>

        <h2 className="mb-3 mt-8 text-lg font-semibold text-gray-900">Pets</h2>
        <span className="text-sm text-gray-400">Add a pet (coming soon)</span>
        <h2 className="mb-3 mt-8 text-lg font-semibold text-gray-900">Vehicles</h2>
        <span className="text-sm text-gray-400">Add a vehicle (coming soon)</span>

        <div className="mt-8 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 py-8 text-gray-400"><Icons.downloads className="h-6 w-6" /><span className="text-sm font-medium text-brand-600">Upload</span><span className="text-xs">Store documents and templates</span></div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
          <button type="button" onClick={() => router.push("/renters?tab=renters")} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Saving…" : tenant ? "Save" : "Create"}</button>
        </div>
      </div>
    </form>
  );
}
