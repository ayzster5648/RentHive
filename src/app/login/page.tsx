"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { Icons } from "@/components/icons";

const demoAccounts = [
  { role: "Landlord", email: "landlord@renthive.com" },
  { role: "Tenant", email: "alex@example.com" },
];

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          {Icons.logo({ className: "h-12 w-12" })}
          <h1 className="mt-3 text-2xl font-bold text-gray-900">RentHive</h1>
          <p className="text-sm text-gray-500">Property management, simplified.</p>
        </div>

        <div className="card p-6">
          <form action={formAction} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="input" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" className="input" placeholder="••••••••" required />
            </div>
            {state?.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
            )}
            <button type="submit" className="btn-primary w-full" disabled={pending}>
              {pending ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <div className="mt-5 rounded-lg border border-dashed border-gray-300 bg-white/60 p-4 text-sm">
          <p className="mb-2 font-medium text-gray-700">Demo accounts</p>
          <ul className="space-y-1 text-gray-600">
            {demoAccounts.map((a) => (
              <li key={a.email} className="flex justify-between">
                <span className="text-gray-500">{a.role}</span>
                <code className="text-xs">{a.email}</code>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-gray-400">Password for all: <code>password123</code></p>
        </div>
      </div>
    </div>
  );
}
