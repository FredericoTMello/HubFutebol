import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function PageLoadingState({ message }: { message: string }) {
  return <div className="text-sm text-slate-600">{message}</div>;
}

export function PageErrorState({
  message,
  error
}: {
  message: string;
  error: unknown;
}) {
  return <div className="text-sm text-danger">{message}: {String(error)}</div>;
}

export function PageEmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </Card>
  );
}
