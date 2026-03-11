import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";

type InviteMutationState = {
  mutate: () => void;
  isPending: boolean;
  error: unknown;
  data?: {
    join_code: string;
    join_link: string;
  };
};

export function InviteCard({ inviteMutation }: { inviteMutation: InviteMutationState }) {
  return (
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

      {inviteMutation.data ? (
        <div className="space-y-2 rounded-xl border border-slate-200 p-3">
          <p className="text-xs text-slate-500">Codigo</p>
          <p className="font-mono text-sm font-semibold">{inviteMutation.data.join_code}</p>
          <p className="text-xs text-slate-500">Link</p>
          <p className="break-all text-sm">{inviteMutation.data.join_link}</p>
        </div>
      ) : null}

      {inviteMutation.error ? (
        <p className="text-sm text-danger">
          {inviteMutation.error instanceof ApiError ? inviteMutation.error.message : "Falha ao gerar convite"}
        </p>
      ) : null}
    </Card>
  );
}
