"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import { PageEmptyState, PageErrorState, PageLoadingState } from "@/components/app/page-state";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useGroup, useGroupPlayers, useMatchday, useSeasonMatchdays } from "@/lib/group-hooks";

import { AttendanceForm } from "./_components/attendance-form";
import { AttendanceList } from "./_components/attendance-list";

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

  const attendanceMutation = useMutation({
    mutationFn: (values: { player_id: number; status: "CONFIRMED" | "DECLINED" | "NO_SHOW" }) =>
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
    return <PageLoadingState message="Carregando rodada..." />;
  }

  if (groupQuery.error || playersQuery.error || matchdaysQuery.error || matchdayQuery.error) {
    const error = groupQuery.error || playersQuery.error || matchdaysQuery.error || matchdayQuery.error;
    return <PageErrorState message="Erro ao carregar dados" error={error} />;
  }

  if (!seasonId) {
    return (
      <PageEmptyState
        title="Nenhuma temporada ativa"
        description="Um admin precisa criar a temporada em Admin para iniciar o ranking."
      />
    );
  }

  if (!currentMatchday || !matchdayQuery.data) {
    return (
      <PageEmptyState
        title="Nenhuma rodada cadastrada"
        description="Crie a rodada atual na aba Admin para comecar as confirmacoes."
      />
    );
  }

  const matchday = matchdayQuery.data;
  const sortedPlayers = [...(playersQuery.data ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-4">
      <AttendanceForm
        matchday={matchday}
        players={sortedPlayers}
        userId={user?.id}
        isPending={attendanceMutation.isPending}
        error={attendanceMutation.error}
        onSubmit={(values) => attendanceMutation.mutate(values)}
      />
      <AttendanceList attendance={matchday.attendance} players={sortedPlayers} />
    </div>
  );
}
