import { Icons } from "./icons";
import { initials } from "@/lib/utils";

export function TopBar({ userName }: { userName: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4 text-gray-500">
        <button className="relative" aria-label="Notifications">
          {Icons.bell({ className: "h-5 w-5" })}
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">1</span>
        </button>
        <div className="hidden items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-400 md:flex">
          {Icons.search({ className: "h-4 w-4" })}
          <span>Search…</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-gray-400">
        <button aria-label="Messages">{Icons.chat({ className: "h-5 w-5" })}</button>
        <button aria-label="Help">{Icons.help({ className: "h-5 w-5" })}</button>
        <div className="flex items-center gap-2 rounded-full border border-gray-200 py-1 pl-3 pr-1">
          <span className="hidden text-sm font-medium text-gray-700 sm:block">{userName.split(" ")[0]}</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-400 text-xs font-semibold text-white">
            {initials(userName)}
          </span>
        </div>
      </div>
    </header>
  );
}
