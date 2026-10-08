import Card from "../ui/Card";
import { ButtonLink } from "../ui/Button";
import { CalendarPlus, ArrowUpRight } from "lucide-react";

export default function ProfileSetupPrompt({ returnTo }: { returnTo: string }) {
  return (
    <Card className="poppin-setup-prompt">
      <div className="poppin-feature-icon">
        <CalendarPlus size={28} aria-hidden="true" />
      </div>
      <p className="poppin-eyebrow">MAKE SOMETHING HAPPEN</p>
      <h2>Become an organizer</h2>
      <p>
        Add your organizer name and public contact details, then create your
        first event.
      </p>
      <p>You can host events and join other markets with this same account.</p>
      <ButtonLink
        to={`/profile/edit?section=organizer&returnTo=${encodeURIComponent(returnTo)}`}
      >
        Create organizer profile <ArrowUpRight size={17} aria-hidden="true" />
      </ButtonLink>
    </Card>
  );
}
