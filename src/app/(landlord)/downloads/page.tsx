import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui";
import { Icons } from "@/components/icons";

const exports = [
  { type: "rent-roll", name: "Rent Roll", desc: "Active leases, tenants, rent, and lease dates." },
  { type: "tenants", name: "Tenant Directory", desc: "Contacts, emergency info, and assigned units." },
  { type: "transactions", name: "All Transactions", desc: "Every invoice and expense across the portfolio." },
  { type: "expenses", name: "Expenses", desc: "All recorded property expenses." },
];

export default async function DownloadsPage() {
  const user = await requireRole("LANDLORD");
  const docs = await db.document.findMany({
    where: { OR: [{ property: { landlordId: user.id } }, { propertyId: null }] },
    include: { property: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div>
      <PageHeader title="Downloads" subtitle="Export your data as CSV or grab recent documents." />

      <h2 className="mb-3 font-semibold text-gray-900">Data exports</h2>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {exports.map((e) => (
          <div key={e.type} className="card flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {Icons.downloads({ className: "h-5 w-5 text-brand-600" })}
              <div>
                <p className="font-medium text-gray-900">{e.name}</p>
                <p className="text-xs text-gray-400">{e.desc}</p>
              </div>
            </div>
            <a href={`/api/export/${e.type}`} className="btn-primary px-3 py-1.5 text-sm" download>
              Download CSV
            </a>
          </div>
        ))}
      </div>

      <h2 className="mb-3 font-semibold text-gray-900">Recent documents</h2>
      {docs.length === 0 ? (
        <EmptyState title="No documents" hint="Upload files in the Documents section." />
      ) : (
        <div className="card divide-y divide-gray-100">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                {Icons.documents({ className: "h-5 w-5 text-gray-400" })}
                <div>
                  <p className="font-medium text-gray-900">{doc.name}</p>
                  <p className="text-xs text-gray-400">{doc.property?.name ?? "Unassigned"} · {formatDate(doc.createdAt)}</p>
                </div>
              </div>
              <span className="text-xs uppercase text-gray-400">{doc.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
