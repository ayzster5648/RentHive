"use client";

import { useEffect } from "react";

type Viewed = { id: string; name: string; sub: string };

/** Records a recently-viewed property in localStorage (most-recent first, max 8). */
export function TrackView({ id, name, sub }: Viewed) {
  useEffect(() => {
    try {
      const key = "rh_recent_properties";
      const existing: Viewed[] = JSON.parse(localStorage.getItem(key) ?? "[]");
      const next = [{ id, name, sub }, ...existing.filter((v) => v.id !== id)].slice(0, 8);
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // localStorage unavailable — ignore.
    }
  }, [id, name, sub]);
  return null;
}
