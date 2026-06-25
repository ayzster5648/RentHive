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
  const [propertyCount, tenantCount, leaseCount, paymentCount, listingCount] = await Promise.all([
    db.property.count({ where: { landlordId } }),
    db.user.count({ where: { role: "TENANT", leases: { some: { unit: { property: { landlordId } } } } } }),
    db.lease.count({ where: { unit: { property: { landlordId } } } }),
    db.payment.count({ where: { invoice: { lease: { unit: { property: { landlordId } } } } } }),
    db.listing.count({ where: { unit: { property: { landlordId } } } }),
  ]);

  const steps: SetupStep[] = [
    {
      key: "property",
      title: "Add a property",
      description: "Create a property to manage in your portfolio.",
      done: propertyCount > 0,
      href: "/portfolio?new=property",
      cta: "Add property",
    },
    {
      key: "tenant",
      title: "Add tenants",
      description: "Onboard the people renting from you.",
      done: tenantCount > 0,
      href: "/renters",
      cta: "Add tenant",
    },
    {
      key: "lease",
      title: "Create a lease",
      description: "Set rent, deposit, and lease dates for a unit.",
      done: leaseCount > 0,
      href: "/renters",
      cta: "Create lease",
    },
    {
      key: "payments",
      title: "Set up payments",
      description: paymentsConfigured() ? "Online payments are connected." : "Collect rent and record payments.",
      done: paymentCount > 0 || paymentsConfigured(),
      href: "/revenues",
      cta: "Set up payments",
    },
    {
      key: "market",
      title: "Market a property",
      description: "Publish a listing to attract applicants.",
      done: listingCount > 0,
      href: "/listings",
      cta: "List a unit",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const percent = Math.round((doneCount / steps.length) * 100);
  return { steps, percent, doneCount };
}
