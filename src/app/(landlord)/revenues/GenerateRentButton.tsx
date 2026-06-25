"use client";

import { generateMonthlyRent } from "../actions";

export function GenerateRentButton() {
  return (
    <form action={generateMonthlyRent}>
      <button type="submit" className="btn-secondary">Generate this month&apos;s rent</button>
    </form>
  );
}
