"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type {
  Group,
  MatchDay,
  MatchDayListItem,
  Player,
  PlayerStatsResponse,
  StandingsResponse
} from "@/lib/types";

export function useGroup(groupId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["group", groupId],
    queryFn: () => apiFetch<Group>(`/groups/${groupId}`, { token }),
    enabled: !!token
  });
}

export function useGroupPlayers(groupId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["group", groupId, "players"],
    queryFn: () => apiFetch<Player[]>(`/groups/${groupId}/players`, { token }),
    enabled: !!token
  });
}

export function useSeasonMatchdays(seasonId?: number | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["season", seasonId, "matchdays"],
    queryFn: () => apiFetch<MatchDayListItem[]>(`/seasons/${seasonId}/matchdays`, { token }),
    enabled: !!token && !!seasonId
  });
}

export function useMatchday(matchdayId?: number | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["matchday", matchdayId],
    queryFn: () => apiFetch<MatchDay>(`/matchdays/${matchdayId}`, { token }),
    enabled: !!token && !!matchdayId
  });
}

export function useStandings(seasonId?: number | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["season", seasonId, "standings"],
    queryFn: () => apiFetch<StandingsResponse>(`/seasons/${seasonId}/standings`, { token }),
    enabled: !!token && !!seasonId
  });
}

export function usePlayerStats(seasonId?: number | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["season", seasonId, "player-stats"],
    queryFn: () => apiFetch<PlayerStatsResponse>(`/seasons/${seasonId}/player-stats`, { token }),
    enabled: !!token && !!seasonId
  });
}

