import "server-only";
import { db } from "./db";
import { paymentsConfigured } from "./integrations/payments";

export type SetupStep = {
  key: string;
  title: string;
  description: string;
  done: boolean;
  href: string;
  cta: string;
};

export type SetupState = {
  steps: SetupStep[];
  percent: number;
  doneCount: number;
};

/** Compute the landlord's onboarding checklist from real data. */
export async function getSetupState(landlordId: string): Promise<SetupState> {
  const [propertyCount, unitCount, leaseCount, paymentCount, listingCount] = await Promise.all([
    db.property.count({ where: { landlordId } }),
    db.unit.count({ where: { property: { landlordId } } }),
    db.lease.count({ where: { unit: { property: { landlordId } } } }),
    db.payment.count({ where: { invoice: { lease: { unit: { property: { landlordId } } } } } }),
    db.listing.count({ where: { unit: { property: { landlordId } } } }),
  ]);

  const steps: SetupStep[] = [
    {
      key: "property",
      title: "Add your first property",
      description: "Create a property to manage in your portfolio.",
      done: propertyCount > 0,
      href: "/portfolio?new=property",
      cta: "Add property",
    },
    {
      key: "unit",
      title: "Add units",
      description: "Add the rentable units inside your properties.",
      done: unitCount > 0,
      href: "/portfolio?tab=units",
      cta: "Add unit",
    },
    {
      key: "tenant",
      title: "Add your tenants",
      description: "Onboard tenants and create their leases.",
      done: leaseCount > 0,
      href: "/renters",
      cta: "Add tenant",
    },
    {
      key: "listing",
      title: "List a vacant unit",
      description: "Publish a listing to attract applicants.",
      done: listingCount > 0,
      href: "/listings",
      cta: "Create listing",
    },
    {
      key: "payments",
      title: "Set up rent payments",
      description: paymentsConfigured()
        ? "Online payments are connected."
        : "Collect rent and record payments.",
      done: paymentCount > 0 || paymentsConfigured(),
      href: "/revenues",
      cta: "Set up payments",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const percent = Math.round((doneCount / steps.length) * 100);
  return { steps, percent, doneCount };
}
