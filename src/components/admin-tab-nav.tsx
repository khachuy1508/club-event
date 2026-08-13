"use client";

import Link from "next/link";

const TABS = [
  { id: "best", label: "Best Club" },
  { id: "clubs", label: "Clubs" },
  { id: "staff", label: "Tạo staff" },
  { id: "students", label: "Sinh viên" },
] as const;

export type AdminTabId = (typeof TABS)[number]["id"];

export function AdminTabNav({ active }: { active: AdminTabId }) {
  return (
    <nav
      className="-mx-1 flex gap-1 overflow-x-auto border-b border-[var(--line)] pb-px"
      aria-label="Admin sections"
    >
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={`/admin?tab=${tab.id}`}
            className={`shrink-0 rounded-t-md px-3 py-2.5 text-sm transition ${
              isActive
                ? "border border-b-0 border-[var(--line)] bg-[var(--surface)] font-semibold text-[var(--ink)]"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function parseAdminTab(value: string | undefined): AdminTabId {
  if (value === "clubs" || value === "staff" || value === "students" || value === "best") {
    return value;
  }
  return "best";
}
