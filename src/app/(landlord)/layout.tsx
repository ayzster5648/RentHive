import { requireRole } from "@/lib/auth";
import { getLandlordNotifications } from "@/lib/notifications";
import { getSetupState } from "@/lib/setup";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export default async function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("LANDLORD");
  const [notifications, setup] = await Promise.all([
    getLandlordNotifications(user.id),
    getSetupState(user.id),
  ]);

  // Show the company name in the chrome when "display as company" is on.
  const displayName = user.displayAsCompany && user.company ? user.company : user.name;

  return (
    <div className="flex min-h-screen">
      <Sidebar role="LANDLORD" userName={displayName} setupPercent={setup.percent} />
      <div className="flex flex-1 flex-col overflow-x-hidden">
        <TopBar userName={displayName} userEmail={user.email} notifications={notifications} />
        <main className="flex-1 px-8 py-7">{children}</main>
      </div>
    </div>
  );
}
