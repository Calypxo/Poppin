import { ArrowLeft, ArrowUpRight, Compass } from "lucide-react";
import { ButtonLink } from "../../components/ui/Button";
import { PageContainer } from "../../components/layout/Page";

export default function NotFoundPage() {
  return (
    <PageContainer className="poppin-not-found">
      <div className="poppin-not-found-number" aria-hidden="true">
        4<Compass />4
      </div>
      <p className="poppin-eyebrow">A SMALL DETOUR</p>
      <h1>This spot isn’t on the map.</h1>
      <p>
        The page may have moved, but there are plenty of good things to
        discover.
      </p>
      <div className="poppin-actions">
        <ButtonLink
          to="/discover"
          icon={<ArrowUpRight size={18} aria-hidden="true" />}
        >
          Explore events
        </ButtonLink>
        <ButtonLink
          variant="outline"
          to="/"
          icon={<ArrowLeft size={17} aria-hidden="true" />}
        >
          Back to home
        </ButtonLink>
      </div>
    </PageContainer>
  );
}
