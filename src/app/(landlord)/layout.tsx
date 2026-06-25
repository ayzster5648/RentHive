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

  return (
    <div className="flex min-h-screen">
      <Sidebar role="LANDLORD" userName={user.name} setupPercent={setup.percent} />
      <div className="flex flex-1 flex-col overflow-x-hidden">
        <TopBar userName={user.name} userEmail={user.email} notifications={notifications} />
        <main className="flex-1 px-8 py-7">{children}</main>
      </div>
    </div>
  );
}
