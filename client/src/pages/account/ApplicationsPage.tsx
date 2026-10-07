import { useState } from "react";
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import useResource from "../../hooks/useResource";
import type { VendorApplicationListItem } from "../../types/vendorApplication";
import ResourceState from "../../components/shared/ResourceState";
import VendorApplicationCard from "../../components/vendors/VendorApplicationCard";
import { PageContainer, PageHeader } from "../../components/layout/Page";
import { ButtonLink } from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import Tabs from "../../components/ui/Tabs";
import { useAuth } from "../../auth/context";
export default function ApplicationsPage() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const organizer =
    !!user?.organizerId && (!!eventId || params.get("view") === "incoming");
  const location = useLocation();
  const [status, setStatus] = useState("all");
  const resource = useResource<VendorApplicationListItem[]>(
    `/vendor-applications?view=${organizer ? "incoming" : "outgoing"}`,
  );
  const applications =
    resource.data?.filter(
      (application) =>
        (!eventId || application.vendorCall.event._id === eventId) &&
        (status === "all" || application.status === status),
    ) || [];
  return (
    <PageContainer>
      <Link to={eventId ? `/events/${eventId}` : "/profile"}>
        ← {eventId ? "Your event" : "Your profile"}
      </Link>
      <PageHeader
        eyebrow={
          organizer ? "Build your market lineup" : "Your next market chapter"
        }
        title={organizer ? "Vendor applications" : "My applications"}
        description={
          organizer
            ? "Get to know the local businesses ready to join your event. Every accepted vendor becomes part of the lineup."
            : "All your market plans, from first application to confirmed spot."
        }
        motif="woven-bracelets"
        actions={
          !organizer ? (
            <>
              <ButtonLink to="/opportunities">Find opportunities ↗</ButtonLink>
              <ButtonLink variant="outline" to="/confirmed-events">
                Confirmed events
              </ButtonLink>
            </>
          ) : undefined
        }
      />
      {typeof location.state?.message === "string" && (
        <Alert variant="success">{location.state.message}</Alert>
      )}
      {!eventId && user?.organizerId && (
        <Tabs
          label="Application activity"
          value={organizer ? "incoming" : "outgoing"}
          onChange={(value) => {
            setStatus("all");
            setParams(value === "incoming" ? { view: "incoming" } : {});
          }}
          items={[
            { value: "outgoing", label: "My applications" },
            { value: "incoming", label: "For my events" },
          ]}
        >
          <p className="mt-4">
            {organizer
              ? "Applications from businesses joining the events you host."
              : "Applications you’ve sent to other local events."}
          </p>
        </Tabs>
      )}
      <Tabs
        label="Application status"
        value={status}
        onChange={setStatus}
        items={[
          { value: "all", label: "All" },
          { value: "pending", label: "Pending" },
          { value: "accepted", label: "Accepted" },
          { value: "rejected", label: "Rejected" },
          { value: "withdrawn", label: "Withdrawn" },
        ]}
      >
        <ResourceState
          {...resource}
          empty={
            !applications.length
              ? "No applications in this view yet. Your next local connection could be just around the corner."
              : ""
          }
          action={
            !organizer ? (
              <ButtonLink to="/opportunities">Browse opportunities</ButtonLink>
            ) : undefined
          }
        />
        <div className="poppin-record-list">
          {applications.map((application) => (
            <VendorApplicationCard
              key={application._id}
              application={application}
              review={organizer}
              reload={resource.reload}
            />
          ))}
        </div>
      </Tabs>
    </PageContainer>
  );
}
