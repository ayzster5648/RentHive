// Minimal inline SVG icon set (stroke-based, currentColor) to avoid extra deps.
type P = { className?: string };
const base = "h-5 w-5";
const svg = (children: React.ReactNode, p: P) => (
  <svg className={p.className ?? base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

export const Icons = {
  dashboard: (p: P) => svg(<><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></>, p),
  building: (p: P) => svg(<><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" /></>, p),
  home: (p: P) => svg(<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></>, p),
  listings: (p: P) => svg(<><path d="M3 4h18v4H3zM3 10h18v10H3z" /><path d="M7 14h4" /></>, p),
  users: (p: P) => svg(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>, p),
  renters: (p: P) => svg(<><circle cx="12" cy="8" r="4" /><path d="M5.5 21a8.38 8.38 0 0 1 13 0" /></>, p),
  transactions: (p: P) => svg(<><circle cx="12" cy="12" r="9" /><path d="M8 9h6l-2-2M16 15H10l2 2" /></>, p),
  revenues: (p: P) => svg(<><circle cx="12" cy="12" r="9" /><path d="M12 16V8M9 11l3-3 3 3" /></>, p),
  expenses: (p: P) => svg(<><circle cx="12" cy="12" r="9" /><path d="M12 8v8M9 13l3 3 3-3" /></>, p),
  reconciliation: (p: P) => svg(<><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2" /></>, p),
  reports: (p: P) => svg(<><path d="M9 2h6a1 1 0 0 1 1 1v1h2a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h2V3a1 1 0 0 1 1-1z" /><path d="M9 12h6M9 16h4" /></>, p),
  documents: (p: P) => svg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h6" /></>, p),
  wrench: (p: P) => svg(<><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></>, p),
  inspections: (p: P) => svg(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>, p),
  downloads: (p: P) => svg(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5M12 15V3" /></>, p),
  calendar: (p: P) => svg(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>, p),
  tasks: (p: P) => svg(<><path d="M3 6h.01M3 12h.01M3 18h.01M8 6h13M8 12h13M8 18h13" /></>, p),
  logout: (p: P) => svg(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>, p),
  plus: (p: P) => svg(<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>, p),
  bed: (p: P) => svg(<><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8V4h12" /></>, p),
  search: (p: P) => svg(<><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>, p),
  bell: (p: P) => svg(<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>, p),
  help: (p: P) => svg(<><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></>, p),
  chat: (p: P) => svg(<><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></>, p),
  check: (p: P) => svg(<><path d="M20 6 9 17l-5-5" /></>, p),
  chevronDown: (p: P) => svg(<><path d="m6 9 6 6 6-6" /></>, p),
  chevronLeft: (p: P) => svg(<><path d="m15 18-6-6 6-6" /></>, p),
  chevronRight: (p: P) => svg(<><path d="m9 18 6-6-6-6" /></>, p),
  dollar: (p: P) => svg(<><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>, p),
  logo: (p: P) => (
    <svg className={p.className ?? "h-8 w-8"} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#16745f" />
      <path d="M16 7l8 6v1.5h-2V22a1 1 0 0 1-1 1h-3v-5h-4v5H11a1 1 0 0 1-1-1v-7.5H8V13l8-6z" fill="#fff" />
    </svg>
  ),
};
