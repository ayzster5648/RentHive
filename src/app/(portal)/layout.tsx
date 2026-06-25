import { requireRole } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("TENANT");
  return (
    <div className="flex min-h-screen">
      <Sidebar role="TENANT" userName={user.name} />
      <main className="flex-1 overflow-x-hidden px-8 py-7">{children}</main>
    </div>
  );
}
