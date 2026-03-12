"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <Card className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-danger">Erro</p>
          <CardTitle className="mt-1 text-xl">Algo saiu do fluxo</CardTitle>
          <CardDescription>
            A tela falhou ao carregar. Tente novamente ou volte para a entrada principal.
          </CardDescription>
        </div>
        <div className="grid gap-3">
          <Button type="button" onClick={reset}>
            Tentar de novo
          </Button>
          <Link href="/">
            <Button type="button" variant="outline" className="w-full">
              Voltar ao inicio
            </Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
