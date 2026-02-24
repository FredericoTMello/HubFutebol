"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { RoleGate } from "@/components/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useGroup, useMatchday, useSeasonMatchdays } from "@/lib/group-hooks";

const seasonSchema = z.object({
  name: z.string().min(2),
  win_points: z.coerce.number().int(),
  draw_points: z.coerce.number().int(),
  loss_points: z.coerce.number().int(),
  no_show_points: z.coerce.number().int()
});

const matchdaySchema = z.object({
  title: z.string().min(2),
  scheduled_for: z.string().min(1),
  notes: z.string().optional()
});

const resultSchema = z.object({
  home_score: z.coerce.number().int().min(0).max(99),
  away_score: z.coerce.number().int().min(0).max(99)
});

type SeasonForm = z.output<typeof seasonSchema>;
type SeasonFormInput = z.input<typeof seasonSchema>;
type MatchdayForm = z.output<typeof matchdaySchema>;
type MatchdayFormInput = z.input<typeof matchdaySchema>;
type ResultForm = z.output<typeof resultSchema>;
type ResultFormInput = z.input<typeof resultSchema>;

export default function AdminPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const groupQuery = useGroup(groupId);
  const seasonId = groupQuery.data?.active_season_id ?? null;
  const matchdaysQuery = useSeasonMatchdays(seasonId);
  const currentMatchdayId = matchdaysQuery.data?.[0]?.id;
  const matchdayQuery = useMatchday(currentMatchdayId);
  const currentMatch = matchdayQuery.data?.matches?.[0];

  const seasonForm = useForm<SeasonFormInput, unknown, SeasonForm>({
    resolver: zodResolver(seasonSchema),
    defaultValues: { name: "Temporada 1", win_points: 3, draw_points: 1, loss_points: 0, no_show_points: -1 }
  });
  const matchdayForm = useForm<MatchdayFormInput, unknown, MatchdayForm>({
    resolver: zodResolver(matchdaySchema),
    defaultValues: { title: "Rodada 1", scheduled_for: new Date().toISOString().slice(0, 10), notes: "" }
  });
  const resultForm = useForm<ResultFormInput, unknown, ResultForm>({
    resolver: zodResolver(resultSchema),
    values: {
      home_score: currentMatch?.home_score ?? 0,
      away_score: currentMatch?.away_score ?? 0
    }
  });

  const createSeason = useMutation({
    mutationFn: (values: SeasonForm) =>
      apiFetch(`/groups/${groupId}/seasons`, {
        method: "POST",
        body: values,
        token
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["group", groupId] });
    }
  });

  const createMatchday = useMutation({
    mutationFn: (values: MatchdayForm) =>
      apiFetch(`/seasons/${seasonId}/matchdays`, {
        method: "POST",
        body: {
          ...values,
          notes: values.notes || null
        },
        token
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["season", seasonId, "matchdays"] });
    }
  });

  const lockMatchday = useMutation({
    mutationFn: () =>
      apiFetch(`/matchdays/${currentMatchdayId}/lock`, {
        method: "POST",
        token
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["matchday", currentMatchdayId] }),
        queryClient.invalidateQueries({ queryKey: ["season", seasonId, "matchdays"] })
      ]);
    }
  });

  const submitResult = useMutation({
    mutationFn: (values: ResultForm) =>
      apiFetch(`/matches/${currentMatch?.id}/result`, {
        method: "POST",
        body: { ...values, goals: [] },
        token
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["matchday", currentMatchdayId] }),
        queryClient.invalidateQueries({ queryKey: ["season", seasonId, "standings"] }),
        queryClient.invalidateQueries({ queryKey: ["season", seasonId, "player-stats"] })
      ]);
    }
  });

  const inviteMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ join_code: string; join_link: string }>(`/groups/${groupId}/invite`, {
        method: "POST",
        token
      })
  });

  if (groupQuery.isLoading || matchdaysQuery.isLoading || matchdayQuery.isLoading) {
    return <div className="text-sm text-slate-600">Carregando painel admin...</div>;
  }

  if (groupQuery.error || matchdaysQuery.error || matchdayQuery.error) {
    const error = groupQuery.error || matchdaysQuery.error || matchdayQuery.error;
    return <div className="text-sm text-danger">Erro ao carregar admin: {String(error)}</div>;
  }

  const group = groupQuery.data;
  const matchday = matchdayQuery.data;

  return (
    <RoleGate group={group} userId={user?.id} requireAdmin>
      <div className="space-y-4">
        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Convite do Grupo</CardTitle>
              <CardDescription>Gere um link para enviar no WhatsApp.</CardDescription>
            </div>
            <Button onClick={() => inviteMutation.mutate()} disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? "Gerando..." : "Gerar convite"}
            </Button>
          </div>
          {inviteMutation.data && (
            <div className="space-y-2 rounded-xl border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Código</p>
              <p className="font-mono text-sm font-semibold">{inviteMutation.data.join_code}</p>
              <p className="text-xs text-slate-500">Link</p>
              <p className="break-all text-sm">{inviteMutation.data.join_link}</p>
            </div>
          )}
          {inviteMutation.error && (
            <p className="text-sm text-danger">
              {inviteMutation.error instanceof ApiError ? inviteMutation.error.message : "Falha ao gerar convite"}
            </p>
          )}
        </Card>

        <Card className="space-y-3">
          <div>
            <CardTitle>Temporada</CardTitle>
            <CardDescription>Criar/renovar a temporada ativa com regras de pontuação.</CardDescription>
          </div>
          {seasonId && (
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-700">
              Temporada ativa ID: {seasonId}
            </div>
          )}
          <form className="space-y-3" onSubmit={seasonForm.handleSubmit((values) => createSeason.mutate(values))}>
            <div className="space-y-1">
              <Label htmlFor="season-name">Nome</Label>
              <Input id="season-name" {...seasonForm.register("name")} />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-1">
                <Label>W</Label>
                <Input type="number" {...seasonForm.register("win_points")} />
              </div>
              <div className="space-y-1">
                <Label>D</Label>
                <Input type="number" {...seasonForm.register("draw_points")} />
              </div>
              <div className="space-y-1">
                <Label>L</Label>
                <Input type="number" {...seasonForm.register("loss_points")} />
              </div>
              <div className="space-y-1">
                <Label>NO_SHOW</Label>
                <Input type="number" {...seasonForm.register("no_show_points")} />
              </div>
            </div>
            {createSeason.error && (
              <p className="text-sm text-danger">
                {createSeason.error instanceof ApiError ? createSeason.error.message : "Falha ao criar temporada"}
              </p>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={createSeason.isPending}>
              {createSeason.isPending ? "Salvando..." : "Criar temporada"}
            </Button>
          </form>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rodada</CardTitle>
              <CardDescription>Crie a rodada atual e acompanhe o estado (aberta/lock).</CardDescription>
            </div>
            {matchday && <Badge>{matchday.is_locked ? "LOCK" : "ABERTA"}</Badge>}
          </div>

          <form className="space-y-3" onSubmit={matchdayForm.handleSubmit((values) => createMatchday.mutate(values))}>
            <div className="space-y-1">
              <Label htmlFor="round-title">Título</Label>
              <Input id="round-title" {...matchdayForm.register("title")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="round-date">Data</Label>
              <Input id="round-date" type="date" {...matchdayForm.register("scheduled_for")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="round-notes">Notas (opcional)</Label>
              <Input id="round-notes" {...matchdayForm.register("notes")} />
            </div>
            {createMatchday.error && (
              <p className="text-sm text-danger">
                {createMatchday.error instanceof ApiError ? createMatchday.error.message : "Falha ao criar rodada"}
              </p>
            )}
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              size="lg"
              disabled={createMatchday.isPending || !seasonId}
            >
              {createMatchday.isPending ? "Criando..." : "Criar rodada"}
            </Button>
          </form>

          {matchday && (
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-sm font-semibold">{matchday.title}</p>
              <p className="text-xs text-slate-500">
                {new Date(matchday.scheduled_for).toLocaleDateString("pt-BR")} ·{" "}
                {matchday.attendance.length} presenças registradas
              </p>
              <div className="mt-3 grid gap-2">
                <Button
                  size="lg"
                  onClick={() => lockMatchday.mutate()}
                  disabled={lockMatchday.isPending || matchday.is_locked}
                >
                  {lockMatchday.isPending ? "Gerando..." : matchday.is_locked ? "Rodada já travada" : "Lock + Gerar Times"}
                </Button>
                {lockMatchday.error && (
                  <p className="text-sm text-danger">
                    {lockMatchday.error instanceof ApiError ? lockMatchday.error.message : "Falha no lock"}
                  </p>
                )}
              </div>
              {!!matchday.teams.length && (
                <div className="mt-3 grid gap-2">
                  {matchday.teams.map((team) => (
                    <div key={team.team_id} className="rounded-xl bg-slate-50 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{team.name}</p>
                        <span className="text-xs text-slate-600">Força {team.total_rating}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {team.players.map((p) => p.player_name).join(", ") || "Sem jogadores"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="space-y-3">
          <div>
            <CardTitle>Lançar placar</CardTitle>
            <CardDescription>Atualiza standings e stats da temporada.</CardDescription>
          </div>
          {!currentMatch ? (
            <p className="text-sm text-slate-500">Faça o lock da rodada para gerar o jogo automático.</p>
          ) : (
            <form className="space-y-3" onSubmit={resultForm.handleSubmit((values) => submitResult.mutate(values))}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Time A</Label>
                  <Input type="number" min={0} {...resultForm.register("home_score")} />
                </div>
                <div className="space-y-1">
                  <Label>Time B</Label>
                  <Input type="number" min={0} {...resultForm.register("away_score")} />
                </div>
              </div>
              {submitResult.error && (
                <p className="text-sm text-danger">
                  {submitResult.error instanceof ApiError ? submitResult.error.message : "Falha ao lançar resultado"}
                </p>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={submitResult.isPending}>
                {submitResult.isPending ? "Salvando..." : "Salvar resultado"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </RoleGate>
  );
}
