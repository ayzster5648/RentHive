import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getSetupState } from "@/lib/setup";
import { formatDate } from "@/lib/utils";
import { PageHeader, StatCard } from "@/components/ui";
import { Avatar } from "@/components/ui";

export default async function AccountPage() {
  const user = await requireRole("LANDLORD");
  const [setup, propertyCount, unitCount, tenantCount] = await Promise.all([
    getSetupState(user.id),
    db.property.count({ where: { landlordId: user.id } }),
    db.unit.count({ where: { property: { landlordId: user.id } } }),
    db.lease.count({ where: { status: "ACTIVE", unit: { property: { landlordId: user.id } } } }),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader title="My account" subtitle="Your RentHive landlord profile." />

      <div className="card mb-6 flex items-center gap-4 p-6">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-semibold text-brand-700">
          {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
        </span>
        <div>
          <p className="text-xl font-bold text-gray-900">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <span className="mt-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">Landlord</span>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Setup" value={`${setup.percent}%`} accent={setup.percent === 100 ? "green" : "amber"} />
        <StatCard label="Properties" value={String(propertyCount)} />
        <StatCard label="Units" value={String(unitCount)} />
        <StatCard label="Active tenants" value={String(tenantCount)} />
      </div>

      <div className="card p-6">
        <h2 className="mb-4 font-semibold text-gray-900">Account details</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-gray-100 pb-2"><dt className="text-gray-500">Name</dt><dd className="font-medium text-gray-900">{user.name}</dd></div>
          <div className="flex justify-between border-b border-gray-100 pb-2"><dt className="text-gray-500">Email</dt><dd className="text-gray-900">{user.email}</dd></div>
          <div className="flex justify-between border-b border-gray-100 pb-2"><dt className="text-gray-500">Phone</dt><dd className="text-gray-900">{user.phone ?? "—"}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Member since</dt><dd className="text-gray-900">{formatDate(user.createdAt)}</dd></div>
        </dl>
      </div>
    </div>
  );
}
