"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PageErrorState, PageLoadingState } from "@/components/app/page-state";
import { RoleGate } from "@/components/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useGroup, useGroupPlayers } from "@/lib/group-hooks";
import type { Player } from "@/lib/types";

const playerSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  nickname: z.string().optional(),
  position: z.string().optional(),
  skill_rating: z.coerce.number().int().min(1).max(10)
});

type PlayerForm = z.output<typeof playerSchema>;
type PlayerFormInput = z.input<typeof playerSchema>;

export default function PlayersPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const groupQuery = useGroup(groupId);
  const playersQuery = useGroupPlayers(groupId);

  const form = useForm<PlayerFormInput, unknown, PlayerForm>({
    resolver: zodResolver(playerSchema),
    defaultValues: { name: "", nickname: "", position: "", skill_rating: 5 }
  });

  const createPlayer = useMutation({
    mutationFn: (values: PlayerForm) =>
      apiFetch<Player>(`/groups/${groupId}/players`, {
        method: "POST",
        body: {
          ...values,
          nickname: values.nickname || null,
          position: values.position || null
        },
        token
      }),
    onSuccess: async () => {
      form.reset({ name: "", nickname: "", position: "", skill_rating: 5 });
      await queryClient.invalidateQueries({ queryKey: ["group", groupId, "players"] });
    }
  });

  const toggleActive = useMutation({
    mutationFn: (payload: { playerId: number; is_active: boolean }) =>
      apiFetch<Player>(`/players/${payload.playerId}`, {
        method: "PATCH",
        body: { is_active: payload.is_active },
        token
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["group", groupId, "players"] });
    }
  });

  if (groupQuery.isLoading || playersQuery.isLoading) {
    return <PageLoadingState message="Carregando jogadores..." />;
  }

  if (groupQuery.error || playersQuery.error) {
    const error = groupQuery.error || playersQuery.error;
    return <PageErrorState message="Erro ao carregar jogadores" error={error} />;
  }

  const group = groupQuery.data;
  const players = [...(playersQuery.data ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  const membership = group?.memberships.find((item) => item.user_id === user?.id);
  const canAdmin = membership?.role === "OWNER" || membership?.role === "ADMIN";

  return (
    <div className="space-y-4">
      <RoleGate group={group} userId={user?.id}>
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Jogadores</CardTitle>
              <CardDescription>Cadastro por grupo, com posicao e nivel para balancear os times.</CardDescription>
            </div>
            <Badge>{players.length}</Badge>
          </div>

          <ul className="space-y-2">
            {players.map((player) => (
              <li
                key={player.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {player.nickname || player.name}{" "}
                    {!player.is_active && <span className="text-xs text-slate-500">(inativo)</span>}
                  </p>
                  <p className="text-xs text-slate-500">
                    {player.position || "SEM POSICAO"} · Forca {player.skill_rating}
                    {player.user_id === user?.id ? " · vinculado a voce" : ""}
                  </p>
                </div>

                {canAdmin && (
                  <Button
                    size="sm"
                    variant={player.is_active ? "outline" : "secondary"}
                    onClick={() => toggleActive.mutate({ playerId: player.id, is_active: !player.is_active })}
                    disabled={toggleActive.isPending}
                  >
                    {player.is_active ? "Inativar" : "Ativar"}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <RoleGate group={group} userId={user?.id} requireAdmin>
          <Card className="space-y-3">
            <div>
              <CardTitle>Adicionar jogador</CardTitle>
              <CardDescription>Admins podem cadastrar jogadores do grupo (com ou sem conta vinculada).</CardDescription>
            </div>

            <form className="space-y-3" onSubmit={form.handleSubmit((values) => createPlayer.mutate(values))}>
              <div className="space-y-1">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" placeholder="Ex: Joao Silva" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-danger">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="nickname">Apelido</Label>
                <Input id="nickname" placeholder="Ex: Jao" {...form.register("nickname")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="position">Posicao</Label>
                  <Input id="position" placeholder="DEF/MID/FWD" {...form.register("position")} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="skill_rating">Forca (1-10)</Label>
                  <Input id="skill_rating" type="number" min={1} max={10} {...form.register("skill_rating")} />
                </div>
              </div>
              {createPlayer.error && (
                <p className="text-sm text-danger">
                  {createPlayer.error instanceof ApiError ? createPlayer.error.message : "Falha ao cadastrar"}
                </p>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={createPlayer.isPending}>
                {createPlayer.isPending ? "Salvando..." : "Cadastrar jogador"}
              </Button>
            </form>
          </Card>
        </RoleGate>
      </RoleGate>
    </div>
  );
}
