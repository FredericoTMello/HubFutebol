import type { UseFormReturn } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import type { MatchDay } from "@/lib/types";

import type { MatchdayFormInput, MatchdayFormValues } from "./forms";

type MatchdayManagerProps = {
  form: UseFormReturn<MatchdayFormInput, unknown, MatchdayFormValues>;
  seasonId: number | null;
  matchday: MatchDay | null;
  isCreating: boolean;
  createError: unknown;
  isLocking: boolean;
  lockError: unknown;
  onCreateMatchday: (values: MatchdayFormValues) => void;
  onLockMatchday: () => void;
};

export function MatchdayManager({
  form,
  seasonId,
  matchday,
  isCreating,
  createError,
  isLocking,
  lockError,
  onCreateMatchday,
  onLockMatchday
}: MatchdayManagerProps) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Rodada</CardTitle>
          <CardDescription>Crie a rodada atual e acompanhe o estado (aberta/lock).</CardDescription>
        </div>
        {matchday && <Badge>{matchday.is_locked ? "LOCK" : "ABERTA"}</Badge>}
      </div>

      <form className="space-y-3" onSubmit={form.handleSubmit(onCreateMatchday)}>
        <div className="space-y-1">
          <Label htmlFor="round-title">Titulo</Label>
          <Input id="round-title" {...form.register("title")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="round-date">Data</Label>
          <Input id="round-date" type="date" {...form.register("scheduled_for")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="round-notes">Notas (opcional)</Label>
          <Input id="round-notes" {...form.register("notes")} />
        </div>

        {createError ? (
          <p className="text-sm text-danger">
            {createError instanceof ApiError ? createError.message : "Falha ao criar rodada"}
          </p>
        ) : null}

        <Button type="submit" variant="outline" className="w-full" size="lg" disabled={isCreating || !seasonId}>
          {isCreating ? "Criando..." : "Criar rodada"}
        </Button>
      </form>

      {matchday ? (
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-sm font-semibold">{matchday.title}</p>
          <p className="text-xs text-slate-500">
            {new Date(matchday.scheduled_for).toLocaleDateString("pt-BR")} · {matchday.attendance.length} presencas
            registradas
          </p>

          <div className="mt-3 grid gap-2">
            <Button size="lg" onClick={onLockMatchday} disabled={isLocking || matchday.is_locked}>
              {isLocking ? "Gerando..." : matchday.is_locked ? "Rodada ja travada" : "Lock + Gerar Times"}
            </Button>

            {lockError ? (
              <p className="text-sm text-danger">
                {lockError instanceof ApiError ? lockError.message : "Falha no lock"}
              </p>
            ) : null}
          </div>

          {matchday.teams.length ? (
            <div className="mt-3 grid gap-2">
              {matchday.teams.map((team) => (
                <div key={team.team_id} className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{team.name}</p>
                    <span className="text-xs text-slate-600">Forca {team.total_rating}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {team.players.map((player) => player.player_name).join(", ") || "Sem jogadores"}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
