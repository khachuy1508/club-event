"use client";

import Link from "next/link";
import {
  Clock,
  MessageSquareText,
  Trophy,
  UserPlus,
  Users,
  Building2,
} from "lucide-react";
import { ADMIN_TABS, type AdminTabId } from "@/lib/admin-tabs";

const ICONS = {
  best: Trophy,
  clubs: Building2,
  hours: Clock,
  staff: UserPlus,
  students: Users,
  opinions: MessageSquareText,
} as const;

export function AdminTabNav({ active }: { active: AdminTabId }) {
  return (
    <nav aria-label="Admin sections" className="flex flex-col gap-1">
      {ADMIN_TABS.map((tab) => {
        const isActive = tab.id === active;
        const Icon = ICONS[tab.id];
        return (
          <Link
            key={tab.id}
            href={`/admin?tab=${tab.id}`}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition ${
              isActive
                ? "bg-[var(--accent)] font-semibold text-white"
                : "text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
