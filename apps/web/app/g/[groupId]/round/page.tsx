"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useGroup, useGroupPlayers, useMatchday, useSeasonMatchdays } from "@/lib/group-hooks";

const attendanceSchema = z.object({
  player_id: z.coerce.number().int().positive(),
  status: z.enum(["CONFIRMED", "DECLINED", "NO_SHOW"])
});

type AttendanceForm = z.output<typeof attendanceSchema>;
type AttendanceFormInput = z.input<typeof attendanceSchema>;

const statusLabel: Record<AttendanceForm["status"], string> = {
  CONFIRMED: "Confirmado",
  DECLINED: "Ausente",
  NO_SHOW: "No-show"
};

export default function RoundPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const groupQuery = useGroup(groupId);
  const playersQuery = useGroupPlayers(groupId);
  const seasonId = groupQuery.data?.active_season_id ?? null;
  const matchdaysQuery = useSeasonMatchdays(seasonId);
  const currentMatchday = matchdaysQuery.data?.[0];
  const matchdayQuery = useMatchday(currentMatchday?.id);

  const linkedPlayer = playersQuery.data?.find((p) => p.user_id === user?.id);
  const fallbackPlayer = playersQuery.data?.[0];

  const form = useForm<AttendanceFormInput, unknown, AttendanceForm>({
    resolver: zodResolver(attendanceSchema),
    values: {
      player_id: linkedPlayer?.id ?? fallbackPlayer?.id ?? 0,
      status: "CONFIRMED"
    }
  });

  const attendanceMutation = useMutation({
    mutationFn: (values: AttendanceForm) =>
      apiFetch(`/matchdays/${currentMatchday?.id}/attendance`, {
        method: "POST",
        body: values,
        token
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["matchday", currentMatchday?.id] }),
        queryClient.invalidateQueries({ queryKey: ["season", seasonId, "standings"] }),
        queryClient.invalidateQueries({ queryKey: ["season", seasonId, "player-stats"] })
      ]);
    }
  });

  const isLoading =
    groupQuery.isLoading || playersQuery.isLoading || matchdaysQuery.isLoading || matchdayQuery.isLoading;

  if (isLoading) {
    return <div className="text-sm text-slate-600">Carregando rodada...</div>;
  }

  if (groupQuery.error || playersQuery.error || matchdaysQuery.error || matchdayQuery.error) {
    const error = groupQuery.error || playersQuery.error || matchdaysQuery.error || matchdayQuery.error;
    return <div className="text-sm text-danger">Erro ao carregar dados: {String(error)}</div>;
  }

  if (!seasonId) {
    return (
      <Card>
        <CardTitle>Nenhuma temporada ativa</CardTitle>
        <CardDescription>Um admin precisa criar a temporada em Admin para iniciar o ranking.</CardDescription>
      </Card>
    );
  }

  if (!currentMatchday || !matchdayQuery.data) {
    return (
      <Card>
        <CardTitle>Nenhuma rodada cadastrada</CardTitle>
        <CardDescription>Crie a rodada atual na aba Admin para começar as confirmações.</CardDescription>
      </Card>
    );
  }

  const matchday = matchdayQuery.data;
  const attendanceMap = new Map(matchday.attendance.map((item) => [item.player_id, item.status]));
  const sortedPlayers = [...(playersQuery.data ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{matchday.title}</CardTitle>
            <CardDescription>
              {new Date(matchday.scheduled_for).toLocaleDateString("pt-BR")} ·{" "}
              {matchday.is_locked ? "Times gerados" : "Aberta para presença"}
            </CardDescription>
          </div>
          <Badge className={matchday.is_locked ? "bg-pitch/10 text-pitch" : ""}>
            {matchday.is_locked ? "LOCK" : "ABERTA"}
          </Badge>
        </div>

        <form
          className="grid gap-3"
          onSubmit={form.handleSubmit((values) => attendanceMutation.mutate(values))}
        >
          <div className="grid gap-1">
            <label className="text-sm font-medium text-slate-700">Jogador</label>
            <select
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
              {...form.register("player_id")}
              disabled={!sortedPlayers.length}
            >
              {sortedPlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.nickname || player.name}
                  {player.user_id === user?.id ? " (você)" : ""}
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

          {attendanceMutation.error && (
            <p className="text-sm text-danger">
              {attendanceMutation.error instanceof ApiError
                ? attendanceMutation.error.message
                : "Falha ao atualizar presença"}
            </p>
          )}
          <Button type="submit" size="lg" disabled={attendanceMutation.isPending}>
            {attendanceMutation.isPending ? "Salvando..." : "Confirmar presença"}
          </Button>
        </form>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle>Lista de Presenças</CardTitle>
          <Badge>{matchday.attendance.length} respostas</Badge>
        </div>
        <ul className="space-y-2">
          {sortedPlayers.map((player) => {
            const status = attendanceMap.get(player.id);
            return (
              <li
                key={player.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{player.nickname || player.name}</p>
                  <p className="text-xs text-slate-500">
                    {player.position || "SEM POSIÇÃO"} · Força {player.skill_rating}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    status === "CONFIRMED"
                      ? "bg-emerald-100 text-emerald-700"
                      : status === "NO_SHOW"
                        ? "bg-rose-100 text-rose-700"
                        : status === "DECLINED"
                          ? "bg-slate-200 text-slate-700"
                          : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {status ? statusLabel[status] : "Pendente"}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
