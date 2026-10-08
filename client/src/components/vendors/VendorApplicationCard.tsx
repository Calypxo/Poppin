import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BadgeCheck, CalendarDays, Check, X } from "lucide-react";
import api from "../../api/client";
import { errorMessage } from "../../hooks/useResource";
import type { VendorApplicationListItem } from "../../types/vendorApplication";
import Card from "../ui/Card";
import Button, { ButtonLink } from "../ui/Button";
import Alert from "../ui/Alert";
import Modal from "../ui/Modal";
import FormField from "../forms/FormField";
import { Textarea } from "../ui/FormControls";
import StatusBadge from "../shared/StatusBadge";
import { useUI } from "../ui/context";
export default function VendorApplicationCard({
  application,
  reload,
  review = false,
}: {
  application: VendorApplicationListItem;
  reload: () => void;
  review?: boolean;
}) {
  const { confirm, toast } = useUI();
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [details, setDetails] = useState(false);
  async function act(status: "accepted" | "rejected" | "withdrawn") {
    const label =
      status === "withdrawn"
        ? "Withdraw"
        : status === "accepted"
          ? "Accept"
          : "Reject";
    if (
      !(await confirm({
        title: `${label} this application?`,
        description:
          status === "accepted"
            ? `${application.businessName} will join the public vendor lineup. The event must still have an available space.`
            : status === "rejected"
              ? "Your decision and review note will be visible to the vendor."
              : "This removes your pending application from consideration. You will not be able to resubmit to this call.",
        confirmLabel:
          status === "accepted" ? "Accept vendor" : `${label} application`,
        cancelLabel: "Keep application",
        variant: status === "accepted" ? "primary" : "danger",
      }))
    )
      return;
    setBusy(true);
    setError("");
    try {
      if (status === "withdrawn")
        await api.patch(`/vendor-applications/${application._id}`, { status });
      else
        await api.patch(`/vendor-applications/${application._id}/status`, {
          status,
          organizerRemarks: remarks,
        });
      toast.success(
        status === "accepted"
          ? "Vendor accepted. The lineup is taking shape!"
          : status === "rejected"
            ? "Application rejected with your review note."
            : "Application withdrawn.",
      );
      reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="poppin-application-card">
      <div className="poppin-application-heading">
        <div>
          <p className="poppin-eyebrow">
            {application.category?.name || "Local business"}
          </p>
          <h2>{application.businessName}</h2>
          {review && (
            <p className="poppin-application-applicant">
              Applied by {application.representativeName}
            </p>
          )}
        </div>
        <StatusBadge status={application.status} />
      </div>
      <p>
        <Link to={`/events/${application.vendorCall.event._id}`}>
          {application.vendorCall.event.title}
        </Link>{" "}
        · {application.vendorCall.title}
      </p>
      <p className="line-clamp-2">
        {application.businessDescription || application.products}
      </p>
      {application.status === "accepted" && (
        <p className="poppin-confirmed-label">
          <BadgeCheck size={16} aria-hidden="true" />
          Confirmed vendor
        </p>
      )}
      {application.organizerRemarks && (
        <div className="poppin-application-note">
          <strong>Organizer note</strong>
          <p>{application.organizerRemarks}</p>
        </div>
      )}
      <div className="poppin-application-summary">
        <small>
          <CalendarDays size={14} aria-hidden="true" />
          Sent{" "}
          {new Date(application.createdAt).toLocaleDateString("en-PH", {
            timeZone: "Asia/Manila",
          })}
        </small>
        <div className="poppin-actions">
          <Button size="sm" variant="outline" onClick={() => setDetails(true)}>
            Application details
          </Button>
          {application.vendor && (
            <ButtonLink
              size="sm"
              variant="ghost"
              to={`/vendors/${application.vendor._id}`}
            >
              Business profile ↗
            </ButtonLink>
          )}
        </div>
      </div>
      {application.status === "pending" &&
        (review ? (
          <div className="mt-6">
            <FormField
              id={`review-${application._id}`}
              label="Review note"
              hint="A note is required when rejecting an application."
            >
              <Textarea
                rows={3}
                value={remarks}
                maxLength={2000}
                onChange={(event) => setRemarks(event.target.value)}
              />
            </FormField>
            <div className="poppin-actions">
              <Button
                loading={busy}
                icon={<Check size={16} aria-hidden="true" />}
                onClick={() => void act("accepted")}
              >
                Accept vendor
              </Button>
              <Button
                variant="danger"
                icon={<X size={16} aria-hidden="true" />}
                disabled={busy || !remarks.trim()}
                onClick={() => void act("rejected")}
              >
                Reject application
              </Button>
            </div>
          </div>
        ) : (
          <div className="poppin-actions">
            <Button
              variant="outline"
              loading={busy}
              onClick={() => void act("withdrawn")}
            >
              Withdraw application
            </Button>
          </div>
        ))}
      {error && <Alert variant="error">{error}</Alert>}
      <Modal
        open={details}
        onClose={() => setDetails(false)}
        title={application.businessName}
        description={application.vendorCall.event.title}
        size="lg"
        footer={
          <Button
            variant="outline"
            icon={<ArrowUpRight size={16} aria-hidden="true" />}
            onClick={() => setDetails(false)}
          >
            Back to applications
          </Button>
        }
      >
        <StatusBadge status={application.status} />
        <h3 className="mt-6 font-bold">About the business</h3>
        <p className="poppin-preserve-lines mt-2">
          {application.businessDescription}
        </p>
        <p className="mt-4">
          <strong>{application.category?.name}</strong> · {application.products}
        </p>
        <div className="poppin-application-note">
          <strong>Application note</strong>
          <p>{application.notes || "No additional note."}</p>
        </div>
        {review && (
          <>
            <h3 className="font-bold">Contact for this application</h3>
            <p>{application.representativeName}</p>
            <p>
              {application.email} · {application.contactNumber}
            </p>
          </>
        )}
        {application.socialMedia && (
          <p className="mt-4">Social page: {application.socialMedia}</p>
        )}
        {application.organizerRemarks && (
          <div className="poppin-application-note">
            <strong>Organizer note</strong>
            <p>{application.organizerRemarks}</p>
          </div>
        )}
      </Modal>
    </Card>
  );
}
