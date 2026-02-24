"use client";

import Link from "next/link";

import { AuthGate } from "@/components/auth-gate";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export function GroupShell({
  groupId,
  title,
  children
}: {
  groupId: string;
  title: string;
  children: React.ReactNode;
}) {
  const { logout, user } = useAuth();

  return (
    <AuthGate>
      <div className="mx-auto min-h-screen max-w-md bg-gradient-to-b from-brand-50 via-sand to-white pb-24">
        <header className="sticky top-0 z-10 border-b border-white/60 bg-white/80 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">HubFutebol</p>
              <h1 className="text-lg font-semibold text-ink">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-slate-600 sm:block">{user?.name}</span>
              <Button size="sm" variant="outline" onClick={logout}>
                Sair
              </Button>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            <Link href={`/g/${groupId}/round`} className="underline">
              Grupo #{groupId}
            </Link>
          </div>
        </header>
        <main className="px-4 py-4">{children}</main>
        <BottomNav groupId={groupId} />
      </div>
    </AuthGate>
  );
}

