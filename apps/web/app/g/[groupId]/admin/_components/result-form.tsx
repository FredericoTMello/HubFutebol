import type { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import type { MatchDay } from "@/lib/types";

import type { ResultFormInput, ResultFormValues } from "./forms";

type ResultFormProps = {
  currentMatch: MatchDay["matches"][number] | null;
  form: UseFormReturn<ResultFormInput, unknown, ResultFormValues>;
  isPending: boolean;
  error: unknown;
  onSubmit: (values: ResultFormValues) => void;
};

export function ResultForm({ currentMatch, form, isPending, error, onSubmit }: ResultFormProps) {
  return (
    <Card className="space-y-3">
      <div>
        <CardTitle>Lancar placar</CardTitle>
        <CardDescription>Atualiza standings e stats da temporada.</CardDescription>
      </div>

      {!currentMatch ? (
        <p className="text-sm text-slate-500">Faca o lock da rodada para gerar o jogo automatico.</p>
      ) : (
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Time A</Label>
              <Input type="number" min={0} {...form.register("home_score")} />
            </div>
            <div className="space-y-1">
              <Label>Time B</Label>
              <Input type="number" min={0} {...form.register("away_score")} />
            </div>
          </div>

          {error ? (
            <p className="text-sm text-danger">
              {error instanceof ApiError ? error.message : "Falha ao lancar resultado"}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar resultado"}
          </Button>
        </form>
      )}
    </Card>
  );
}
