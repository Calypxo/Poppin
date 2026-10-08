import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarClock, MapPin, Store } from "lucide-react";
import type {
  VendorCall,
  VendorCallAvailability,
} from "../../types/vendorCall";
import type { ReactNode } from "react";
import { useAuth } from "../../auth/context";
import Card from "../ui/Card";
import { ButtonLink } from "../ui/Button";
import StatusBadge from "../shared/StatusBadge";
import OrganizerIdentity from "../shared/OrganizerIdentity";
import { eventDate } from "../home/eventFormatting";
import { EventPoster } from "../home/EventPresentation";

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
  const remaining = availability?.statistics.slotsRemaining;
  const availablePercent =
    remaining === undefined
      ? 0
      : Math.min(
          100,
          Math.max(0, (remaining / Math.max(1, call.totalSlots)) * 100),
        );
  const requirements = [...new Set(call.requirements)];
  return (
    <Card
      className={
        "poppin-opportunity-card" +
        (detailed ? " poppin-opportunity-detailed" : "")
      }
    >
      {!detailed && (
        <Link
          className="poppin-opportunity-cover"
          to={"/events/" + call.event._id}
          aria-label={"View " + call.event.title}
        >
          <EventPoster event={call.event} contain />
        </Link>
      )}
      <div className="poppin-opportunity-body">
        <div className="poppin-opportunity-kicker">
          <span>
            <Store size={15} aria-hidden="true" />
            VENDOR OPPORTUNITY
          </span>
          <StatusBadge
            status={availability?.availability.status || call.status}
          />
        </div>
        <h2>{call.title}</h2>
        {call.event.organizer && (
          <OrganizerIdentity organizer={call.event.organizer} />
        )}
        <p
          className={
            detailed
              ? "poppin-preserve-lines"
              : "poppin-opportunity-description"
          }
        >
          {call.description}
        </p>
        <Link
          className="poppin-opportunity-event"
          to={"/events/" + call.event._id}
        >
          <MapPin size={15} aria-hidden="true" />
          <span>
            {call.event.title}
            {call.event.venue?.city ? " · " + call.event.venue.city : ""}
          </span>
        </Link>
        <dl className="poppin-recruitment-facts">
          <div>
            <dt>
              <CalendarClock size={14} aria-hidden="true" />
              Apply by
            </dt>
            <dd>{eventDate(call.applicationDeadline)}</dd>
          </div>
          <div>
            <dt>Booth fee</dt>
            <dd>
              {new Intl.NumberFormat("en-PH", {
                style: "currency",
                currency: "PHP",
                maximumFractionDigits: 0,
              }).format(call.boothFee)}
            </dd>
          </div>
          {call.boothSize && (
            <div>
              <dt>Booth size</dt>
              <dd>{call.boothSize}</dd>
            </div>
          )}
        </dl>
        {remaining !== undefined && (
          <div className="poppin-capacity-summary">
            <div>
              <span>Available spaces</span>
              <strong>
                {remaining} / {call.totalSlots}
              </strong>
            </div>
            <div className="poppin-capacity-track" aria-hidden="true">
              <span style={{ width: availablePercent + "%" }} />
            </div>
          </div>
        )}
        {detailed && (
          <div className="poppin-recruitment-requirements">
            <h3>What the organizer is looking for</h3>
            <p>
              <strong>Categories: </strong>
              {call.acceptedCategories
                .map((category) => category.name)
                .join(" · ") || "All business categories"}
            </p>
            {requirements.length > 0 && (
              <ul>
                {requirements.map((requirement) => (
                  <li key={requirement}>{requirement}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        {children || (
          <div className="poppin-opportunity-actions">
            <ButtonLink
              variant="outline"
              size="sm"
              to={"/events/" + call.event._id}
            >
              View event
            </ButtonLink>
            {availability?.availability.canApply &&
              (user ? (
                <ButtonLink
                  size="sm"
                  to={"/vendor-application/" + call._id}
                  icon={<ArrowUpRight size={16} aria-hidden="true" />}
                >
                  Apply as vendor
                </ButtonLink>
              ) : (
                <ButtonLink
                  size="sm"
                  to="/login"
                  state={{ from: "/vendor-application/" + call._id }}
                >
                  Log in to apply
                </ButtonLink>
              ))}
          </div>
        )}
      </div>
    </Card>
  );
}
