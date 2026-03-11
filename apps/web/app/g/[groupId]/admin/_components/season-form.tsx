import type { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";

import type { SeasonFormInput, SeasonFormValues } from "./forms";

type SeasonFormProps = {
  form: UseFormReturn<SeasonFormInput, unknown, SeasonFormValues>;
  seasonId: number | null;
  isPending: boolean;
  error: unknown;
  onSubmit: (values: SeasonFormValues) => void;
};

export function SeasonForm({ form, seasonId, isPending, error, onSubmit }: SeasonFormProps) {
  return (
    <Card className="space-y-3">
      <div>
        <CardTitle>Temporada</CardTitle>
        <CardDescription>Criar/renovar a temporada ativa com regras de pontuacao.</CardDescription>
      </div>

      {seasonId && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-700">
          Temporada ativa ID: {seasonId}
        </div>
      )}

      <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1">
          <Label htmlFor="season-name">Nome</Label>
          <Input id="season-name" {...form.register("name")} />
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="space-y-1">
            <Label>W</Label>
            <Input type="number" {...form.register("win_points")} />
          </div>
          <div className="space-y-1">
            <Label>D</Label>
            <Input type="number" {...form.register("draw_points")} />
          </div>
          <div className="space-y-1">
            <Label>L</Label>
            <Input type="number" {...form.register("loss_points")} />
          </div>
          <div className="space-y-1">
            <Label>NO_SHOW</Label>
            <Input type="number" {...form.register("no_show_points")} />
          </div>
        </div>

        {error ? (
          <p className="text-sm text-danger">
            {error instanceof ApiError ? error.message : "Falha ao criar temporada"}
          </p>
        ) : null}

        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          {isPending ? "Salvando..." : "Criar temporada"}
        </Button>
      </form>
    </Card>
  );
}
