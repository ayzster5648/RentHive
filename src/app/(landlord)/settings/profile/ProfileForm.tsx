"use client";

import { useActionState } from "react";
import { updateProfile } from "../actions";

type Props = { name: string; email: string; phone: string; company: string };

export function ProfileForm({ name, email, phone, company }: Props) {
  const [state, formAction, pending] = useActionState(updateProfile, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Full name</label>
          <input name="name" className="input" defaultValue={name} required />
        </div>
        <div>
          <label className="label">Company</label>
          <input name="company" className="input" defaultValue={company} placeholder="Optional" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" className="input" defaultValue={email} required />
        </div>
        <div>
          <label className="label">Phone number</label>
          <input name="phone" className="input" defaultValue={phone} />
        </div>
      </div>

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state && "ok" in state && state.ok && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Profile updated.</p>}

      <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Update profile"}</button>
    </form>
  );
}
