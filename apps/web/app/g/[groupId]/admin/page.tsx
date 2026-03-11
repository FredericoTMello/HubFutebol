"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { PageErrorState, PageLoadingState } from "@/components/app/page-state";
import { RoleGate } from "@/components/app/role-gate";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useGroup, useMatchday, useSeasonMatchdays } from "@/lib/group-hooks";

import { InviteCard } from "./_components/invite-card";
import { MatchdayManager } from "./_components/matchday-manager";
import {
  matchdaySchema,
  resultSchema,
  seasonSchema,
  type MatchdayFormInput,
  type MatchdayFormValues,
  type ResultFormInput,
  type ResultFormValues,
  type SeasonFormInput,
  type SeasonFormValues
} from "./_components/forms";
import { ResultForm } from "./_components/result-form";
import { SeasonForm } from "./_components/season-form";

export default function AdminPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const groupQuery = useGroup(groupId);
  const seasonId = groupQuery.data?.active_season_id ?? null;
  const matchdaysQuery = useSeasonMatchdays(seasonId);
  const currentMatchdayId = matchdaysQuery.data?.[0]?.id;
  const matchdayQuery = useMatchday(currentMatchdayId);
  const currentMatch = matchdayQuery.data?.matches?.[0] ?? null;

  const seasonForm = useForm<SeasonFormInput, unknown, SeasonFormValues>({
    resolver: zodResolver(seasonSchema),
    defaultValues: { name: "Temporada 1", win_points: 3, draw_points: 1, loss_points: 0, no_show_points: -1 }
  });
  const matchdayForm = useForm<MatchdayFormInput, unknown, MatchdayFormValues>({
    resolver: zodResolver(matchdaySchema),
    defaultValues: { title: "Rodada 1", scheduled_for: new Date().toISOString().slice(0, 10), notes: "" }
  });
  const resultForm = useForm<ResultFormInput, unknown, ResultFormValues>({
    resolver: zodResolver(resultSchema),
    values: {
      home_score: currentMatch?.home_score ?? 0,
      away_score: currentMatch?.away_score ?? 0
    }
  });

  const createSeason = useMutation({
    mutationFn: (values: SeasonFormValues) =>
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
    mutationFn: (values: MatchdayFormValues) =>
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
    mutationFn: (values: ResultFormValues) =>
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
    return <PageLoadingState message="Carregando painel admin..." />;
  }

  if (groupQuery.error || matchdaysQuery.error || matchdayQuery.error) {
    const error = groupQuery.error || matchdaysQuery.error || matchdayQuery.error;
    return <PageErrorState message="Erro ao carregar admin" error={error} />;
  }

  const group = groupQuery.data;
  const matchday = matchdayQuery.data ?? null;

  return (
    <RoleGate group={group} userId={user?.id} requireAdmin>
      <div className="space-y-4">
        <InviteCard inviteMutation={inviteMutation} />
        <SeasonForm
          form={seasonForm}
          seasonId={seasonId}
          isPending={createSeason.isPending}
          error={createSeason.error}
          onSubmit={(values) => createSeason.mutate(values)}
        />
        <MatchdayManager
          form={matchdayForm}
          seasonId={seasonId}
          matchday={matchday}
          isCreating={createMatchday.isPending}
          createError={createMatchday.error}
          isLocking={lockMatchday.isPending}
          lockError={lockMatchday.error}
          onCreateMatchday={(values) => createMatchday.mutate(values)}
          onLockMatchday={() => lockMatchday.mutate()}
        />
        <ResultForm
          currentMatch={currentMatch}
          form={resultForm}
          isPending={submitResult.isPending}
          error={submitResult.error}
          onSubmit={(values) => submitResult.mutate(values)}
        />
      </div>
    </RoleGate>
  );
}
