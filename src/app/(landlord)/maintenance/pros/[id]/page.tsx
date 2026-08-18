import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate, cn, initials } from "@/lib/utils";
import { Badge, EmptyState } from "@/components/ui";
import { Icons } from "@/components/icons";

export default async function ServiceProProfile({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "profile" } = await searchParams;
  const user = await requireRole("LANDLORD");
  const pro = await db.servicePro.findUnique({ where: { id } });
  if (!pro) notFound();

  // Expenses recorded to this pro (matched by vendor name/company).
  const names = [pro.name, pro.company].filter(Boolean) as string[];
  const expenses = names.length
    ? await db.expense.findMany({ where: { vendor: { in: names }, OR: [{ property: { landlordId: user.id } }, { propertyId: null }] }, include: { property: true }, orderBy: { date: "desc" } })
    : [];
  const outstanding = expenses.filter((e) => e.status !== "PAID").reduce((s, e) => s + e.amount, 0);
  const addInvoiceHref = `/expenses/new?payee=${encodeURIComponent(pro.company ?? pro.name)}`;

  const tabs = [
    { key: "profile", label: "Profile", href: `/maintenance/pros/${id}` },
    { key: "transactions", label: "Transactions", href: `/maintenance/pros/${id}?tab=transactions` },
  ];

  return (
    <div>
      <div className="mb-3 text-sm text-gray-400">
        <Link href="/maintenance?tab=pros" className="text-brand-600 hover:underline">Service Pros</Link> / <span className="text-gray-700">{pro.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="card p-5 text-center">
            <p className="mb-3 text-left text-sm font-semibold text-gray-500">Service Pro</p>
            <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-brand-400 text-2xl font-semibold text-white">{initials(pro.name)}</div>
            <p className="text-lg font-bold text-gray-900">{pro.name}</p>
            {pro.phone && <p className="text-sm text-brand-600">{pro.phone}</p>}
            {pro.email && <a href={`mailto:${pro.email}`} className="text-sm text-gray-500 hover:underline">{pro.email}</a>}
          </div>
          <div className="card p-5">
            <p className="text-sm text-gray-400">Outstanding</p>
            <p className={cn("mt-1 text-xl font-bold", outstanding > 0 ? "text-red-600" : "text-gray-900")}>{formatCurrency(outstanding)}</p>
          </div>
          <div className="card p-5">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Reports</h3>
            <Link href="/reports/general-expenses" className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm hover:bg-gray-50">
              <span className="text-gray-700">Provider Statement</span><span className="text-xs font-medium text-brand-600">View</span>
            </Link>
          </div>
        </aside>

        {/* Main */}
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            <Link href={addInvoiceHref} className="btn-primary">{Icons.plus({ className: "h-4 w-4" })}Add invoice</Link>
            <Link href={`/maintenance/pros/${id}/edit`} className="btn-secondary">Edit</Link>
          </div>

          <div className="mb-6 flex gap-1 border-b border-gray-200">
            {tabs.map((t) => (
              <Link key={t.key} href={t.href} className={cn("-mb-px border-b-2 px-4 py-2.5 text-sm font-medium", t.key === tab ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500 hover:text-gray-800")}>{t.label}</Link>
            ))}
          </div>

          {tab === "profile" ? (
            <div className="space-y-6">
              <Section title="Personal information">
                <div className="grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2">
                  <F label="First name" value={pro.firstName ?? pro.name.split(" ")[0]} />
                  <F label="Email" value={pro.email ?? "—"} link={pro.email ? `mailto:${pro.email}` : undefined} />
                  <F label="Middle name" value={pro.middleName ?? "—"} />
                  <F label="Additional email" value={pro.additionalEmail ?? "—"} />
                  <F label="Last name" value={pro.lastName ?? "—"} />
                  <F label="Phone" value={pro.phone ?? "—"} />
                  <F label="Company name" value={pro.company ?? "—"} />
                  <F label="Additional phone" value={pro.additionalPhone ?? "—"} />
                  <F label="Company website" value={pro.website ?? "—"} link={pro.website ?? undefined} />
                  <F label="Fax" value={pro.fax ?? "—"} />
                  <F label="Service Pro Category" value={`${pro.category}${pro.subcategory ? ` / ${pro.subcategory}` : ""}`} />
                </div>
              </Section>
              <Section title="Forwarding address">
                <p className="text-sm text-gray-900">{[pro.address, pro.city, pro.state, pro.zip, pro.country].filter(Boolean).join(", ") || "—"}</p>
              </Section>
              <Section title="Attachments">
                <p className="py-4 text-center text-sm text-gray-400">No attachments. When you add attachments, they will appear here.</p>
              </Section>
              <p className="text-right text-xs text-gray-400">Created on {formatDate(pro.createdAt)}</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="grid grid-cols-[90px_100px_1.4fr_1fr_120px] gap-4 border-b border-gray-100 px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-400">
                <span>Status</span><span>Due date</span><span>Category &amp; property</span><span>Contact</span><span className="text-right">Total &amp; balance</span>
              </div>
              {expenses.length === 0 ? (
                <div className="py-14"><EmptyState title="No transactions" hint="Add an invoice to record what you owe this service pro." /></div>
              ) : (
                expenses.map((e) => (
                  <div key={e.id} className="grid grid-cols-[90px_100px_1.4fr_1fr_120px] gap-4 px-5 py-3 text-sm hover:bg-gray-50">
                    <Badge status={e.status === "PAID" ? "PAID" : "DUE"} />
                    <span className="text-gray-600">{formatDate(e.date)}</span>
                    <span className="text-gray-700">{e.category} · <span className="text-gray-400">{e.property?.name ?? "Portfolio"}</span></span>
                    <span className="font-medium text-gray-900">{e.vendor ?? "—"}</span>
                    <span className="text-right font-semibold text-red-600">−{formatCurrency(e.amount)}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="card p-6"><h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>{children}</div>;
}
function F({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-50 pb-1.5">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-gray-900">{link ? <a href={link} className="text-brand-600 hover:underline">{value}</a> : value}</dd>
    </div>
  );
}
