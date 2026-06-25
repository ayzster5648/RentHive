"use client";

import { toggleTask } from "../actions";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

export function TaskItem({
  id,
  title,
  done,
  due,
}: {
  id: string;
  title: string;
  done: boolean;
  due?: string;
}) {
  return (
    <form action={toggleTask} className="flex items-center gap-3 py-2.5">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
          done ? "border-brand-600 bg-brand-600 text-white" : "border-gray-300 bg-white hover:border-brand-400"
        )}
        aria-label={done ? "Mark incomplete" : "Mark complete"}
      >
        {done && Icons.check({ className: "h-3.5 w-3.5" })}
      </button>
      <span className={cn("flex-1 text-sm", done ? "text-gray-400 line-through" : "text-gray-800")}>{title}</span>
      {due && <span className="text-xs text-gray-400">{due}</span>}
    </form>
  );
}
