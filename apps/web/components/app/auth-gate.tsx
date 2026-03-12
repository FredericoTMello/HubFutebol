"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth-context";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { hydrated, token } = useAuth();

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/login");
    }
  }, [hydrated, router, token]);

  if (!hydrated) {
    return <div className="p-6 text-sm text-slate-500">Carregando sessao...</div>;
  }

  if (!token) return null;

  return children;
}
