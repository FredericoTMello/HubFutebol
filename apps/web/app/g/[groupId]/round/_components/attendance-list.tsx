import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import type { MatchDay, Player } from "@/lib/types";

const statusLabel = {
  CONFIRMED: "Confirmado",
  DECLINED: "Ausente",
  NO_SHOW: "No-show"
} as const;

type AttendanceListProps = {
  attendance: MatchDay["attendance"];
  players: Player[];
};

export function AttendanceList({ attendance, players }: AttendanceListProps) {
  const attendanceMap = new Map(attendance.map((item) => [item.player_id, item.status]));

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <CardTitle>Lista de Presencas</CardTitle>
        <Badge>{attendance.length} respostas</Badge>
      </div>

      <ul className="space-y-2">
        {players.map((player) => {
          const status = attendanceMap.get(player.id);

          return (
            <li
              key={player.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
            >
              <div>
                <p className="text-sm font-semibold text-ink">{player.nickname || player.name}</p>
                <p className="text-xs text-slate-500">
                  {player.position || "SEM POSICAO"} · Forca {player.skill_rating}
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
  );
}
