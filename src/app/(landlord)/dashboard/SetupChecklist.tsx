import Link from "next/link";
import type { SetupState } from "@/lib/setup";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

export function SetupChecklist({ setup, compact = false }: { setup: SetupState; compact?: boolean }) {
  const remaining = setup.steps.filter((s) => !s.done);

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Finish account setup</h2>
          <p className="text-sm text-gray-500">{setup.doneCount} of {setup.steps.length} steps complete</p>
        </div>
        <span className="text-2xl font-bold text-brand-600">{setup.percent}%</span>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${setup.percent}%` }} />
      </div>

      <ul className="space-y-2">
        {(compact ? remaining.slice(0, 3) : setup.steps).map((s) => (
          <li key={s.key} className={cn("flex items-center justify-between rounded-lg border p-3", s.done ? "border-gray-100 bg-gray-50" : "border-gray-200")}>
            <div className="flex items-center gap-3">
              <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", s.done ? "bg-brand-600 text-white" : "border-2 border-gray-300")}>
                {s.done && Icons.check({ className: "h-3.5 w-3.5" })}
              </span>
              <div>
                <p className={cn("text-sm font-medium", s.done ? "text-gray-400 line-through" : "text-gray-900")}>{s.title}</p>
                {!s.done && <p className="text-xs text-gray-400">{s.description}</p>}
              </div>
            </div>
            {!s.done && (
              <Link href={s.href} className="btn-primary px-3 py-1.5 text-xs">{s.cta}</Link>
            )}
          </li>
        ))}
      </ul>

      {compact && remaining.length > 3 && (
        <Link href="/dashboard?tab=setup" className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline">
          View all {remaining.length} remaining steps →
        </Link>
      )}
      {setup.percent === 100 && (
        <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">🎉 Your account is fully set up!</p>
      )}
    </div>
  );
}
