import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./context";
import { ErrorState, LoadingState } from "../components/ui/States";
import ProfileSetupPrompt from "../components/profiles/ProfileSetupPrompt";
export default function ProtectedRoute({
  requireOrganizer = false,
}: {
  requireOrganizer?: boolean;
}) {
  const { user, loading, error, refresh } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <main className="poppin-page">
        <LoadingState label="Restoring your session…" />
      </main>
    );
  if (error)
    return (
      <main className="poppin-page">
        <ErrorState description={error} onRetry={() => void refresh(true)} />
      </main>
    );
  if (!user)
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  if (requireOrganizer && !user.organizerId)
    return (
      <main className="poppin-page poppin-form-page">
        <ProfileSetupPrompt returnTo={location.pathname} />
      </main>
    );
  return <Outlet />;
}
