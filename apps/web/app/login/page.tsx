"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { TokenResponse } from "@/lib/types";

const schema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória")
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" }
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      apiFetch<TokenResponse>("/auth/login", {
        method: "POST",
        body: data
      }),
    onSuccess: (data) => {
      setSession(data.access_token, data.user);
      router.replace("/join");
    }
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <Card className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Acesso</p>
          <CardTitle className="mt-1 text-xl">Entrar</CardTitle>
          <CardDescription>Use seu email para acessar o grupo da pelada.</CardDescription>
        </div>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="voce@email.com" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-xs text-danger">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" placeholder="******" {...form.register("password")} />
            {form.formState.errors.password && (
              <p className="text-xs text-danger">{form.formState.errors.password.message}</p>
            )}
          </div>
          {mutation.error && (
            <p className="text-sm text-danger">
              {mutation.error instanceof ApiError ? mutation.error.message : "Falha ao entrar"}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-600">
          Não tem conta?{" "}
          <Link href="/register" className="font-semibold text-brand-700 underline">
            Criar conta
          </Link>
        </p>
      </Card>
    </main>
  );
}

