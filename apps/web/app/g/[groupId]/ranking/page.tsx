"use client";

import { useParams } from "next/navigation";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useGroup, usePlayerStats, useStandings } from "@/lib/group-hooks";

export default function RankingPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const groupQuery = useGroup(groupId);
  const seasonId = groupQuery.data?.active_season_id ?? null;
  const standingsQuery = useStandings(seasonId);
  const statsQuery = usePlayerStats(seasonId);

  if (groupQuery.isLoading || standingsQuery.isLoading || statsQuery.isLoading) {
    return <div className="text-sm text-slate-600">Carregando ranking...</div>;
  }

  if (groupQuery.error || standingsQuery.error || statsQuery.error) {
    const error = groupQuery.error || standingsQuery.error || statsQuery.error;
    return <div className="text-sm text-danger">Erro ao carregar ranking: {String(error)}</div>;
  }

  if (!seasonId) {
    return (
      <Card>
        <CardTitle>Sem temporada ativa</CardTitle>
        <CardDescription>Crie uma temporada em Admin para habilitar ranking e estatísticas.</CardDescription>
      </Card>
    );
  }

  const standings = standingsQuery.data?.items ?? [];
  const stats = statsQuery.data?.items ?? [];

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div>
          <CardTitle>Tabela da Temporada</CardTitle>
          <CardDescription>Pontos configurados por regra da temporada (W/D/L/NO_SHOW).</CardDescription>
        </div>
        <div className="space-y-2">
          {standings.length === 0 && <p className="text-sm text-slate-500">Ainda sem resultados lançados.</p>}
          {standings.map((item, index) => (
            <div key={item.player_id} className="grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-xl border border-slate-200 p-3">
              <div className="text-center text-sm font-bold text-brand-700">{index + 1}</div>
              <div>
                <p className="text-sm font-semibold text-ink">{item.player_name}</p>
                <p className="text-xs text-slate-500">
                  J {item.games_played} · W {item.wins} · D {item.draws} · L {item.losses} · NS {item.no_shows}
                </p>
              </div>
              <div className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-bold text-white">{item.points} pts</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <div>
          <CardTitle>Stats dos Jogadores</CardTitle>
          <CardDescription>Artilharia e participações acumuladas na temporada.</CardDescription>
        </div>
        <div className="space-y-2">
          {stats.length === 0 && <p className="text-sm text-slate-500">Sem stats ainda.</p>}
          {stats.map((item) => (
            <div key={item.player_id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">{item.player_name}</p>
                <div className="flex gap-2 text-xs">
                  <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-700">
                    {item.goals} gols
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                    {item.appearances} pres.
                  </span>
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500">No-shows: {item.no_shows}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
