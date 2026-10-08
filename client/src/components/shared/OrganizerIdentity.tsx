import { Link } from "react-router-dom";
import type { Organizer } from "../../types/event";

export default function OrganizerIdentity({
  organizer,
}: {
  organizer: Organizer;
}) {
  return (
    <Link
      className="poppin-organizer-identity"
      to={"/organizers/" + organizer._id}
    >
      <span className="poppin-identity-avatar" aria-hidden="true">
        {organizer.logoUrl ? (
          <img src={organizer.logoUrl} alt="" loading="lazy" />
        ) : (
          organizer.name.slice(0, 2).toUpperCase()
        )}
      </span>
      <span>{organizer.name}</span>
    </Link>
  );
}
