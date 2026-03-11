"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  { key: "round", label: "Rodada", href: "round" },
  { key: "ranking", label: "Ranking", href: "ranking" },
  { key: "players", label: "Jogadores", href: "players" },
  { key: "admin", label: "Admin", href: "admin" }
];

export function BottomNav({ groupId }: { groupId: string }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 mx-auto max-w-md border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur">
      <ul className="grid grid-cols-4 gap-2">
        {items.map((item) => {
          const href = `/g/${groupId}/${item.href}`;
          const active = pathname === href;
          return (
            <li key={item.key}>
              <Link
                href={href}
                className={cn(
                  "flex h-12 items-center justify-center rounded-xl text-xs font-semibold",
                  active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700"
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

