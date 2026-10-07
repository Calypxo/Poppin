import { Link } from "react-router-dom";
import type {
  VendorCall,
  VendorCallAvailability,
} from "../../types/vendorCall";
import type { ReactNode } from "react";
import { useAuth } from "../../auth/context";
import Card from "../ui/Card";
import { ButtonLink } from "../ui/Button";
import StatusBadge from "../shared/StatusBadge";
import { eventDate } from "../home/eventFormatting";
export default function VendorOpportunityCard({
  call,
  availability,
  children,
  detailed = false,
}: {
  call: VendorCall;
  availability?: VendorCallAvailability;
  children?: ReactNode;
  detailed?: boolean;
}) {
  const { user } = useAuth();
  return (
    <Card variant="ticket">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="poppin-eyebrow">A spot at the market</span>
        <StatusBadge
          status={availability?.availability.status || call.status}
        />
      </div>
      <h2 className="mt-4">{call.title}</h2>
      <p>
        By{" "}
        <Link to={`/organizers/${call.event.organizer?._id}`}>
          {call.event.organizer?.name}
        </Link>
      </p>
      <p>{call.description}</p>
      <p>
        <Link to={`/events/${call.event._id}`}>{call.event.title}</Link> ·{" "}
        {call.event.venue?.city}
      </p>
      <dl className="poppin-opportunity-meta">
        <div>
          <dt>Apply by</dt>
          <dd>{eventDate(call.applicationDeadline)}</dd>
        </div>
        <div>
          <dt>Booth fee</dt>
          <dd>₱{call.boothFee.toLocaleString()}</dd>
        </div>
        {availability && (
          <div>
            <dt>Available spaces</dt>
            <dd>{availability.statistics.slotsRemaining} slots left</dd>
          </div>
        )}
        {call.boothSize && (
          <div>
            <dt>Booth size</dt>
            <dd>{call.boothSize}</dd>
          </div>
        )}
      </dl>
      {detailed && (
        <>
          <p>
            <strong>Categories:</strong>{" "}
            {call.acceptedCategories
              .map((category) => category.name)
              .join(" · ") || "All business categories"}
          </p>
          <ul className="list-disc pl-5">
            {call.requirements.map((requirement, index) => (
              <li key={index}>{requirement}</li>
            ))}
          </ul>
        </>
      )}
      {children || (
        <div className="poppin-actions">
          <ButtonLink
            variant="outline"
            size="sm"
            to={`/events/${call.event._id}`}
          >
            View event ↗
          </ButtonLink>
          {availability?.availability.canApply &&
            (user ? (
              <ButtonLink size="sm" to={`/vendor-application/${call._id}`}>
                Apply as vendor
              </ButtonLink>
            ) : !user ? (
              <ButtonLink
                size="sm"
                to="/login"
                state={{ from: `/vendor-application/${call._id}` }}
              >
                Log in to apply
              </ButtonLink>
            ) : null)}
        </div>
      )}
    </Card>
  );
}
