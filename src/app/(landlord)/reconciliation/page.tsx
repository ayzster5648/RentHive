import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, cn } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui";
import { Icons } from "@/components/icons";
import { AddBankAccountButton } from "./ReconClient";

export default async function ReconciliationPage() {
  const user = await requireRole("LANDLORD");
  const accounts = await db.bankAccount.findMany({
    where: { landlordId: user.id },
    include: { reconciliations: { include: { lines: true }, orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <PageHeader title="Reconciliation" subtitle="Compare your records against your bank statements to catch discrepancies." action={<AddBankAccountButton />} />

      {accounts.length === 0 ? (
        <div className="card p-10 text-center">
          {Icons.reconciliation({ className: "mx-auto h-10 w-10 text-brand-300" })}
          <p className="mt-3 font-medium text-gray-700">No bank accounts yet</p>
          <p className="mt-1 text-sm text-gray-400">Add a bank account to start reconciling. (No live bank feed is connected — statements are generated from your recorded payments and expenses.)</p>
          <div className="mt-4 flex justify-center"><AddBankAccountButton /></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => {
            const rec = a.reconciliations[0];
            const lines = rec?.lines.filter((l) => l.matchStatus !== "IGNORED") ?? [];
            const statement = lines.reduce((s, l) => s + l.amount, 0);
            const account = lines.filter((l) => l.matchStatus === "MATCHED").reduce((s, l) => s + l.amount, 0);
            const diff = statement - account;
            const toReview = rec?.lines.filter((l) => l.matchStatus === "TO_REVIEW").length ?? 0;

            return (
              <div key={a.id} className="card overflow-hidden">
                <div className="flex items-center gap-3 p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100">{Icons.building({ className: "h-5 w-5 text-gray-400" })}</span>
                  <div>
                    <p className="font-semibold uppercase text-gray-900">{a.bankName}</p>
                    <p className="text-xs text-gray-400">{a.nickname ? `${a.nickname} | ` : ""}•••• {a.mask}</p>
                  </div>
                </div>

                {rec && (
                  <div className="space-y-1 px-5 pb-4 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Statement balance</span><span className="text-gray-900">{formatCurrency(statement)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Balance in RentHive</span><span className="text-gray-900">{formatCurrency(account)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Difference</span><span className={cn("font-semibold", diff === 0 ? "text-green-600" : "text-red-600")}>{formatCurrency(diff)}</span></div>
                  </div>
                )}

                <div className={cn("flex items-center justify-between border-t px-5 py-3 text-sm", rec && toReview > 0 ? "border-amber-100 bg-amber-50 text-amber-700" : "border-gray-100 bg-gray-50 text-gray-500")}>
                  {rec ? (
                    <>
                      <span className="flex items-center gap-1.5">{toReview > 0 ? <>{Icons.wrench({ className: "h-4 w-4" })} {toReview} record{toReview !== 1 ? "s" : ""} to review</> : <>{Icons.check({ className: "h-4 w-4 text-green-600" })} Reconciled</>}</span>
                      <Link href={`/reconciliation/${rec.id}`} className="font-semibold text-brand-600 hover:underline">View</Link>
                    </>
                  ) : (
                    <>
                      <span className="flex items-center gap-1.5">{Icons.reconciliation({ className: "h-4 w-4" })} Start reconciliation</span>
                      <Link href={`/reconciliation/new?bank=${a.id}`} className="font-semibold text-brand-600 hover:underline">Start</Link>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
