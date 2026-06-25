import { redirect } from "next/navigation";

// The account area now lives under /settings.
export default function AccountRedirect() {
  redirect("/settings");
}
