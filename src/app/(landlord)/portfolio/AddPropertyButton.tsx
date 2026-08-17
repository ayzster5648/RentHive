import Link from "next/link";
import { Icons } from "@/components/icons";

export function AddPropertyButton() {
  return (
    <Link href="/portfolio/new" className="btn-primary">
      {Icons.plus({ className: "h-4 w-4" })}
      Add property
    </Link>
  );
}
