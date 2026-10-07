import { EmptyState, ErrorState, LoadingState } from "../ui/States";
import type { ReactNode } from "react";
export default function ResourceState({
  loading,
  error,
  empty,
  reload,
  action,
}: {
  loading: boolean;
  error: string;
  empty?: string;
  reload?: () => void;
  action?: ReactNode;
}) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={reload} />;
  return empty ? <EmptyState description={empty} action={action} /> : null;
}
