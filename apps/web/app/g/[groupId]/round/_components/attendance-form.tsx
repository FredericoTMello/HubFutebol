"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import type { MatchDay, Player } from "@/lib/types";

const attendanceSchema = z.object({
  player_id: z.coerce.number().int().positive(),
  status: z.enum(["CONFIRMED", "DECLINED", "NO_SHOW"])
});

type AttendanceFormValues = z.output<typeof attendanceSchema>;
type AttendanceFormInput = z.input<typeof attendanceSchema>;

type AttendanceFormProps = {
  matchday: MatchDay;
  players: Player[];
  userId?: number;
  isPending: boolean;
  error: unknown;
  onSubmit: (values: AttendanceFormValues) => void;
};

export function AttendanceForm({
  matchday,
  players,
  userId,
  isPending,
  error,
  onSubmit
}: AttendanceFormProps) {
  const linkedPlayer = players.find((player) => player.user_id === userId);
  const fallbackPlayer = players[0];

  const form = useForm<AttendanceFormInput, unknown, AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    values: {
      player_id: linkedPlayer?.id ?? fallbackPlayer?.id ?? 0,
      status: "CONFIRMED"
    }
  });

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>{matchday.title}</CardTitle>
          <CardDescription>
            {new Date(matchday.scheduled_for).toLocaleDateString("pt-BR")} ·{" "}
            {matchday.is_locked ? "Times gerados" : "Aberta para presenca"}
          </CardDescription>
        </div>
        <Badge className={matchday.is_locked ? "bg-pitch/10 text-pitch" : ""}>
          {matchday.is_locked ? "LOCK" : "ABERTA"}
        </Badge>
      </div>

      <form className="grid gap-3" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-1">
          <label className="text-sm font-medium text-slate-700">Jogador</label>
          <select
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
            {...form.register("player_id")}
            disabled={!players.length}
          >
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.nickname || player.name}
                {player.user_id === userId ? " (voce)" : ""}
              </option>
            ))}
          </select>
          {form.formState.errors.player_id && (
            <p className="text-xs text-danger">{form.formState.errors.player_id.message}</p>
          )}
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium text-slate-700">Status</label>
          <select className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm" {...form.register("status")}>
            <option value="CONFIRMED">Confirmado</option>
            <option value="DECLINED">Ausente</option>
            <option value="NO_SHOW">No-show</option>
          </select>
        </div>

        {error ? (
          <p className="text-sm text-danger">
            {error instanceof ApiError ? error.message : "Falha ao atualizar presenca"}
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Salvando..." : "Confirmar presenca"}
        </Button>
      </form>
    </Card>
  );
}
