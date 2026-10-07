import { Link } from "react-router-dom";
import type { Organizer } from "../../types/event";
export default function OrganizerIdentity({
  organizer,
}: {
  organizer: Organizer;
}) {
  return (
    <div className="poppin-person">
      <span className="poppin-avatar poppin-avatar-small">
        {organizer.logoUrl ? (
          <img src={organizer.logoUrl} alt={`${organizer.name} logo`} />
        ) : (
          organizer.name.slice(0, 2)
        )}
      </span>
      <Link to={`/organizers/${organizer._id}`}>{organizer.name}</Link>
    </div>
  );
}
