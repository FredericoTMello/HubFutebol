"use client";

import { Suspense, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthGate } from "@/components/app/auth-gate";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Group } from "@/lib/types";

const schema = z.object({
  join_code: z.string().min(3, "Informe o código do convite")
});

type FormData = z.infer<typeof schema>;

function JoinPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { join_code: "" }
  });

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      form.setValue("join_code", code);
    }
  }, [form, searchParams]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      apiFetch<Group>("/groups/join", {
        method: "POST",
        body: data,
        token
      }),
    onSuccess: (group) => {
      router.replace(`/g/${group.id}/round`);
    }
  });

  return (
    <AuthGate>
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
        <Card className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Convite</p>
            <CardTitle className="mt-1 text-xl">Entrar no grupo</CardTitle>
            <CardDescription>Cole o código recebido no WhatsApp.</CardDescription>
          </div>

          <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <div className="space-y-1.5">
              <Label htmlFor="join_code">Código</Label>
              <Input id="join_code" placeholder="ex: demo123" {...form.register("join_code")} />
              {form.formState.errors.join_code && (
                <p className="text-xs text-danger">{form.formState.errors.join_code.message}</p>
              )}
            </div>
            {mutation.error && (
              <p className="text-sm text-danger">
                {mutation.error instanceof ApiError ? mutation.error.message : "Falha ao entrar no grupo"}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending || !token}>
              {mutation.isPending ? "Entrando..." : "Entrar no grupo"}
            </Button>
          </form>
        </Card>
      </main>
    </AuthGate>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-md px-4 py-8 text-sm text-slate-600">Carregando...</main>}>
      <JoinPageContent />
    </Suspense>
  );
}
