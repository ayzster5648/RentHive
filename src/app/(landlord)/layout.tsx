import { requireRole } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export default async function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("LANDLORD");
  return (
    <div className="flex min-h-screen">
      <Sidebar role="LANDLORD" userName={user.name} />
      <div className="flex flex-1 flex-col overflow-x-hidden">
        <TopBar userName={user.name} />
        <main className="flex-1 px-8 py-7">{children}</main>
      </div>
    </div>
  );
}
