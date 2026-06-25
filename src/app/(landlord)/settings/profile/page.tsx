import { requireRole } from "@/lib/auth";
import { SettingsNav } from "../SettingsNav";
import { ProfileForm } from "./ProfileForm";

export default async function ProfileSettingsPage() {
  const user = await requireRole("LANDLORD");
  const [firstName, ...rest] = user.name.split(" ");
  const lastName = rest.join(" ");

  return (
    <div className="max-w-3xl">
      <SettingsNav active="profile" />
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900">Profile details</h2>
        <p className="mb-5 text-sm text-gray-500">Your profile is visible to your connected tenants.</p>
        <ProfileForm
          firstName={firstName ?? ""}
          lastName={lastName}
          email={user.email}
          phone={user.phone ?? ""}
          company={user.company ?? ""}
          displayAsCompany={user.displayAsCompany}
        />
      </div>
    </div>
  );
}
