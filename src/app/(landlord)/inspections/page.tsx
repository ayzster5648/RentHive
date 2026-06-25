import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatDate, daysUntil } from "@/lib/utils";
import { PageHeader, StatCard, Badge, EmptyState } from "@/components/ui";
import { AddInspectionButton, InspectionStatusControl } from "./InspectionButtons";

const typeLabels: Record<string, string> = { MOVE_IN: "Move-in", MOVE_OUT: "Move-out", ROUTINE: "Routine" };

export default async function InspectionsPage() {
  const user = await requireRole("LANDLORD");

  const inspections = await db.inspection.findMany({
    where: { property: { landlordId: user.id } },
    include: { property: true },
    orderBy: { scheduledFor: "desc" },
  });
  const properties = await db.property.findMany({ where: { landlordId: user.id }, select: { id: true, name: true } });

  const scheduled = inspections.filter((i) => i.status === "SCHEDULED").length;
  const completed = inspections.filter((i) => i.status === "COMPLETED").length;
  const upcoming = inspections.filter((i) => i.status === "SCHEDULED" && daysUntil(i.scheduledFor) >= 0).length;

  return (
    <div>
      <PageHeader title="Inspections" subtitle="Schedule and track move-in, move-out, and routine inspections." action={<AddInspectionButton properties={properties} />} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Scheduled" value={String(scheduled)} accent="brand" />
        <StatCard label="Upcoming" value={String(upcoming)} accent="amber" />
        <StatCard label="Completed" value={String(completed)} accent="green" />
      </div>

      {inspections.length === 0 ? (
        <EmptyState title="No inspections scheduled" hint="Schedule your first inspection to get started." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Property / unit</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Inspector</th>
                <th className="px-5 py-3 font-medium">Notes</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inspections.map((i) => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-700">
                    {formatDate(i.scheduledFor)}
                    {i.status === "SCHEDULED" && daysUntil(i.scheduledFor) >= 0 && (
                      <span className="ml-2 text-xs text-gray-400">in {daysUntil(i.scheduledFor)}d</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{i.property.name}{i.unitLabel ? ` · ${i.unitLabel}` : ""}</td>
                  <td className="px-5 py-3"><span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{typeLabels[i.type]}</span></td>
                  <td className="px-5 py-3 text-gray-600">{i.inspector ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-500">{i.notes ?? "—"}</td>
                  <td className="px-5 py-3"><InspectionStatusControl id={i.id} status={i.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
