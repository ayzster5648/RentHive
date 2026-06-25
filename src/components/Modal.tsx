"use client";

import { useState } from "react";
import { Icons } from "./icons";

/** Lightweight modal triggered by a button. Closes on backdrop click. */
export function Modal({
  trigger,
  title,
  children,
}: {
  trigger: { label: string; className?: string; icon?: boolean };
  title: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={trigger.className ?? "btn-primary"}
      >
        {trigger.icon && Icons.plus({ className: "h-4 w-4" })}
        {trigger.label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="font-semibold text-gray-900">{title}</h2>
              <button onClick={close} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5">{children(close)}</div>
          </div>
        </div>
      )}
    </>
  );
}
