"use client";

import { useState } from "react";
import { useActionState } from "react";
import { updateProfile } from "../actions";
import { initials } from "@/lib/utils";

type Props = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  displayAsCompany: boolean;
};

export function ProfileForm({ firstName, lastName, email, phone, company, displayAsCompany }: Props) {
  const [state, formAction, pending] = useActionState(updateProfile, null);
  const [emailEditing, setEmailEditing] = useState(false);
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return (
    <form action={formAction} className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">First name</label>
              <input name="firstName" className="input" defaultValue={firstName} required />
            </div>
            <div>
              <label className="label">Last name</label>
              <input name="lastName" className="input" defaultValue={lastName} />
            </div>
          </div>
          <div>
            <label className="label">Company</label>
            <input name="company" className="input" defaultValue={company} placeholder="Optional" />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" name="displayAsCompany" defaultChecked={displayAsCompany} className="h-4 w-4 accent-brand-600" />
            Display as a company?
          </label>
          <div>
            <label className="label">Phone number</label>
            <input name="phone" className="input" defaultValue={phone} />
          </div>
        </div>

        {/* Avatar */}
        <div className="flex shrink-0 flex-col items-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-brand-100 text-2xl font-semibold text-brand-700">
            {initials(fullName || "U")}
          </div>
          <p className="mt-2 text-xs text-gray-400">Profile image</p>
        </div>
      </div>

      {/* Email section */}
      <div className="border-t border-gray-100 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Email address</h3>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Verified</span>
          </div>
          {!emailEditing && (
            <button type="button" onClick={() => setEmailEditing(true)} className="text-sm font-medium text-brand-600 hover:underline">Change</button>
          )}
        </div>
        {emailEditing ? (
          <input name="email" type="email" className="input mt-2" defaultValue={email} required />
        ) : (
          <>
            <p className="mt-1 text-sm text-gray-700">{email}</p>
            <input type="hidden" name="email" value={email} />
          </>
        )}
      </div>

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state && "ok" in state && state.ok && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Profile updated.</p>}

      <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Update"}</button>
    </form>
  );
}
