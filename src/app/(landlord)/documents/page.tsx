import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui";
import { Tabs } from "@/components/Tabs";
import { Icons } from "@/components/icons";
import { AddDocumentButton } from "./AddDocumentButton";

// A starter catalog of common landlord forms (your own originals, fill-in-ready).
const landlordForms = [
  { name: "Residential Lease Agreement", kind: "Lease" },
  { name: "Month-to-Month Rental Agreement", kind: "Lease" },
  { name: "Notice to Pay Rent or Quit", kind: "Notice" },
  { name: "Lease Renewal Letter", kind: "Lease" },
  { name: "Notice of Lease Termination", kind: "Notice" },
  { name: "Move-In / Move-Out Checklist", kind: "Inspection" },
  { name: "Pet Addendum", kind: "Addendum" },
  { name: "Late Rent Notice", kind: "Notice" },
  { name: "Security Deposit Itemization", kind: "Financial" },
];

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "forms" } = await searchParams;
  const user = await requireRole("LANDLORD");

  const docs = await db.document.findMany({
    where: { OR: [{ property: { landlordId: user.id } }, { propertyId: null }] },
    include: { property: true },
    orderBy: { createdAt: "desc" },
  });
  const properties = await db.property.findMany({ where: { landlordId: user.id }, select: { id: true, name: true } });

  const tabs = [
    { key: "forms", label: "Landlord forms", href: "/documents" },
    { key: "templates", label: "My templates", href: "/documents?tab=templates" },
    { key: "files", label: "File manager", href: "/documents?tab=files", badge: String(docs.length) },
  ];

  return (
    <div>
      <PageHeader title="Documents" action={tab === "files" ? <AddDocumentButton properties={properties} /> : undefined} />
      <Tabs tabs={tabs} active={tab} />

      {tab === "forms" && (
        <>
          <p className="mb-4 text-sm text-gray-500">Ready-to-use landlord forms and notices. Open one to fill it in for a tenant or property.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {landlordForms.map((f) => (
              <div key={f.name} className="card flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {Icons.documents({ className: "h-5 w-5 text-brand-600" })}
                  <div>
                    <p className="font-medium text-gray-900">{f.name}</p>
                    <p className="text-xs text-gray-400">{f.kind}</p>
                  </div>
                </div>
                <button className="btn-secondary px-3 py-1 text-xs">Use</button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "templates" && (
        <TemplatesTab docs={docs.filter((d) => d.category === "Template")} />
      )}

      {tab === "files" && <FileManager docs={docs} />}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function TemplatesTab({ docs }: { docs: any[] }) {
  if (docs.length === 0) return <EmptyState title="No templates yet" hint="Upload a document with category “Template” to reuse it later." />;
  return (
    <div className="card divide-y divide-gray-100">
      {docs.map((d) => (
        <div key={d.id} className="flex items-center justify-between px-5 py-3">
          <span className="font-medium text-gray-900">{d.name}</span>
          <span className="text-xs uppercase text-gray-400">{d.type}</span>
        </div>
      ))}
    </div>
  );
}

function FileManager({ docs }: { docs: any[] }) {
  const totalKb = docs.reduce((s, d) => s + d.sizeKb, 0);
  const images = docs.filter((d) => ["jpg", "jpeg", "png", "gif", "webp"].includes(d.type));
  const documents = docs.filter((d) => ["pdf", "doc", "docx", "txt", "xls", "xlsx"].includes(d.type));
  const videos = docs.filter((d) => ["mp4", "mov", "avi"].includes(d.type));

  const fmtSize = (kb: number) => (kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(0)} kB`);

  // Group by property.
  const groups = new Map<string, any[]>();
  for (const d of docs) {
    const key = d.property?.name ?? "Unassigned";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(d);
  }

  const stats = [
    { label: "All files", count: docs.length, used: fmtSize(totalKb) },
    { label: "Images", count: images.length, used: fmtSize(images.reduce((s, d) => s + d.sizeKb, 0)) },
    { label: "Documents", count: documents.length, used: fmtSize(documents.reduce((s, d) => s + d.sizeKb, 0)) },
    { label: "Videos", count: videos.length, used: fmtSize(videos.reduce((s, d) => s + d.sizeKb, 0)) },
  ];

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-sm font-medium text-gray-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{s.count}</p>
            <p className="text-xs text-gray-400">{s.used} / 1 GB used</p>
          </div>
        ))}
      </div>

      {docs.length === 0 ? (
        <EmptyState title="No files yet" hint="Upload a file to get started." />
      ) : (
        <div className="space-y-5">
          {[...groups.entries()].map(([name, files]) => (
            <div key={name} className="card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-5 py-3">
                <Icons.documents className="h-4 w-4 text-gray-400" />
                <p className="font-semibold text-gray-900">{name}</p>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 text-left text-gray-400">
                  <tr><th className="px-5 py-2 font-medium">Name</th><th className="px-5 py-2 font-medium">Type</th><th className="px-5 py-2 font-medium">Size</th><th className="px-5 py-2 font-medium">Date</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {files.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-5 py-2.5 font-medium text-gray-900">{d.name}</td>
                      <td className="px-5 py-2.5 uppercase text-gray-500">{d.type}</td>
                      <td className="px-5 py-2.5 text-gray-500">{fmtSize(d.sizeKb)}</td>
                      <td className="px-5 py-2.5 text-gray-500">{formatDate(d.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
