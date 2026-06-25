import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { PageHeader, Badge, EmptyState } from "@/components/ui";
import { NewRequestButton } from "./NewRequestButton";

export default async function PortalMaintenance() {
  const user = await requireRole("TENANT");

  const requests = await db.maintenanceRequest.findMany({
    where: { tenantId: user.id },
    include: { unit: { include: { property: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Maintenance"
        subtitle="Submit and track maintenance requests."
        action={<NewRequestButton />}
      />

      {requests.length === 0 ? (
        <EmptyState title="No requests yet" hint="Submit a request and your landlord will be notified." />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{r.title}</p>
                  <Badge status={r.priority} />
                </div>
                <p className="mt-0.5 text-sm text-gray-500">{r.description}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {r.unit.label} · Submitted {formatDate(r.createdAt)}
                </p>
              </div>
              <Badge status={r.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
