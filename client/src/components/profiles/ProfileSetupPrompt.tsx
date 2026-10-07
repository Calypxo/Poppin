import Card from "../ui/Card";
import { ButtonLink } from "../ui/Button";

export default function ProfileSetupPrompt({ returnTo }: { returnTo: string }) {
  return (
    <Card variant="paper">
      <p className="poppin-eyebrow">Your next local chapter</p>
      <h2>Become an organizer</h2>
      <p>
        Add your organizer name and public contact details, then create your
        first event.
      </p>
      <p>You can host events and join other markets with this same account.</p>
      <ButtonLink
        to={`/profile/edit?section=organizer&returnTo=${encodeURIComponent(returnTo)}`}
      >
        Create organizer profile
      </ButtonLink>
    </Card>
  );
}
