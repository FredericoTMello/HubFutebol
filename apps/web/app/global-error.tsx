"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-sand">
        <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-3 px-4 py-8">
          <h1 className="text-2xl font-semibold text-ink">Erro inesperado</h1>
          <p className="text-sm text-slate-600">A aplicacao encontrou um problema ao renderizar a pagina.</p>
          <Button type="button" onClick={reset}>
            Tentar de novo
          </Button>
          <Link href="/">
            <Button type="button" variant="outline" className="w-full">
              Voltar ao inicio
            </Button>
          </Link>
        </main>
      </body>
    </html>
  );
}
