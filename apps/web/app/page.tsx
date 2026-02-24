import Link from "next/link";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <Card className="space-y-4 bg-white/90">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">HubFutebol</p>
          <CardTitle className="mt-1 text-2xl">Pelada organizada no celular</CardTitle>
          <CardDescription className="mt-2">
            Entre no grupo, confirme presença, gere times e atualize ranking sem planilha.
          </CardDescription>
        </div>
        <div className="grid gap-3">
          <Link href="/login">
            <Button className="w-full" size="lg">
              Entrar
            </Button>
          </Link>
          <Link href="/register">
            <Button className="w-full" size="lg" variant="outline">
              Criar conta
            </Button>
          </Link>
          <Link href="/join">
            <Button className="w-full" size="lg" variant="secondary">
              Entrar com código
            </Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}

