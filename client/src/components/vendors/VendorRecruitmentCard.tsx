import { useId, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  Pencil,
  Store,
  Trash2,
  Wallet,
} from "lucide-react";
import type { VendorCall } from "../../types/vendorCall";
import { eventDate } from "../home/eventFormatting";
import StatusBadge from "../shared/StatusBadge";
import Button, { ButtonLink } from "../ui/Button";
import Card from "../ui/Card";

const dateOptions: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

export default function VendorRecruitmentCard({
  call,
  deleting,
  onEdit,
  onDelete,
}: {
  call: VendorCall;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const descriptionId = useId();
  const headingId = useId();
  const [expanded, setExpanded] = useState(false);
  const canExpand = call.description.length > 180;
  const description = canExpand && !expanded
    ? call.description.slice(0, 180).replace(/\s+\S*$/, "") + "…"
    : call.description;

  return (
    <Card className="poppin-recruitment-card" aria-labelledby={headingId}>
      <div className="recruitment-card-header">
        <span><Store size={15} aria-hidden="true" /> VENDOR CALL</span>
        <StatusBadge status={call.status} />
      </div>
      <h3 id={headingId}>{call.title}</h3>
      <Link className="recruitment-event-link" to={`/events/${call.event._id}`}>
        <span>{call.event.title}</span>
        <ArrowUpRight size={14} aria-hidden="true" />
      </Link>
      <div className="recruitment-card-description">
        <p id={descriptionId}>{description}</p>
        {canExpand && (
          <button
            type="button"
            className="recruitment-read-more"
            aria-expanded={expanded}
            aria-controls={descriptionId}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Show less" : "Read full description"}
            <ChevronDown size={14} aria-hidden="true" />
          </button>
        )}
      </div>
      <dl className="recruitment-card-facts">
        <div>
          <dt><CalendarDays size={15} aria-hidden="true" /> Opens</dt>
          <dd><time dateTime={call.applicationStartDate}>{eventDate(call.applicationStartDate, dateOptions)}</time></dd>
        </div>
        <div>
          <dt><CalendarClock size={15} aria-hidden="true" /> Apply by</dt>
          <dd><time dateTime={call.applicationDeadline}>{eventDate(call.applicationDeadline, dateOptions)}</time></dd>
        </div>
        <div>
          <dt><Store size={15} aria-hidden="true" /> Total spaces</dt>
          <dd>{call.totalSlots.toLocaleString("en-PH")} <span>vendors</span></dd>
        </div>
        <div>
          <dt><Wallet size={15} aria-hidden="true" /> Booth fee</dt>
          <dd>{new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 2,
            minimumFractionDigits: 0,
          }).format(call.boothFee)}</dd>
        </div>
      </dl>
      {call.boothSize && (
        <p className="recruitment-booth-size"><span>Booth size</span> {call.boothSize}</p>
      )}
      <div className="recruitment-card-actions">
        <ButtonLink
          size="sm"
          to={`/events/${call.event._id}/applications`}
          icon={<ArrowUpRight size={16} aria-hidden="true" />}
        >
          View applications
        </ButtonLink>
        <div className="recruitment-manage-actions">
          <Button size="sm" variant="outline" onClick={onEdit} disabled={deleting}
            icon={<Pencil size={14} aria-hidden="true" />}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" className="recruitment-delete"
            loading={deleting} onClick={onDelete}
            icon={<Trash2 size={14} aria-hidden="true" />}>
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
