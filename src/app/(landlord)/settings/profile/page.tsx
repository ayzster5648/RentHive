import { requireRole } from "@/lib/auth";
import { SettingsNav } from "../SettingsNav";
import { ProfileForm } from "./ProfileForm";

export default async function ProfileSettingsPage() {
  const user = await requireRole("LANDLORD");
  const [firstName, ...rest] = user.name.split(" ");
  const lastName = rest.join(" ");

  return (
    <div className="max-w-4xl">
      <SettingsNav active="profile" />
      <div className="mt-6">
        <ProfileForm
          firstName={firstName ?? ""}
          lastName={lastName}
          email={user.email}
          phone={user.phone ?? ""}
          company={user.company ?? ""}
          displayAsCompany={user.displayAsCompany}
          imageUrl={user.imageUrl ?? ""}
          address={{ line: user.addressLine ?? "", unit: user.addressUnit ?? "", city: user.city ?? "", zip: user.zip ?? "", state: user.state ?? "" }}
          extra={{ timeZone: user.timeZone ?? "", dateFormat: user.dateFormat ?? "", timeFormat: user.timeFormat ?? "", measurement: user.measurement ?? "" }}
        />
      </div>
    </div>
  );
}
