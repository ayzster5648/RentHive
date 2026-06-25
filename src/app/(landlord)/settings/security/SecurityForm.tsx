"use client";

import { useActionState } from "react";
import { changePassword } from "../actions";

export function SecurityForm() {
  const [state, formAction, pending] = useActionState(changePassword, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label">Current password</label>
        <input name="current" type="password" className="input" required />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">New password</label>
          <input name="next" type="password" className="input" minLength={8} required />
        </div>
        <div>
          <label className="label">Confirm new password</label>
          <input name="confirm" type="password" className="input" minLength={8} required />
        </div>
      </div>

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state && "ok" in state && state.ok && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Password changed.</p>}

      <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Change password"}</button>
    </form>
  );
}
